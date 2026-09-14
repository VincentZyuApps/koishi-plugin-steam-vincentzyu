import type { Context } from 'koishi'
import type { Config } from '../config'
import type { RankEntry, StorefrontItem, StorefrontSection } from '../types'
import { SteamApiClient } from './client'
import { steamGet } from './http'

export function headerImage(appid: number) {
  return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`
}

export class StoreService {
  constructor(private ctx: Context, private api: SteamApiClient, private config: Config) {}

  async featuredCategories(): Promise<StorefrontSection[]> {
    const data = await steamGet<Record<string, { items?: any[] }>>(this.ctx, this.config, 'data', 'https://store.steampowered.com/api/featuredcategories', {
      params: { cc: this.config.countryCode, l: 'schinese' },
      timeout: this.config.timeout * 1000,
    })
    const sections: Array<Pick<StorefrontSection, 'key' | 'title'>> = [
      { key: 'specials', title: '🏷️ 优惠' },
      { key: 'coming_soon', title: '📅 即将推出' },
      { key: 'top_sellers', title: '🔥 热销' },
      { key: 'new_releases', title: '🆕 新品' },
    ]
    return sections.map(section => ({
      ...section,
      items: (data[section.key]?.items || []).map(item => this.toStorefrontItem(item)),
    }))
  }

  async topSellers(lastWeek = false) {
    if (!lastWeek) {
      const input = {
        query_name: 'SteamCharts Live Top Sellers',
        context: { language: 'schinese', country_code: this.config.countryCode },
        query: { start: 0, count: 100, sort: 10, filters: { type_filters: { include_apps: true } } },
        data_request: { include_basic_info: true },
        overrideCountryCode: this.config.countryCode,
      }
      const data = await this.api.get<any>('IStoreQueryService/Query/v1/', { input_json: JSON.stringify(input) })
      return (data.store_items || []).map((item: any, index: number) => this.toRank(item, index + 1, '', '')).filter(Boolean) as RankEntry[]
    }
    const input = { country_code: this.config.countryCode, page_count: 100, context: { language: 'schinese', country_code: this.config.countryCode }, data_request: { include_basic_info: true } }
    const data = await this.api.get<any>('IStoreTopSellersService/GetWeeklyTopSellers/v1/', { input_json: JSON.stringify(input) })
    return (data.ranks || []).map((entry: any) => this.toRank(entry.item, entry.rank, `🕘 上周 ${entry.last_week_rank || '🆕 新上榜'}`, `📅 连续 ${entry.consecutive_weeks || 1} 周`)).filter(Boolean) as RankEntry[]
  }

  async items(appids: number[]) {
    const input = { ids: appids.map(appid => ({ appid })), context: { language: 'schinese', country_code: this.config.countryCode }, data_request: { include_basic_info: true, include_assets: true } }
    const data = await this.api.get<any>('IStoreBrowseService/GetItems/v1/', { input_json: JSON.stringify(input) })
    return new Map<number, any>((data.store_items || []).map((item: any) => [item.appid, item]))
  }

  toRank(item: any, rank: number, detail: string, description: string): RankEntry | undefined {
    if (!item?.appid) return undefined
    const price = item.best_purchase_option
    return { rank, appid: item.appid, name: item.name || String(item.appid), detail, description, image: headerImage(item.appid), price: item.is_free ? '🆓 免费' : price?.formatted_final_price }
  }

  private toStorefrontItem(item: any): StorefrontItem {
    const currency = typeof item.currency === 'string' && item.currency ? item.currency : 'CNY'
    const original = Number(item.original_price)
    const current = Number(item.final_price)
    const discounted = Boolean(item.discounted) && Number(item.discount_percent) > 0
    return {
      appid: Number(item.id),
      name: item.name || String(item.id),
      image: item.header_image || item.small_capsule_image || item.image,
      price: item.is_free ? '🆓 免费' : (Number.isFinite(current) && current > 0 ? this.formatPrice(current, currency) : (original > 0 ? this.formatPrice(original, currency) : '❔ 暂未定价')),
      originalPrice: discounted && original > 0 ? this.formatPrice(original, currency) : undefined,
      discount: discounted ? `-${item.discount_percent}%` : undefined,
      description: item.discount_expiration ? `⏳ 优惠至 ${formatTimestamp(Number(item.discount_expiration))}` : undefined,
    }
  }

  private formatPrice(cents: number, currency: string) {
    try {
      return new Intl.NumberFormat('zh-CN', { style: 'currency', currency }).format(cents / 100)
    } catch {
      return `${currency} ${(cents / 100).toFixed(2)}`
    }
  }
}

function formatTimestamp(timestamp: number) {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(timestamp * 1000))
}
