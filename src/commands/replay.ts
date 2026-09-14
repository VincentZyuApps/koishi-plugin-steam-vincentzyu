import { h } from 'koishi'
import { defaultReplayYear } from '../shared/format'
import { fetchSteamImage, shouldProxy } from '../steam/http'
import type { ReplayService } from '../steam/replay'
import { handle, reply, targetSteamId, type CommandServices } from './context'

export function registerReplayCommands(services: CommandServices, replay: ReplayService) {
  const { config } = services
  services.ctx.command('steam.年度回顾 [year:number] [target:text]', '📅 查看 Steam 年度回顾分享图').action(({ session }, year, target) => {
    const selectedYear = year || defaultReplayYear()
    if (!Number.isInteger(selectedYear) || selectedYear < 2003 || selectedYear > new Date().getFullYear()) return reply(config, session, '📅 请输入有效年份，例如 2024。')
    return handle(config, session, async () => {
      const steamId = await targetSteamId(services, session, target)
      const url = await replay.shareImage(steamId, selectedYear)
      if (!url) return `📭 ${selectedYear} 年度回顾未公开或尚未生成：https://store.steampowered.com/replay/${steamId}/${selectedYear}`
      if (!shouldProxy(config, 'images')) return h.image(url)
      const image = await fetchSteamImage(services.ctx, config, url)
      return h.image(image.data, image.mime)
    }, true)
  })
}
