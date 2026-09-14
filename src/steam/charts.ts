import type { Config } from '../config'
import type { RankEntry } from '../types'
import { SteamApiClient } from './client'
import { StoreService } from './store'

export class ChartsService {
  constructor(private api: SteamApiClient, private store: StoreService, private config: Config) {}

  async concurrentRanks() {
    const data = await this.api.get<any>('ISteamChartsService/GetGamesByConcurrentPlayers/v1/', { input_json: JSON.stringify(this.chartInput()) })
    return this.chartRanks(data.ranks, '👥 当前玩家', '📈 峰值')
  }

  async dailyRanks() {
    const data = await this.api.get<any>('ISteamChartsService/GetMostPlayedGames/v1/', { input_json: JSON.stringify(this.chartInput()) })
    return this.chartRanks(data.ranks, '📈 峰值', '🏆 排名')
  }

  async topNewReleases() {
    const data = await this.api.get<any>('ISteamChartsService/GetTopReleasesPages/v1/')
    const page = data.pages?.[0]
    const ids = (page?.item_ids || []).map((item: any) => item.appid)
    if (!ids.length) return []
    const items = await this.store.items(ids)
    return ids.map((appid: number, index: number) => this.store.toRank(items.get(appid), index + 1, page.name || '', '')).filter(Boolean) as RankEntry[]
  }

  private chartInput() {
    return { country_code: this.config.countryCode, context: { language: 'schinese', country_code: this.config.countryCode }, data_request: { include_basic_info: true } }
  }

  private chartRanks(entries: any[] = [], first: string, second: string) {
    return entries.map((entry) => this.store.toRank(entry.item, entry.rank, `${first}: ${entry.concurrent_in_game || entry.peak_in_game || '-'}`, `${second}: ${entry.peak_in_game || entry.last_week_rank || '-'}`)).filter(Boolean) as RankEntry[]
  }
}
