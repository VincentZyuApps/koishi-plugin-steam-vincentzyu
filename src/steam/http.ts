import type { Context } from 'koishi'
import type { HTTP } from '@koishijs/plugin-http'
import type {} from '@koishijs/plugin-proxy-agent'
import { PROXY_MODE, type Config } from '../config'

export type ProxyScope = 'data' | 'images'

const MAX_IMAGE_BYTES = 4 * 1024 * 1024

export function shouldProxy(config: Config, scope: ProxyScope) {
  return config.proxyMode === PROXY_MODE.DATA_AND_IMAGES
    || (scope === 'data' && config.proxyMode === PROXY_MODE.DATA)
}

export function proxyUrl(config: Config) {
  const host = config.proxy.host.trim()
  const port = Number(config.proxy.port)
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('🔌 代理已启用，但代理地址或端口无效。请检查“网络与代理”配置。')
  }
  return `${config.proxy.protocol}://${host}:${port}`
}

type SteamRequestConfig = Omit<HTTP.RequestConfig, 'proxyAgent'>

function requestProxy(config: Config, scope: ProxyScope) {
  return { proxyAgent: shouldProxy(config, scope) ? proxyUrl(config) : '' }
}

export function steamGet<T>(ctx: Context, config: Config, scope: ProxyScope, url: string, options: SteamRequestConfig = {}) {
  return (ctx.http as HTTP).get<T>(url, { ...options, ...requestProxy(config, scope) })
}

export function steamRequest<T>(ctx: Context, config: Config, scope: ProxyScope, url: string, options: SteamRequestConfig = {}) {
  return (ctx.http as HTTP)<T>(url, { ...options, ...requestProxy(config, scope) })
}

export interface SteamImage {
  data: Buffer
  mime: string
}

function imageMime(contentType: string | null, url: string) {
  const mime = contentType?.split(';', 1)[0].trim().toLowerCase()
  if (mime?.startsWith('image/')) return mime
  if (/\.png(?:$|[?#])/i.test(url)) return 'image/png'
  if (/\.webp(?:$|[?#])/i.test(url)) return 'image/webp'
  if (/\.gif(?:$|[?#])/i.test(url)) return 'image/gif'
  return 'image/jpeg'
}

export async function fetchSteamImage(ctx: Context, config: Config, url: string, timeoutMs = config.imageLoadTimeout * 1000): Promise<SteamImage> {
  const response = await steamRequest<ArrayBuffer>(ctx, config, 'images', url, {
    responseType: 'arraybuffer',
    timeout: timeoutMs,
  })
  const data = Buffer.from(response.data)
  if (data.byteLength > MAX_IMAGE_BYTES) throw new Error('🖼️ Steam 图片文件过大，已跳过内嵌。')
  return { data, mime: imageMime(response.headers.get('content-type'), url) }
}

export async function imageDataUrl(ctx: Context, config: Config, url: string, timeoutMs?: number) {
  const image = await fetchSteamImage(ctx, config, url, timeoutMs)
  return `data:${image.mime};base64,${image.data.toString('base64')}`
}
