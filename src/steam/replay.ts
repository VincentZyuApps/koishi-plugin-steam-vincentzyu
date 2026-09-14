import type { Context } from 'koishi'
import type { Config } from '../config'
import type { RankEntry } from '../types'
import { SteamApiClient } from './client'
import { steamGet } from './http'
import { StoreService } from './store'

const STORE_BASE = 'https://store.steampowered.com/'

export class ReplayService {
  constructor(private ctx: Context, private api: SteamApiClient, private store: StoreService, private config: Config) {}

  async shareImage(steamId: string, year: number) {
    const data = await this.api.get<{ images?: Array<{ url_path?: string }> }>('ISaleFeatureService/GetUserYearInReviewShareImage/v1/', { steamid: steamId, year })
    const path = data.images?.[0]?.url_path
    return path ? `https://shared.akamai.steamstatic.com/social_sharing/${path}` : ''
  }

  async bestOfYear(type: string, year: number) {
    const html = await steamGet<string>(this.ctx, this.config, 'data', `${STORE_BASE}charts/bestofyear/bestof${year}`, { timeout: this.config.timeout * 1000 })
    const announcement = /ANNOUNCEMENT_GID&quot;:&quot;(\d+)/.exec(html)?.[1]
    if (!announcement) throw new Error(`🔎 未找到 ${year} 年度最佳页面。`)
    const event = await steamGet<any>(this.ctx, this.config, 'data', `${STORE_BASE}events/ajaxgetpartnerevent`, { params: { clan_accountid: 39049601, announcement_gid: announcement, lang_list: '6_0', last_modified_time: 0, for_edit: false }, timeout: this.config.timeout * 1000 })
    const sections = JSON.parse(String(event.event?.jsondata || '').replace(/\\u([\dA-Fa-f]{4})/g, (_all: string, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))).sale_sections || []
    const labels: Record<string, string> = { 畅销: '畅销', 新品: '新品', VR: 'VR', 抢先体验: '抢先体验', 热玩: '热玩', Deck: 'DECK', 控制器: '控制器' }
    const target = labels[type] || labels.热玩
    const index = sections.findIndex((section: any) => section.section_type === 'text_section' && Object.values(section.text_section_contents || {}).some((text: any) => String(text).includes('年度') && String(text).toUpperCase().includes(target.toUpperCase())))
    if (index < 0) throw new Error(`📭 ${year} 年没有“${target}”年度排行。`)
    const games: number[] = []
    for (let cursor = index + 1; cursor < sections.length && sections[cursor].section_type === 'items'; cursor++) games.push(...(sections[cursor].capsules || []).map((item: any) => Number(item.id)))
    const items = await this.store.items(games)
    return games.map((appid, index) => this.store.toRank(items.get(appid), index + 1, '', '')).filter(Boolean) as RankEntry[]
  }
}
