import { Schema } from 'koishi'

export const FONT_MODE = {
  NPM_LXGW: 'npm-lxgw',
  CUSTOM_PATH: 'custom-path',
  SYSTEM_DEFAULT: 'system-default',
} as const

export type FontMode = typeof FONT_MODE[keyof typeof FONT_MODE]

export const PROXY_MODE = {
  DISABLED: 'disabled',
  DATA: 'data',
  DATA_AND_IMAGES: 'data-and-images',
} as const

export const PROXY_PROTOCOL = {
  HTTP: 'http',
  HTTPS: 'https',
  SOCKS4: 'socks4',
  SOCKS5: 'socks5',
  SOCKS5H: 'socks5h',
} as const

export type ProxyMode = typeof PROXY_MODE[keyof typeof PROXY_MODE]
export type ProxyProtocol = typeof PROXY_PROTOCOL[keyof typeof PROXY_PROTOCOL]

export interface Config {
  apiKeys: string[]
  countryCode: string
  timeout: number
  cacheSeconds: number
  proxyMode: ProxyMode
  proxy: {
    protocol: ProxyProtocol
    host: string
    port: number
  }
  enableQuote: boolean
  enableWaitingHint: boolean
  inventoryLimit: number
  rankingLimit: number
  storefrontSpecialsLimit: number
  storefrontComingSoonLimit: number
  storefrontTopSellersLimit: number
  storefrontNewReleasesLimit: number
  imageWidth: number
  imageType: 'png' | 'jpeg' | 'webp'
  screenshotQuality: number
  fontMode: FontMode
  customFontPath: string
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    apiKeys: Schema.array(Schema.string().role('secret'))
      .role('table')
      .default([])
      .description('🔑 Steam Web API Key 列表。请求会轮询负载均衡，收到 429 时临时避开对应 Key。'),
    countryCode: Schema.string().default('CN').description('🌍 商店地区代码，例如 CN、US、HK。'),
    timeout: Schema.number().min(3).max(60).step(1).default(15).description('⏱️ Steam API 请求超时（秒）。'),
    cacheSeconds: Schema.number().min(0).max(3600).step(10).default(120).description('💾 Steam 公共数据的进程内缓存时长（秒）。'),
  }).description('🎮 Steam 数据'),
  Schema.object({
    proxyMode: Schema.union([
      Schema.const(PROXY_MODE.DISABLED).description('🚫 不使用插件代理（默认）'),
      Schema.const(PROXY_MODE.DATA).description('📡 仅代理 Steam API 与商店页面'),
      Schema.const(PROXY_MODE.DATA_AND_IMAGES).description('🖼️ 同时代理数据与卡片图片'),
    ]).role('radio').default(PROXY_MODE.DISABLED).description('🚦 代理覆盖范围。图片模式会下载封面并内嵌到卡片，网络适应性更强但渲染更慢。'),
    proxy: Schema.object({
      protocol: Schema.union([
        Schema.const(PROXY_PROTOCOL.HTTP).description('HTTP 代理'),
        Schema.const(PROXY_PROTOCOL.HTTPS).description('HTTPS 代理'),
        Schema.const(PROXY_PROTOCOL.SOCKS4).description('SOCKS4 代理'),
        Schema.const(PROXY_PROTOCOL.SOCKS5).description('SOCKS5 代理'),
        Schema.const(PROXY_PROTOCOL.SOCKS5H).description('SOCKS5h 代理（远程 DNS）'),
      ]).role('radio').default(PROXY_PROTOCOL.HTTP).description('🧭 代理协议。'),
      host: Schema.string().default('127.0.0.1').description('🏠 代理服务器地址。'),
      port: Schema.number().min(1).max(65535).step(1).default(7891).description('🔌 代理服务器端口。'),
    }).description('🔗 代理连接信息，仅代理范围不是“关闭”时生效。'),
  }).description('🔌 网络与代理'),
  Schema.object({
    enableQuote: Schema.boolean().default(true).description('💬 Bot 回复时是否引用触发指令的消息。'),
    enableWaitingHint: Schema.boolean().default(true).description('⏳ 获取 Steam 数据或渲染图片时是否显示等待提示。'),
  }).description('💬 会话回复'),
  Schema.object({
    inventoryLimit: Schema.number().min(10).max(100).step(5).default(50).description('🎮 库存图最多展示的游戏数量。'),
    rankingLimit: Schema.number().min(5).max(100).step(5).default(20).description('🏆 排行榜图片最多展示的条目数。'),
    storefrontSpecialsLimit: Schema.number().min(0).max(100).step(1).default(10).description('🏷️ 特惠图“优惠”分区最多展示条数，0 表示完整展示。'),
    storefrontComingSoonLimit: Schema.number().min(0).max(100).step(1).default(10).description('📅 特惠图“即将推出”分区最多展示条数，0 表示完整展示。'),
    storefrontTopSellersLimit: Schema.number().min(0).max(100).step(1).default(10).description('🔥 特惠图“热销”分区最多展示条数，0 表示完整展示。'),
    storefrontNewReleasesLimit: Schema.number().min(0).max(100).step(1).default(10).description('🆕 特惠图“新品”分区最多展示条数，0 表示完整展示。'),
    imageWidth: Schema.number().min(640).max(1600).step(20).default(900).description('↔️ Puppeteer 卡片图宽度（px）。'),
    imageType: Schema.union([
      Schema.const('png'),
      Schema.const('jpeg'),
      Schema.const('webp'),
    ]).role('radio').default('png').description('🖼️ 输出图片格式。'),
    screenshotQuality: Schema.number().min(30).max(100).step(1).default(88).description('✨ JPEG / WebP 截图质量。'),
    fontMode: Schema.union([
      Schema.const(FONT_MODE.NPM_LXGW).description('📦 霞鹜文楷（npm 内置，默认）'),
      Schema.const(FONT_MODE.CUSTOM_PATH).description('📂 指定字体绝对路径'),
      Schema.const(FONT_MODE.SYSTEM_DEFAULT).description('🔤 系统默认字体'),
    ]).role('radio').default(FONT_MODE.NPM_LXGW).description('🔤 Puppeteer 所有卡片图使用的字体。'),
    customFontPath: Schema.string().default('').description('📂 自定义字体绝对路径，仅“指定字体绝对路径”模式生效。'),
  }).description('🖼️ Puppeteer 出图'),
])
