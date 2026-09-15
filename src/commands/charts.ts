import type { ChartsService } from '../steam/charts'
import type { ReplayService } from '../steam/replay'
import type { StoreService } from '../steam/store'
import { defaultReplayYear } from '../shared/format'
import { steamCommands, type SteamCommandNames } from '../shared/command-names'
import { renderRanks } from '../render/ranks'
import { handle, imageReply, reply, type CommandServices } from './context'
import { addRenderOptions, commandRenderPolicy } from './render-policy'

export function registerChartsCommands(services: CommandServices, charts: ChartsService, store: StoreService, replay: ReplayService) {
  const { ctx, config } = services
  const rank = (names: SteamCommandNames, description: string, title: string, task: () => Promise<any[]>) => {
    const command = addRenderOptions(ctx.command(names.command, description)
      .alias(names.chinese)
      .alias(names.english))
    command.action(({ session, options }) => handle(config, session, async () => {
      const policy = commandRenderPolicy(options)
      const ranks = await task()
      return ranks.length ? imageReply(config, renderRanks(ctx, config, title, ranks, policy)) : '📭 Steam 暂未返回排行榜数据。'
    }, true))
  }

  rank(steamCommands.concurrent, '🔥 当前在线人数最高的游戏', '🔥 当前热玩排行榜', () => charts.concurrentRanks())
  rank(steamCommands.daily, '📈 每日峰值玩家排行', '📈 每日热玩排行榜', () => charts.dailyRanks())
  rank(steamCommands.newReleases, '🆕 Steam 月度热门新品', '🆕 热门新品排行榜', () => charts.topNewReleases())
  rank(steamCommands.topSellers, '🛒 Steam 当前热销游戏', '🛒 本周热销排行榜', () => store.topSellers(false))
  rank(steamCommands.lastWeekSellers, '🕘 Steam 上周热销游戏', '🕘 上周热销排行榜', () => store.topSellers(true))

  const bestOfYear = addRenderOptions(ctx.command(`${steamCommands.bestOfYear.command} [type:text] [year:number]`, '🏆 Steam 年度最佳排行')
    .alias(steamCommands.bestOfYear.chinese)
    .alias(steamCommands.bestOfYear.english))
  bestOfYear.action(({ session, options }, type, year) => {
    const selectedYear = year || defaultReplayYear()
    const selectedType = type || '热玩'
    const allowed = ['畅销', '新品', 'VR', '抢先体验', '热玩', 'Deck', '控制器']
    if (!allowed.includes(selectedType)) return reply(config, session, `🧭 排行类型应为：${allowed.join('、')}。`)
    if (!Number.isInteger(selectedYear) || selectedYear < 2003 || selectedYear > new Date().getFullYear()) return reply(config, session, '📅 请输入有效年份，例如 2024。')
    return handle(config, session, async () => {
      const policy = commandRenderPolicy(options)
      const ranks = await replay.bestOfYear(selectedType, selectedYear)
      return imageReply(config, renderRanks(ctx, config, `🏆 ${selectedYear} 年度${selectedType}排行`, ranks, policy))
    }, true)
  })
}
