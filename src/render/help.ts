import type { Context } from 'koishi'
import type { Config } from '../config'
import { steamCommands, type SteamCommandNames } from '../shared/command-names'
import { renderPage } from './index'
import { escapeHtml, pageTemplate, partialTemplate } from './template-loader'
import type { RenderPolicy } from './policy'

interface HelpItem {
  names: SteamCommandNames
  suffix?: string
  aliasSuffix?: string
  description: string
}

interface HelpSection {
  title: string
  items: HelpItem[]
}

function withSuffix(command: string, suffix = '') {
  return `${command}${suffix}`
}

export function renderHelp(ctx: Context, config: Config, policy?: Partial<RenderPolicy>) {
  const sections: HelpSection[] = [
    {
      title: '🔗 账号管理',
      items: [
        { names: steamCommands.accountBind, suffix: ' <SteamID>', aliasSuffix: ' <SteamID>', description: '绑定 SteamID、数字好友码或个人主页链接；验证公开资料后自动设为默认账号。' },
        { names: steamCommands.accountList, description: '查看当前会话已绑定账号与默认标记；切换和解绑时使用列表中的序号。' },
        { names: steamCommands.accountSwitch, suffix: ' <序号>', aliasSuffix: ' <index>', description: '将指定序号设为默认账号；后续未传目标的个人查询都会使用它。' },
        { names: steamCommands.accountUnbind, suffix: ' <序号>', aliasSuffix: ' <index>', description: '解除指定账号绑定；操作前可先通过账号列表核对序号和主账号标记。' },
      ],
    },
    {
      title: '👤 个人查询',
      items: [
        { names: steamCommands.inventory, suffix: ' [目标]', aliasSuffix: ' [target]', description: '读取公开拥有游戏库，按累计游玩时长排序，展示封面、总数与时长；省略目标时使用默认账号。' },
        { names: steamCommands.recent, suffix: ' [目标]', aliasSuffix: ' [target]', description: '展示 Steam 近两周可公开查询到的游玩游戏和近期时长；省略目标时使用默认账号。' },
        { names: steamCommands.replay, suffix: ' [年份] [目标]', aliasSuffix: ' [year] [target]', description: '获取 Steam Replay 官方年度回顾分享图；可指定年份和公开账号，年份默认取最近可用年度。' },
        { names: steamCommands.status, suffix: ' [目标]', aliasSuffix: ' [target]', description: '显示公开昵称、头像、在线状态和正在游玩的游戏；省略目标时使用默认账号。' },
      ],
    },
    {
      title: '🛒 商店榜单与推荐',
      items: [
        { names: steamCommands.concurrent, description: '实时展示 Steam 当前在线人数最高的游戏，适合快速查看正在流行的作品。' },
        { names: steamCommands.daily, description: '按 Steam 每日峰值在线人数排序，查看当天玩家规模最高的游戏。' },
        { names: steamCommands.newReleases, description: '展示 Steam 月度热门新品，快速浏览近期发布且受关注的游戏。' },
        { names: steamCommands.topSellers, description: '读取 Steam 商店当前热销榜，反映本周正在销售表现最好的游戏。' },
        { names: steamCommands.lastWeekSellers, description: '读取上一周 Steam 商店热销榜，便于与本周销售趋势对照。' },
        { names: steamCommands.bestOfYear, suffix: ' [类型] [年份]', aliasSuffix: ' [type] [year]', description: '查询 Steam 年度最佳榜单；类型可选畅销、新品、VR、热玩、Deck 等，默认最近年度热玩。' },
        { names: steamCommands.featured, description: '单图汇总商店优惠、即将推出、热销和新品四类推荐，条目数量由配置控制。' },
      ],
    },
  ]
  const content = pageTemplate('help', {
    GUIDE: partialTemplate('help-guide', {}),
    SECTIONS: sections.map(section => partialTemplate('help-section', {
      TITLE: escapeHtml(section.title),
      ITEMS: section.items.map(item => partialTemplate('help-item', {
        COMMAND: escapeHtml(withSuffix(item.names.command, item.suffix)),
        CHINESE_ALIAS: escapeHtml(withSuffix(item.names.chinese, item.suffix)),
        ENGLISH_ALIAS: escapeHtml(withSuffix(item.names.english, item.aliasSuffix || item.suffix)),
        DESCRIPTION: escapeHtml(item.description),
      })).join(''),
    })).join(''),
  })
  const fontText = sections.flatMap(section => section.items.flatMap(item => [
    withSuffix(item.names.command, item.suffix),
    withSuffix(item.names.chinese, item.suffix),
    withSuffix(item.names.english, item.aliasSuffix || item.suffix),
    item.description,
  ])).join(' ')
  return renderPage(ctx, config, {
    title: '📖 Steam 帮助',
    subtitle: '🎮 公开 Steam 数据查询与商店排行榜',
    content,
    fontText: `📖 Steam 帮助 🧭 指令格式示范 steam.子指令名 [参数1] steam.中文别名 [参数1] steam.sub-command-name [argument1] 图片加载超时 渲染稳定等待 --image-timeout --settle-ms ${fontText}`,
    source: '插件帮助',
    pageClass: 'help-sheet',
    widthOffset: 100,
    renderPolicy: policy,
  })
}
