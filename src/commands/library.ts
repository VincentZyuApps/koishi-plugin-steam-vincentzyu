import { renderGames } from '../render/games'
import { handle, imageReply, profileAndGames, type CommandServices } from './context'
import { steamCommands } from '../shared/command-names'
import { addRenderOptions, commandRenderPolicy } from './render-policy'

export function registerLibraryCommands(services: CommandServices) {
  const { ctx, config } = services
  const inventory = addRenderOptions(ctx.command(`${steamCommands.inventory.command} [target:text]`, '🎒 查看 Steam 库存图片')
    .alias(steamCommands.inventory.chinese)
    .alias(steamCommands.inventory.english))
  inventory.action(({ session, options }, target) => handle(config, session, async () => {
    const policy = commandRenderPolicy(options)
    const { profile, games } = await profileAndGames(services, session, target, false)
    return imageReply(config, renderGames(ctx, config, '🎒 Steam 库存', profile, games, games.length, false, policy))
  }, true))
  const recent = addRenderOptions(ctx.command(`${steamCommands.recent.command} [target:text]`, '🕹️ 查看 Steam 近两周游玩游戏')
    .alias(steamCommands.recent.chinese)
    .alias(steamCommands.recent.english))
  recent.action(({ session, options }, target) => handle(config, session, async () => {
    const policy = commandRenderPolicy(options)
    const { profile, games } = await profileAndGames(services, session, target, true)
    return imageReply(config, renderGames(ctx, config, '🕹️ Steam 最近游玩', profile, games, games.length, true, policy))
  }, true))
}
