import { renderHelp } from '../render/help'
import { handle, imageReply, type CommandServices } from './context'
import { steamCommands } from '../shared/command-names'
import { addRenderOptions, commandRenderPolicy } from './render-policy'

export function registerHelpCommands(services: CommandServices) {
  const { ctx, config } = services
  const help = addRenderOptions(ctx.command(steamCommands.help.command, '📖 Steam 功能帮助')
    .alias(steamCommands.help.chinese)
    .alias(steamCommands.help.english))
  help.action(({ session, options }) => handle(config, session, () => imageReply(config, renderHelp(ctx, config, commandRenderPolicy(options))), true))
}
