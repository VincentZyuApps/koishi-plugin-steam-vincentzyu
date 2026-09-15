import type { Context } from 'koishi'
import type { Config } from '../config'
import type { SteamBinding } from '../types'
import { renderPage } from './index'
import { escapeHtml, pageTemplate, partialTemplate } from './template-loader'
import type { RenderPolicy } from './policy'

export function renderBindings(ctx: Context, config: Config, bindings: SteamBinding[], policy?: Partial<RenderPolicy>) {
  const content = pageTemplate('bindings', {
    BINDINGS: bindings.map((binding, index) => partialTemplate('binding', {
      INDEX: String(index + 1),
      STEAM_ID: escapeHtml(binding.steamId),
      PRIMARY: binding.isPrimary ? '<div class="primary">⭐ 主账号</div>' : '',
    })).join(''),
  })
  return renderPage(ctx, config, {
    title: '🔗 Steam 账号列表',
    subtitle: '🎯 未传 SteamID 的查询会使用主账号',
    content,
    fontText: `🔗 已绑定账号 👤 Steam 账号 ⭐ 主账号 🎯 未传 SteamID 的查询会使用主账号 ${bindings.map(item => item.steamId).join(' ')}`,
    source: 'Koishi 数据库',
    renderPolicy: policy,
  })
}
