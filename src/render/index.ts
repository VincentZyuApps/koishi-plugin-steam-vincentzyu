import type { Context } from 'koishi'
import {} from 'koishi-plugin-puppeteer'
import type { Config } from '../config'
import { resolveFontCss } from './font'
import { allStyles, escapeHtml, layout } from './template-loader'

export interface RenderPageOptions {
  title: string
  subtitle?: string
  content: string
  fontText: string
  source: string
}

export async function renderPage(ctx: Context, config: Config, options: RenderPageOptions) {
  const page = await ctx.puppeteer.page()
  try {
    const html = layout({
      STYLES: allStyles(),
      FONT_CSS: resolveFontCss(config, `🎮 koishi-plugin-steam-vincentzyu ${options.title} ${options.subtitle || ''} ${options.fontText}`),
      TITLE: escapeHtml(options.title),
      SUBTITLE: options.subtitle ? `<p>${escapeHtml(options.subtitle)}</p>` : '',
      CONTENT: options.content,
      FOOTER: [
        'KOISHI-PLUGIN-STEAM-VINCENTZYU',
        `数据来源：${options.source}`,
        `生成于 ${formatGeneratedAt()} (UTC+8)`,
        '非官方，未获 Valve/Steam 认可',
      ].map(escapeHtml).map(value => `<span>${value}</span>`).join(''),
    })
    await page.setViewport({ width: config.imageWidth, height: 900, deviceScaleFactor: 1 })
    await page.setContent(html)
    await page.evaluate(async () => {
      await (document as any).fonts?.ready
      await Promise.all(Array.from(document.images).map((node) => node.complete ? Promise.resolve() : new Promise(resolve => {
        node.addEventListener('load', resolve, { once: true })
        node.addEventListener('error', resolve, { once: true })
      })))
    }).catch(() => undefined)
    const sheet = await page.$('.sheet')
    if (!sheet) throw new Error('🖼️ 渲染页面缺少 .sheet 根容器。')
    const result = await sheet.screenshot({ type: config.imageType, ...(config.imageType === 'png' ? {} : { quality: config.screenshotQuality }) } as any)
    return Buffer.isBuffer(result) ? result : Buffer.from(result, 'base64')
  } finally {
    await page.close().catch(() => undefined)
  }
}

function formatGeneratedAt() {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value || ''
  return `${value('year')}-${value('month')}-${value('day')} ${value('hour')}:${value('minute')}:${value('second')}`
}
