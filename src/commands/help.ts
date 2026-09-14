import { renderHelp } from '../render/help'
import { handle, imageReply, type CommandServices } from './context'

export function registerHelpCommands(services: CommandServices) {
  const { ctx, config } = services
  ctx.command('steam', '📖 Steam 功能帮助').alias('steam.help').alias('steam.帮助')
    .action(({ session }) => handle(config, session, () => imageReply(config, renderHelp(ctx, config)), true))
}
