import type { Context } from 'koishi'
import type { Config } from '../config'
import { steamGet } from './http'

const API_BASE = 'https://api.steampowered.com/'
type SteamResponse<T> = { response?: T }

export class SteamApiClient {
  private cursor = 0
  private cooldown = new Map<string, number>()
  private cache = new Map<string, { expires: number, value: unknown }>()

  constructor(private ctx: Context, private config: Config) {}

  async get<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
    const cacheKey = `${path}:${JSON.stringify(params)}`
    const cached = this.cache.get(cacheKey)
    if (cached && cached.expires > Date.now()) return cached.value as T
    if (!this.config.apiKeys.length) throw new Error('🔑 管理员尚未配置 Steam Web API Key。')

    let lastError: unknown
    for (let attempt = 0; attempt < this.config.apiKeys.length; attempt++) {
      const key = this.nextKey()
      try {
        const result = await steamGet<SteamResponse<T>>(this.ctx, this.config, 'data', `${API_BASE}${path}`, {
          params: { key, l: 'schinese', cc: this.config.countryCode, language: 'schinese', ...params },
          timeout: this.config.timeout * 1000,
        })
        const value = result.response || (result as T)
        if (this.config.cacheSeconds) this.cache.set(cacheKey, { value, expires: Date.now() + this.config.cacheSeconds * 1000 })
        return value as T
      } catch (error) {
        lastError = error
        const status = Number((error as any)?.response?.status || (error as any)?.status)
        if (status === 429) this.cooldown.set(key, Date.now() + 10 * 60 * 1000)
        else throw error
      }
    }
    throw lastError instanceof Error ? lastError : new Error('⚠️ Steam API 请求失败。')
  }

  private nextKey() {
    const now = Date.now()
    const usable = this.config.apiKeys.filter(key => (this.cooldown.get(key) || 0) <= now)
    const pool = usable.length ? usable : this.config.apiKeys
    const key = pool[this.cursor % pool.length]
    this.cursor = (this.cursor + 1) % Number.MAX_SAFE_INTEGER
    return key
  }
}
