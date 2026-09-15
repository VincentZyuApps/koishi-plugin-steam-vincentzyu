import type { Context } from 'koishi'
import type { Config } from '../config'
import type { RankEntry } from '../types'
import { renderPage } from './index'
import { escapeHtml, pageTemplate, partialTemplate } from './template-loader'
import { resolveSteamImages, steamImage } from './views'
import type { RenderPolicy } from './policy'

export async function renderRanks(ctx: Context, config: Config, title: string, ranks: RankEntry[], policy?: Partial<RenderPolicy>) {
  const shown = ranks.slice(0, config.rankingLimit)
  const images = await resolveSteamImages(ctx, config, shown.map(item => item.image), policy)
  const content = pageTemplate('ranks', {
    TOTAL: String(ranks.length),
    SHOWN: String(shown.length),
    RANKS: shown.map(item => partialTemplate('rank', {
      RANK: String(item.rank),
      IMAGE: steamImage(item.image ? images.sources.get(item.image) : undefined, item.name),
      NAME: escapeHtml(item.name),
      DESCRIPTION: escapeHtml([item.description, item.price].filter(Boolean).join(' · ')),
      DETAIL: escapeHtml(item.detail),
    })).join(''),
  })
  return renderPage(ctx, config, {
    title,
    subtitle: '🛒 Steam 商店数据 · 简体中文',
    content,
    fontText: `${title} 🛒 Steam 商店数据 📊 共 展示前 ${ranks.map(rank => `${rank.name} ${rank.detail} ${rank.description || ''}`).join(' ')}`,
    source: 'Steam 商店',
    assetSummary: images.summary,
    renderPolicy: policy,
  })
}
