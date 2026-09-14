import { renderGames } from '../render/games'
import { handle, imageReply, profileAndGames, type CommandServices } from './context'

export function registerLibraryCommands(services: CommandServices) {
  const { ctx, config } = services
  ctx.command('steam.库存 [target:text]', '🎒 查看 Steam 库存图片').action(({ session }, target) => handle(config, session, async () => {
    const { profile, games } = await profileAndGames(services, session, target, false)
    return imageReply(config, renderGames(ctx, config, '🎒 Steam 库存', profile, games, games.length))
  }, true))
  ctx.command('steam.游戏时长 [target:text]', '⏱️ 查看 Steam 游戏时长排行').action(({ session }, target) => handle(config, session, async () => {
    const { profile, games } = await profileAndGames(services, session, target, false)
    return imageReply(config, renderGames(ctx, config, '⏱️ Steam 游戏时长', profile, games, games.length))
  }, true))
  ctx.command('steam.最近游玩 [target:text]', '🕹️ 查看 Steam 近两周游玩游戏').action(({ session }, target) => handle(config, session, async () => {
    const { profile, games } = await profileAndGames(services, session, target, true)
    return imageReply(config, renderGames(ctx, config, '🕹️ Steam 最近游玩', profile, games, games.length, true))
  }, true))
}
