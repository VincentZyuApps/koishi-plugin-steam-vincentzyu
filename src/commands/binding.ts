import { renderBindings } from '../render/bindings'
import { handle, imageReply, reply, sessionUid, type CommandServices } from './context'

export function registerBindingCommands(services: CommandServices) {
  const { ctx, config, bindings, player } = services
  ctx.command('steam.绑定 <target:text>', '🪪 绑定 SteamID、数字好友码或 Steam 个人主页链接')
    .action(({ session }, target) => {
      if (!target) return reply(config, session, '🪪 请输入 SteamID、数字好友码或 Steam 个人主页链接。')
      return handle(config, session, async () => {
      const steamId = await player.resolveSteamId(target)
      await player.profile(steamId)
      await bindings.add(sessionUid(session), steamId)
      return `✅ 已绑定 ${steamId}，并设为主账号。`
      }, true)
    })

  ctx.command('steam.绑定列表', '📋 查看已绑定 Steam 账号').action(({ session }) => handle(config, session, async () => {
    const rows = await bindings.list(sessionUid(session))
    return rows.length ? imageReply(config, renderBindings(ctx, config, rows)) : '📭 尚未绑定 SteamID。'
  }, true))

  ctx.command('steam.切换 <index:number>', '⭐ 切换默认 Steam 账号').action(({ session }, index) => {
    if (!Number.isInteger(index) || index < 1) return reply(config, session, '🔢 请输入绑定列表中的有效序号。')
    return handle(config, session, async () => {
      const item = await bindings.switch(sessionUid(session), index)
      return item ? `✅ 已切换主账号为 ${item.steamId}。` : '🔎 未找到该绑定序号。'
    })
  })

  ctx.command('steam.解绑 <index:number>', '🔓 解除 Steam 账号绑定').action(({ session }, index) => {
    if (!Number.isInteger(index) || index < 1) return reply(config, session, '🔢 请输入绑定列表中的有效序号。')
    return handle(config, session, async () => {
      const item = await bindings.remove(sessionUid(session), index)
      return item ? `✅ 已解绑 ${item.steamId}。` : '🔎 未找到该绑定序号。'
    })
  })
}
