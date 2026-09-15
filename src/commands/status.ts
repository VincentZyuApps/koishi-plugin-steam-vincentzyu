import { renderStatus } from '../render/status'
import { handle, imageReply, targetSteamId, type CommandServices } from './context'
import { steamCommands } from '../shared/command-names'
import { addRenderOptions, commandRenderPolicy } from './render-policy'

export function registerStatusCommands(services: CommandServices) {
  const { ctx, config, player } = services
  const command = addRenderOptions(ctx.command(`${steamCommands.status.command} [target:text]`, '👤 查看 Steam 个人状态资料卡')
    .alias(steamCommands.status.chinese)
    .alias(steamCommands.status.english))

  command.action(({ session, options }, target) => handle(config, session, async () => {
    const policy = commandRenderPolicy(options)
    const steamId = await targetSteamId(services, session, target)
    const profile = await player.statusProfile(steamId)
    return imageReply(config, renderStatus(ctx, config, profile, policy))
  }, true))
}
