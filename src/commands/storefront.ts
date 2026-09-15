import { renderStorefront } from '../render/storefront'
import { steamCommands } from '../shared/command-names'
import type { StoreService } from '../steam/store'
import { handle, imageReply, type CommandServices } from './context'
import { addRenderOptions, commandRenderPolicy } from './render-policy'

export function registerStorefrontCommands(services: CommandServices, store: StoreService) {
  const { ctx, config } = services
  const featured = addRenderOptions(ctx.command(steamCommands.featured.command, '🎁 查看 Steam 优惠、即将推出、热销与新品')
    .alias(steamCommands.featured.chinese)
    .alias(steamCommands.featured.english))
  featured.action(({ session, options }) => handle(config, session, async () => {
    const policy = commandRenderPolicy(options)
    const sections = await store.featuredCategories()
    return sections.some(section => section.items.length)
      ? imageReply(config, renderStorefront(ctx, config, sections, policy))
      : '📭 Steam 暂未返回商店推荐数据。'
  }, true))
}
