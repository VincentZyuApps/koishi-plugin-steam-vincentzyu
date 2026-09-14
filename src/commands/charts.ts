import type { ChartsService } from '../steam/charts'
import type { ReplayService } from '../steam/replay'
import type { StoreService } from '../steam/store'
import { defaultReplayYear } from '../shared/format'
import { renderRanks } from '../render/ranks'
import { handle, imageReply, reply, type CommandServices } from './context'

export function registerChartsCommands(services: CommandServices, charts: ChartsService, store: StoreService, replay: ReplayService) {
  const { ctx, config } = services
  const rank = (command: string, description: string, title: string, task: () => Promise<any[]>) => {
    ctx.command(command, description).action(({ session }) => handle(config, session, async () => {
      const ranks = await task()
      return ranks.length ? imageReply(config, renderRanks(ctx, config, title, ranks)) : '📭 Steam 暂未返回排行榜数据。'
    }, true))
  }

  rank('steam.当前热玩', '🔥 当前在线人数最高的游戏', '🔥 当前热玩排行榜', () => charts.concurrentRanks())
  rank('steam.每日热玩', '📈 每日峰值玩家排行', '📈 每日热玩排行榜', () => charts.dailyRanks())
  rank('steam.热门新品', '🆕 Steam 月度热门新品', '🆕 热门新品排行榜', () => charts.topNewReleases())
  rank('steam.本周热销', '🛒 Steam 当前热销游戏', '🛒 本周热销排行榜', () => store.topSellers(false))
  rank('steam.上周热销', '🕘 Steam 上周热销游戏', '🕘 上周热销排行榜', () => store.topSellers(true))

  ctx.command('steam.年度排行 [type:text] [year:number]', '🏆 Steam 年度最佳排行').action(({ session }, type, year) => {
    const selectedYear = year || defaultReplayYear()
    const selectedType = type || '热玩'
    const allowed = ['畅销', '新品', 'VR', '抢先体验', '热玩', 'Deck', '控制器']
    if (!allowed.includes(selectedType)) return reply(config, session, `🧭 排行类型应为：${allowed.join('、')}。`)
    if (!Number.isInteger(selectedYear) || selectedYear < 2003 || selectedYear > new Date().getFullYear()) return reply(config, session, '📅 请输入有效年份，例如 2024。')
    return handle(config, session, async () => {
      const ranks = await replay.bestOfYear(selectedType, selectedYear)
      return imageReply(config, renderRanks(ctx, config, `🏆 ${selectedYear} 年度${selectedType}排行`, ranks))
    }, true)
  })
}
