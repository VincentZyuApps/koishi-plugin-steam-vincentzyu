import { h, Logger } from 'koishi'
import type { Context } from 'koishi'
import type { Config } from '../config'
import type { BindingRepository } from '../database/bindings'
import type { PlayerService } from '../steam/player'

const logger = new Logger('steam-vincentzyu')

export interface CommandServices {
  ctx: Context
  config: Config
  bindings: BindingRepository
  player: PlayerService
}

export function sessionUid(session: any) {
  return session.uid || `${session.platform}:${session.userId}`
}

export function imageReply(config: Config, buffer: Promise<Buffer>) {
  return buffer.then(result => h.image(result, `image/${config.imageType}`))
}

export function reply<T>(config: Config, session: any, content: T) {
  if (!config.enableQuote || !session?.messageId) return content
  return `${h.quote(session.messageId)}${content}`
}

export async function handle<T>(config: Config, session: any, task: () => Promise<T>, waiting = false) {
  const waitingMessageId = waiting ? await sendWaitingHint(config, session) : undefined
  try {
    return reply(config, session, await task())
  } catch (error) {
    logger.warn(error)
    return reply(config, session, errorMessage(error))
  } finally {
    await dismissWaitingHint(session, waitingMessageId)
  }
}

async function sendWaitingHint(config: Config, session: any) {
  if (!config.enableWaitingHint || !session?.send) return undefined
  try {
    const ids = await session.send(reply(config, session, '⏳ 正在获取 Steam 数据并渲染图片，请稍候... 🎨'))
    return ids?.[0]
  } catch (error) {
    logger.debug(error)
    return undefined
  }
}

async function dismissWaitingHint(session: any, messageId?: string) {
  if (!messageId || !session?.bot?.deleteMessage || !session?.channelId) return
  try {
    await session.bot.deleteMessage(session.channelId, messageId)
  } catch (error) {
    logger.debug(error)
  }
}

export async function targetSteamId(services: CommandServices, session: any, target?: string) {
  if (target?.trim()) return services.player.resolveSteamId(target)
  const primary = await services.bindings.primary(sessionUid(session))
  if (!primary) throw new Error('🔗 尚未绑定 SteamID。请先使用 steam.绑定 <SteamID>，或在命令后直接传入公开 SteamID。')
  return primary.steamId
}

export async function profileAndGames(services: CommandServices, session: any, target: string | undefined, recent: boolean) {
  const steamId = await targetSteamId(services, session, target)
  const [profile, games] = await Promise.all([services.player.profile(steamId), recent ? services.player.recentlyPlayed(steamId) : services.player.ownedGames(steamId)])
  if (!games.length) throw new Error(recent ? '📭 该账号近期没有可公开的游玩记录。' : '📭 该账号没有可公开的库存，或库存设置为私密。')
  return {
    profile,
    games: games.sort((a, b) => recent ? (b.playtime_2weeks || 0) - (a.playtime_2weeks || 0) : b.playtime_forever - a.playtime_forever),
  }
}

function errorMessage(error: unknown) {
  const status = Number((error as any)?.response?.status || (error as any)?.status)
  if (status === 401 || status === 403) return '🛡️ Steam 拒绝了请求，请检查 API Key 或目标资料是否公开。'
  if (status === 429) return '⏳ Steam API 当前限流，请稍后再试。'
  if (status === 404) return '🔎 Steam 未找到目标资源。'
  if (error instanceof Error) return /^\p{Extended_Pictographic}/u.test(error.message) ? error.message : `⚠️ ${error.message}`
  return '⚠️ Steam 数据请求失败，请稍后再试。'
}
