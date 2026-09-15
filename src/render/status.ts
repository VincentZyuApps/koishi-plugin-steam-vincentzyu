import type { Context } from 'koishi'
import type { Config } from '../config'
import type { SteamStatusProfile } from '../types'
import { friendCodeFromSteamId } from '../shared/steam-id'
import { headerImage } from '../steam/store'
import { renderPage } from './index'
import { escapeHtml, pageTemplate, partialTemplate } from './template-loader'
import { resolveSteamImages } from './views'
import type { RenderPolicy } from './policy'

const PERSONA_STATES: Record<number, string> = {
  0: '⚫ 离线', 1: '🟢 在线', 2: '⛔ 忙碌', 3: '🌙 离开', 4: '😴 打盹', 5: '🤝 想交易', 6: '🎮 想玩游戏',
}

export async function renderStatus(ctx: Context, config: Config, profile: SteamStatusProfile, policy?: Partial<RenderPolicy>) {
  const gameImage = profile.gameId ? headerImage(profile.gameId) : undefined
  const images = await resolveSteamImages(ctx, config, [profile.background, profile.avatar, profile.frame, gameImage], policy)
  const asset = (url: string | undefined, className: string, alt: string, placeholder = '') => {
    const source = url ? images.sources.get(url) : undefined
    return source ? `<img class="${className}" src="${escapeHtml(source)}" alt="${escapeHtml(alt)}">` : placeholder
  }
  const details = [
    ['🤝 好友代码', friendCodeFromSteamId(profile.steamId)],
    ['🆔 SteamID', profile.steamId],
    ['📅 注册时间', formatDate(profile.createdAt)],
    Number.isInteger(profile.level) ? ['🏅 Steam 等级', `Lv. ${profile.level}`] : undefined,
    profile.personaState === 0 && profile.lastLogoff ? ['🕘 最后在线', formatDate(profile.lastLogoff)] : undefined,
    profile.countryCode ? ['🌍 账号地区', displayRegion(profile.countryCode)] : undefined,
  ].filter((item): item is [string, string] => Boolean(item))
  const content = pageTemplate('status', {
    BACKGROUND: asset(profile.background, 'status-background', '', '<div class="status-background"></div>'),
    AVATAR: asset(profile.avatar, 'status-avatar-image', profile.name, '<div class="status-avatar-placeholder">STEAM</div>'),
    FRAME: asset(profile.frame, 'status-frame', '', ''),
    NAME: escapeHtml(profile.name),
    STATE: escapeHtml(PERSONA_STATES[profile.personaState] || '⚪ 其他'),
    STATE_CLASS: profile.gameId ? 'playing' : profile.personaState === 0 ? 'offline' : 'online',
    GAME: profile.gameId && profile.gameName ? partialTemplate('status-game', {
      IMAGE: asset(gameImage, 'status-game-image', profile.gameName),
      GAME_NAME: escapeHtml(profile.gameName),
    }) : '',
    DETAILS: details.map(([label, value]) => partialTemplate('status-detail', {
      LABEL: escapeHtml(label), VALUE: escapeHtml(value),
    })).join(''),
  })
  const fontText = ['👤 Steam 状态', '🌐 公开个人资料', '🎮 正在游玩', profile.name, PERSONA_STATES[profile.personaState] || '⚪ 其他', profile.gameName || '', ...details.flat()].join(' ')
  return renderPage(ctx, config, { title: '👤 Steam 状态', subtitle: '🌐 公开个人资料', content, fontText, source: 'Steam Web API / Steam Community', assetSummary: images.summary, renderPolicy: policy })
}

function formatDate(timestamp?: number) {
  if (!timestamp) return '❔ 未知'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(timestamp * 1000))
}

function displayRegion(code: string) {
  try {
    return new Intl.DisplayNames(['zh-CN'], { type: 'region' }).of(code) || code
  } catch {
    return code
  }
}
