import { renderStorefront } from '../render/storefront'
import type { StoreService } from '../steam/store'
import { handle, imageReply, type CommandServices } from './context'

export function registerStorefrontCommands(services: CommandServices, store: StoreService) {
  const { ctx, config } = services
  ctx.command('steam.特惠', '🎁 查看 Steam 优惠、即将推出、热销与新品').action(({ session }) => handle(config, session, async () => {
    const sections = await store.featuredCategories()
    return sections.some(section => section.items.length)
      ? imageReply(config, renderStorefront(ctx, config, sections))
      : '📭 Steam 暂未返回商店推荐数据。'
  }, true))
}
