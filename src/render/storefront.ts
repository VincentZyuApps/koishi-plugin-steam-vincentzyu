import type { Context } from 'koishi'
import type { Config } from '../config'
import type { StorefrontSection } from '../types'
import { renderPage } from './index'
import { escapeHtml, pageTemplate, partialTemplate } from './template-loader'
import { resolveSteamImages, steamImage } from './views'
import type { RenderPolicy } from './policy'

const limitByKey = {
  specials: 'storefrontSpecialsLimit',
  coming_soon: 'storefrontComingSoonLimit',
  top_sellers: 'storefrontTopSellersLimit',
  new_releases: 'storefrontNewReleasesLimit',
} as const

export async function renderStorefront(ctx: Context, config: Config, sections: StorefrontSection[], policy?: Partial<RenderPolicy>) {
  const shown = sections.map(section => {
    const limit = config[limitByKey[section.key]]
    return { ...section, total: section.items.length, items: limit ? section.items.slice(0, limit) : section.items }
  })
  const images = await resolveSteamImages(ctx, config, shown.flatMap(section => section.items.map(item => item.image)), policy)
  const content = pageTemplate('storefront', {
    SECTIONS: shown.map(section => partialTemplate('storefront-section', {
      TITLE: escapeHtml(section.title),
      TOTAL: String(section.total),
      COUNT_NOTE: ` · 📊 已显示 ${section.items.length} / 共 ${section.total} 项 · ⚙️ 配置可调整`,
      ITEMS: section.items.map((item, index) => partialTemplate('storefront-item', {
        RANK: String(index + 1),
        IMAGE: steamImage(item.image ? images.sources.get(item.image) : undefined, item.name),
        NAME: escapeHtml(item.name),
        PRICE: escapeHtml(item.price),
        ORIGINAL_PRICE: item.originalPrice ? `<s>${escapeHtml(item.originalPrice)}</s>` : '',
        DISCOUNT: item.discount ? `<span class="store-discount">${escapeHtml(item.discount)}</span>` : '',
        DESCRIPTION: escapeHtml(item.description || ''),
      })).join('') || '<div class="store-empty">📭 Steam 暂未返回该分区数据。</div>',
    })).join(''),
  })
  const fontText = shown.flatMap(section => [section.title, ...section.items.flatMap(item => [item.name, item.price, item.originalPrice || '', item.discount || '', item.description || ''])]).join(' ')
  return renderPage(ctx, config, {
    title: '🛒 Steam 商店推荐',
    subtitle: '🎁 优惠、即将推出、热销与新品 · 简体中文',
    content,
    fontText,
    source: 'Steam 商店',
    assetSummary: images.summary,
    renderPolicy: policy,
  })
}
