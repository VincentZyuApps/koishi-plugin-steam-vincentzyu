export interface SteamCommandNames {
  command: string
  chinese: string
  english: string
}

export const steamCommands = {
  help: { command: 'steam', chinese: 'steam.帮助', english: 'steam.help' },
  accountBind: { command: 'steam.账号.绑定', chinese: 'steam.账号.添加', english: 'steam.account.bind' },
  accountList: { command: 'steam.账号.列表', chinese: 'steam.账号.绑定列表', english: 'steam.account.list' },
  accountSwitch: { command: 'steam.账号.切换', chinese: 'steam.账号.主账号', english: 'steam.account.switch' },
  accountUnbind: { command: 'steam.账号.解绑', chinese: 'steam.账号.删除', english: 'steam.account.unbind' },
  inventory: { command: 'steam.库存', chinese: 'steam.游戏时长', english: 'steam.library' },
  recent: { command: 'steam.最近游玩', chinese: 'steam.近期游玩', english: 'steam.recent' },
  replay: { command: 'steam.年度回顾', chinese: 'steam.年终回顾', english: 'steam.replay' },
  status: { command: 'steam.状态', chinese: 'steam.信息', english: 'steam.status' },
  concurrent: { command: 'steam.当前热玩', chinese: 'steam.在线热玩', english: 'steam.concurrent' },
  daily: { command: 'steam.每日热玩', chinese: 'steam.日榜热玩', english: 'steam.daily' },
  newReleases: { command: 'steam.热门新品', chinese: 'steam.新品热榜', english: 'steam.new-releases' },
  topSellers: { command: 'steam.本周热销', chinese: 'steam.本周畅销', english: 'steam.top-sellers' },
  lastWeekSellers: { command: 'steam.上周热销', chinese: 'steam.上周畅销', english: 'steam.last-week-sellers' },
  bestOfYear: { command: 'steam.年度排行', chinese: 'steam.年度榜单', english: 'steam.best-of-year' },
  featured: { command: 'steam.特惠', chinese: 'steam.促销', english: 'steam.featured' },
} as const satisfies Record<string, SteamCommandNames>
