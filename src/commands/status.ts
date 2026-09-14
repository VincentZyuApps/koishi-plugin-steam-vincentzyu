import { renderStatus } from '../render/status'
import { handle, imageReply, targetSteamId, type CommandServices } from './context'

export function registerStatusCommands(services: CommandServices) {
  const { ctx, config, player } = services
  const command = ctx.command('steam.状态 [target:text]', '👤 查看 Steam 个人状态资料卡')
    .alias('steam.信息')
    .alias('steam.info')
    .alias('steam.status')

  command.action(({ session }, target) => handle(config, session, async () => {
    const steamId = await targetSteamId(services, session, target)
    const profile = await player.statusProfile(steamId)
    return imageReply(config, renderStatus(ctx, config, profile))
  }, true))
}
