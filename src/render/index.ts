import type { Context } from 'koishi'
import {} from 'koishi-plugin-puppeteer'
import type { Config } from '../config'
import { resolveFontCss } from './font'
import { allStyles, escapeHtml, layout } from './template-loader'
import { resolveConfigRenderPolicy, type RenderPolicy } from './policy'
import type { ImageLoadSummary } from './views'

export interface RenderDiagnostics {
  assets: ImageLoadSummary
  dom: {
    requested: number
    loaded: number
    failed: number
  }
  policy: RenderPolicy
  durationMs: number
}

type DiagnosedBuffer = Buffer & { renderDiagnostics?: RenderDiagnostics }

export interface RenderPageOptions {
  title: string
  subtitle?: string
  content: string
  fontText: string
  source: string
  pageClass?: string
  widthOffset?: number
  assetSummary?: ImageLoadSummary
  renderPolicy?: Partial<RenderPolicy>
}

export async function renderPage(ctx: Context, config: Config, options: RenderPageOptions) {
  const startedAt = Date.now()
  const policy = resolveConfigRenderPolicy(config, options.renderPolicy)
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
      PAGE_CLASS: options.pageClass || '',
    })
    const width = Math.min(1600, Math.max(640, config.imageWidth + (options.widthOffset || 0)))
    await page.setViewport({ width, height: 900, deviceScaleFactor: config.deviceScaleFactor })
    await page.setContent(html)
    const dom = await page.evaluate(async (timeoutMs, settleMs) => {
      await (document as any).fonts?.ready
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
      const loaded = await Promise.all(Array.from(document.images).map(async node => {
        if (!node.complete) {
          await Promise.race([
            new Promise(resolve => {
              node.addEventListener('load', resolve, { once: true })
              node.addEventListener('error', resolve, { once: true })
            }),
            wait(timeoutMs),
          ])
        }
        if (!node.complete || node.naturalWidth <= 0) return false
        try {
          await node.decode()
        } catch {
          return false
        }
        return node.naturalWidth > 0
      }))
      if (settleMs) await wait(settleMs)
      return {
        requested: loaded.length,
        loaded: loaded.filter(Boolean).length,
        failed: loaded.filter(value => !value).length,
      }
    }, policy.imageTimeoutMs, policy.settleMs).catch(() => ({ requested: 0, loaded: 0, failed: 0 }))
    const sheet = await page.$('.sheet')
    if (!sheet) throw new Error('🖼️ 渲染页面缺少 .sheet 根容器。')
    const result = await sheet.screenshot({ type: config.imageType, ...(config.imageType === 'png' ? {} : { quality: config.screenshotQuality }) } as any)
    const buffer: DiagnosedBuffer = Buffer.isBuffer(result) ? result : Buffer.from(result, 'base64')
    Object.defineProperty(buffer, 'renderDiagnostics', {
      value: {
        assets: options.assetSummary || { requested: 0, loaded: 0, failures: [] },
        dom,
        policy,
        durationMs: Date.now() - startedAt,
      } satisfies RenderDiagnostics,
      enumerable: false,
    })
    return buffer
  } finally {
    await page.close().catch(() => undefined)
  }
}

export function getRenderDiagnostics(buffer: Buffer): RenderDiagnostics | undefined {
  return (buffer as DiagnosedBuffer).renderDiagnostics
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
