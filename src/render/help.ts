import type { Context } from 'koishi'
import type { Config } from '../config'
import { renderPage } from './index'
import { escapeHtml, pageTemplate, partialTemplate } from './template-loader'

export function renderHelp(ctx: Context, config: Config) {
  const sections = [
    ['🔗 账号绑定', [['steam.绑定 <SteamID>', '🪪 绑定 SteamID、数字好友码或个人主页链接'], ['steam.绑定列表', '📋 查看已绑定账号'], ['steam.切换 <序号>', '⭐ 切换默认查询账号'], ['steam.解绑 <序号>', '🔓 删除已绑定账号']]],
    ['👤 个人查询', [['steam.库存 [目标]', '🎒 库存总览与游戏封面图'], ['steam.游戏时长 [目标]', '⏱️ 按累计游玩时长排行'], ['steam.最近游玩 [目标]', '🕹️ 查看近两周游玩游戏'], ['steam.年度回顾 [年份] [目标]', '📅 查看 Steam Replay 分享图'], ['steam.状态 [目标]', '📡 公开资料、在线状态与当前游戏']]],
    ['🛒 商店榜单与推荐', [['steam.当前热玩', '🔥 当前在线人数最高的游戏'], ['steam.每日热玩', '📈 每日峰值玩家排行'], ['steam.热门新品', '🆕 Steam 月度热门新品'], ['steam.本周热销 / steam.上周热销', '💰 Steam 商店热销排行'], ['steam.年度排行 [类型] [年份]', '🏆 畅销、新品、VR、抢先体验、热玩、Deck、控制器'], ['steam.特惠', '🎁 优惠、即将推出、热销与新品四分区']]],
  ] as const
  const content = pageTemplate('help', {
    SECTIONS: sections.map(([title, items]) => partialTemplate('help-section', {
      TITLE: escapeHtml(title),
      ITEMS: items.map(([command, description]) => partialTemplate('help-item', {
        COMMAND: escapeHtml(command),
        DESCRIPTION: escapeHtml(description),
      })).join(''),
    })).join(''),
  })
  return renderPage(ctx, config, { title: '📖 Steam 帮助', subtitle: '🎮 公开 Steam 数据查询与商店排行榜', content, fontText: `📖 Steam 帮助 🎮 公开 Steam 数据查询与商店排行榜 ${sections.flat(2).join(' ')}`, source: '插件帮助' })
}
