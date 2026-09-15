> 💡 推荐前往 [GitHub](https://github.com/VincentZyuApps/koishi-plugin-steam-vincentzyu) 或 [Gitee](https://gitee.com/vincent-zyu/koishi-plugin-steam-vincentzyu) 阅读 README，体验更好。

![koishi-plugin-steam-vincentzyu](https://socialify.git.ci/VincentZyuApps/koishi-plugin-steam-vincentzyu/image?custom_description=&description=1&font=Inter&forks=1&issues=1&language=1&logo=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2Ff%2Ff3%2FKoishi.js_Logo.png%3Futm_source%3Dcommons.wikimedia.org%26utm_campaign%3Dindex%26utm_content%3Dthumbnail_unscaled%26_%3D20230331182243&name=1&owner=1&pattern=Plus&pulls=1&stargazers=1&theme=Auto)

# 🎮 koishi-plugin-steam-vincentzyu

[![npm](https://img.shields.io/npm/v/koishi-plugin-steam-vincentzyu?style=flat-square&logo=npm)](https://www.npmjs.com/package/koishi-plugin-steam-vincentzyu)
[![npm downloads](https://img.shields.io/npm/dm/koishi-plugin-steam-vincentzyu?style=flat-square&logo=npm)](https://npm-stat.com/charts.html?package=koishi-plugin-steam-vincentzyu)
[![MIT License](https://img.shields.io/badge/license-MIT-4c7890?style=flat-square)](./LICENSE)

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/VincentZyuApps/koishi-plugin-steam-vincentzyu)
[![Gitee](https://img.shields.io/badge/Gitee-C71D23?style=for-the-badge&logo=gitee&logoColor=white)](https://gitee.com/vincent-zyu/koishi-plugin-steam-vincentzyu)

[![Koishi Forum](https://img.shields.io/badge/Koishi%20Forum-13638-5546A3?style=for-the-badge)](https://forum.koishi.xyz/t/topic/13638)
[![QQ群](https://img.shields.io/badge/QQ群-1085190201-12B7F5?style=flat-square&logo=qq&logoColor=white)](https://qm.qq.com/q/ZHj33L5cuC)

Steam 公开库存、游玩时长、年度回顾、状态卡与商店数据查询插件。使用 Puppeteer 渲染紧凑的 Steam 风格图片，支持 SteamID、数字好友码和 Steam 个人主页链接。

🙏 本插件的功能设计与迁移工作参考上游 [yunzai-steam-plugin（GitHub）](https://github.com/XasYer/steam-plugin) 与 [yunzai-steam-plugin（Gitee）](https://gitee.com/xiaoye12123/steam-plugin)。

## 🚨 使用前必读

### 🔑 必须配置 Steam Web API Key

绝大多数功能依赖 Steam Web API Key。未配置 `apiKeys` 时，Steam 通常会返回 `401` 或 `403`，相关功能无法使用；申请时域名可随意填写。

- [Steam Web API 说明](https://partner.steamgames.com/doc/webapi_overview/auth)
- [申请 Steam Web API Key](https://steamcommunity.com/dev/apikey)
- [Steam API 条款](https://steamcommunity.com/dev/apiterms)

### 🔌 网络访问

Steam 在部分网络环境下可能连接超时。网络受限时，请配置本插件的代理模式，并在 Koishi 全局启用 `proxy-agent`。

<h2>💬 交流反馈</h2>
<p>🐛 Bug 反馈 / 💡 建议 / 👨‍💻 插件开发交流，欢迎加群：</p>
<p><del>💬 插件使用问题 / 🐛 Bug反馈 / 👨‍💻 插件开发交流，欢迎加入QQ群：<b>259248174</b>   🎉（这个群G了）</del></p>
<p>💬 插件使用问题 / 🐛 Bug反馈 / 👨‍💻 插件开发交流，欢迎加入QQ群：<b>1085190201</b> 🎉</p>
<p>💡 在群里直接艾特我，回复的更快哦~ ✨</p>

## ⚠️ 依赖与准备

### 🧩 Koishi 服务

插件需要以下 Koishi 服务：

- 💾 `database`：保存每个用户的 Steam 绑定。
- 🖼️ `puppeteer`：渲染帮助、库存、排行、特惠和状态图片。
- 🌐 `http`：访问 Steam Web API、Steam Community 和 Steam 商店。

### 🔑 Steam Web API Key

需要 Steam Web API Key 的功能，请至少配置一个 `apiKeys`。

### 🔌 插件代理

启用插件代理前，请在 Koishi 全局启用 `proxy-agent`。

本插件只在自己的请求上带代理地址，不会重复注册共享代理插件，因此支持 HMR 热重载。

## 🚀 快速开始

1. 在 Koishi 控制台安装并启用本插件，以及 `database`、`puppeteer`、`http` 服务。
2. 在插件配置中填写 Steam Web API Key；网络受限时配置代理范围和代理地址。
3. 发送 `steam.账号.绑定 <SteamID>`，再发送 `steam` 查看帮助图片。

```text
steam.账号.绑定 76561198307564265
steam.库存
steam.状态
steam.特惠
```

## 📖 指令对照

`Arg` 是位置参数，尖括号表示必填、方括号表示可选。`Option` 是 Koishi 的短/长命令选项。所有 Puppeteer 出图指令都支持 `-t, --image-timeout <seconds>`（1-30 秒）和 `-s, --settle-ms <milliseconds>`（0-10000ms），只覆盖本次渲染；省略时使用插件配置。

| 正式 Koishi 指令 | 中文别名 | English alias | 上游 Yunzai steam-plugin 对应指令 | Arg（位置参数） | Option（命令选项） | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| `steam` | `steam.帮助` | `steam.help` | `#steam帮助` | 无 | `-t/--image-timeout`、`-s/--settle-ms` | 返回带有命令格式示范的帮助图片。 |
| `steam.账号.绑定 <target>` | `steam.账号.添加 <target>` | `steam.account.bind <target>` | `#steam绑定 <SteamID>` | `target`：必填；SteamID、数字好友码或个人主页链接 | 无 | 绑定账号并设为默认账号。 |
| `steam.账号.列表` | `steam.账号.绑定列表` | `steam.account.list` | `#steam` | 无 | `-t/--image-timeout`、`-s/--settle-ms` | 查看当前会话已绑定账号。 |
| `steam.账号.切换 <index>` | `steam.账号.主账号 <index>` | `steam.account.switch <index>` | `#steam绑定 <SteamID/序号>` | `index`：必填正整数 | 无 | 按绑定列表序号切换默认账号。 |
| `steam.账号.解绑 <index>` | `steam.账号.删除 <index>` | `steam.account.unbind <index>` | `#steam解绑 <SteamID/序号>` | `index`：必填正整数 | 无 | 解除指定绑定。 |
| `steam.库存 [target]` | `steam.游戏时长 [target]` | `steam.library [target]` | `#steam库存` / `#steam游戏时长` | `target`：可选；省略时使用主账号 | `-t/--image-timeout`、`-s/--settle-ms` | 查看公开游戏库，按累计游玩时长展示封面和时长。 |
| `steam.最近游玩 [target]` | `steam.近期游玩 [target]` | `steam.recent [target]` | `#steam最近游玩` | `target`：可选；省略时使用主账号 | `-t/--image-timeout`、`-s/--settle-ms` | 查看近两周公开游玩记录。 |
| `steam.年度回顾 [year] [target]` | `steam.年终回顾 [year] [target]` | `steam.replay [year] [target]` | `#steam年度回顾分享图片 [year] [SteamID/序号]` | `year`：可选年份；`target`：可选目标 | 无 | 查看 Steam Replay 分享图；年份省略时使用最近可用年度。 |
| `steam.状态 [target]` | `steam.信息 [target]` | `steam.status [target]` | `#steam状态` / `#steam信息` | `target`：可选；省略时使用主账号 | `-t/--image-timeout`、`-s/--settle-ms` | 查看公开资料、在线状态与正在游玩的游戏。 |
| `steam.当前热玩` | `steam.在线热玩` | `steam.concurrent` | `#steam当前热玩` | 无 | `-t/--image-timeout`、`-s/--settle-ms` | 实时在线人数最高的游戏。 |
| `steam.每日热玩` | `steam.日榜热玩` | `steam.daily` | `#steam每日热玩` | 无 | `-t/--image-timeout`、`-s/--settle-ms` | 每日峰值玩家排行。 |
| `steam.热门新品` | `steam.新品热榜` | `steam.new-releases` | `#steam热门新品` | 无 | `-t/--image-timeout`、`-s/--settle-ms` | Steam 月度热门新品。 |
| `steam.本周热销` | `steam.本周畅销` | `steam.top-sellers` | `#steam本周热销` | 无 | `-t/--image-timeout`、`-s/--settle-ms` | Steam 当前热销排行。 |
| `steam.上周热销` | `steam.上周畅销` | `steam.last-week-sellers` | `#steam上周热销` | 无 | `-t/--image-timeout`、`-s/--settle-ms` | Steam 上周热销排行。 |
| `steam.年度排行 [type] [year]` | `steam.年度榜单 [type] [year]` | `steam.best-of-year [type] [year]` | `#steam年度…排行 [year]` | `type`：可选，畅销/新品/VR/抢先体验/热玩/Deck/控制器；`year`：可选年份 | `-t/--image-timeout`、`-s/--settle-ms` | Steam 年度最佳排行；省略时为最近年度的热玩。 |
| `steam.特惠` | `steam.促销` | `steam.featured` | `#steam特惠` / `#steam优惠` | 无 | `-t/--image-timeout`、`-s/--settle-ms` | 单图展示优惠、即将推出、热销和新品四分区。 |

## 💬 会话回复

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enableQuote` | `boolean` | `true` | 所有指令的文本、图片、错误与等待提示是否引用触发消息。 |
| `enableWaitingHint` | `boolean` | `true` | Steam API 获取、图片下载或 Puppeteer 渲染时是否显示并自动撤回等待提示。 |

等待提示为 `⏳ 正在获取 Steam 数据并渲染图片，请稍候... 🎨`。平台不支持撤回或 Bot 没有撤回权限时，不影响最终回复。

## 🔧 配置项

### 🎮 Steam 数据

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `apiKeys` | `[]` | Steam Web API Key 列表；请求会轮询 Key，429 后暂时避开当前 Key。 |
| `countryCode` | `CN` | Steam 商店地区代码，例如 `CN`、`US`、`HK`。 |
| `dataRequestTimeout` | `15` | Steam API、商店与 Replay 数据请求超时秒数，范围 3-60。 |
| `cacheSeconds` | `120` | 公共数据进程内缓存秒数，范围 0-3600。 |

### 🔌 网络与代理

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `proxyMode` | `disabled` | `disabled`、`data`、`data-and-images`；后两者分别代理数据，或同时代理数据与封面图片。 |
| `proxy.protocol` | `http` | 支持 `http`、`https`、`socks4`、`socks5`、`socks5h`。 |
| `proxy.host` | `127.0.0.1` | 代理服务器地址。 |
| `proxy.port` | `7891` | 代理服务器端口，范围 1-65535。 |

### 📊 出图条目限制

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `inventoryLimit` | `50` | 库存和最近游玩图片最多展示的游戏数。 |
| `rankingLimit` | `20` | 单一排行榜图片最多展示的条目数。 |
| `storefrontSpecialsLimit` | `10` | 特惠图“优惠”分区展示条数；`0` 表示完整展示。 |
| `storefrontComingSoonLimit` | `10` | 特惠图“即将推出”分区展示条数；`0` 表示完整展示。 |
| `storefrontTopSellersLimit` | `10` | 特惠图“热销”分区展示条数；`0` 表示完整展示。 |
| `storefrontNewReleasesLimit` | `10` | 特惠图“新品”分区展示条数；`0` 表示完整展示。 |

### 🖼️ Puppeteer 出图

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `imageWidth` | `900` | Puppeteer 图片宽度，范围 640-1600 px。 |
| `deviceScaleFactor` | `2.5` | 设备像素比，范围 0.5-5.0、步进 0.1；默认普通卡片输出约 2250px 宽。数值越高越清晰，但图片体积、内存和渲染时间也会增加。 |
| `imageLoadTimeout` | `20` | 图片预下载与浏览器图片解码超时秒数，范围 1-30；可被出图指令的 `--image-timeout` 临时覆盖。 |
| `renderSettleMs` | `2222` | 图片完成后的布局稳定等待毫秒数，范围 0-10000、步进 1；可被出图指令的 `--settle-ms` 临时覆盖。 |
| `imageType` | `png` | 输出格式：`png`、`jpeg` 或 `webp`。 |
| `screenshotQuality` | `88` | JPEG/WebP 图片质量，范围 30-100；PNG 不受影响。 |
| `fontMode` | `npm-lxgw` | 图片字体：npm 内置霞鹜文楷、指定绝对路径或系统默认字体。 |
| `customFontPath` | `""` | 自定义字体绝对路径，仅指定字体模式生效。 |

<!-- SCREENSHOTS:START -->
## 🖼️ 指令效果图

截图由 `yarn screenshots:readme` 使用当前 Steam 数据生成；数据可能随 Steam 实时变化。

### 📖 Steam 帮助

> **别名：** 中文 `steam.帮助`；English `steam.help`<br>
> **Arg：** 无<br>
> **Option：** `-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`<br>
> **示例：** `steam --image-timeout 20`

![📖 Steam 帮助](docs/screenshots/help.png)

### 🔗 Steam 账号列表

> **别名：** 中文 `steam.账号.绑定列表`；English `steam.account.list`<br>
> **Arg：** 无<br>
> **Option：** `-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`<br>
> **示例：** `steam.账号.列表 --settle-ms 2222`

![🔗 Steam 账号列表](docs/screenshots/bindings.png)

### 🎒 Steam 库存

> **别名：** 中文 `steam.游戏时长 [target]`；English `steam.library [target]`<br>
> **Arg：** `target` 可选；SteamID、好友码或个人主页链接，省略时使用主账号<br>
> **Option：** `-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`<br>
> **示例：** `steam.库存 --image-timeout 30`

![🎒 Steam 库存](docs/screenshots/inventory.png)

> ⚠️ 本次截图有资源未完整加载；已从候选中选出最佳结果。详见 [截图生成报告](docs/screenshots/report.md)。

### 🕹️ Steam 最近游玩

> **别名：** 中文 `steam.近期游玩 [target]`；English `steam.recent [target]`<br>
> **Arg：** `target` 可选；省略时使用主账号<br>
> **Option：** `-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`<br>
> **示例：** `steam.最近游玩 76561198307564265 --settle-ms 2222`

![🕹️ Steam 最近游玩](docs/screenshots/recently-played.png)

### 📅 2025 年度回顾

> **别名：** 中文 `steam.年终回顾 [year] [target]`；English `steam.replay [year] [target]`<br>
> **Arg：** `year`、`target` 均可选<br>
> **Option：** 无<br>
> **示例：** `steam.年度回顾 2025`

![📅 2025 年度回顾](docs/screenshots/replay-2025.png)

### 👤 Steam 状态

> **别名：** 中文 `steam.信息 [target]`；English `steam.status [target]`<br>
> **Arg：** `target` 可选；省略时使用主账号<br>
> **Option：** `-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`<br>
> **示例：** `steam.状态 --settle-ms 2222`

![👤 Steam 状态](docs/screenshots/status.png)

### 🔥 当前热玩排行榜

> **别名：** 中文 `steam.在线热玩`；English `steam.concurrent`<br>
> **Arg：** 无<br>
> **Option：** `-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`<br>
> **示例：** `steam.当前热玩 --image-timeout 30`

![🔥 当前热玩排行榜](docs/screenshots/concurrent.png)

> ⚠️ 本次截图有资源未完整加载；已从候选中选出最佳结果。详见 [截图生成报告](docs/screenshots/report.md)。

### 📈 每日热玩排行榜

> **别名：** 中文 `steam.日榜热玩`；English `steam.daily`<br>
> **Arg：** 无<br>
> **Option：** `-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`<br>
> **示例：** `steam.每日热玩 --settle-ms 2222`

![📈 每日热玩排行榜](docs/screenshots/daily.png)

> ⚠️ 本次截图有资源未完整加载；已从候选中选出最佳结果。详见 [截图生成报告](docs/screenshots/report.md)。

### 🆕 热门新品排行榜

> **别名：** 中文 `steam.新品热榜`；English `steam.new-releases`<br>
> **Arg：** 无<br>
> **Option：** `-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`<br>
> **示例：** `steam.热门新品 --image-timeout 30`

![🆕 热门新品排行榜](docs/screenshots/top-new-releases.png)

### 🛒 本周热销排行榜

> **别名：** 中文 `steam.本周畅销`；English `steam.top-sellers`<br>
> **Arg：** 无<br>
> **Option：** `-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`<br>
> **示例：** `steam.本周热销 --settle-ms 2222`

![🛒 本周热销排行榜](docs/screenshots/top-sellers.png)

> ⚠️ 本次刷新失败，暂时保留上一张成功截图：request timeout。详见 [截图生成报告](docs/screenshots/report.md)。

### 🕘 上周热销排行榜

> **别名：** 中文 `steam.上周畅销`；English `steam.last-week-sellers`<br>
> **Arg：** 无<br>
> **Option：** `-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`<br>
> **示例：** `steam.上周热销 --image-timeout 30`

![🕘 上周热销排行榜](docs/screenshots/weekly-top-sellers.png)

> ⚠️ 本次截图有资源未完整加载；已从候选中选出最佳结果。详见 [截图生成报告](docs/screenshots/report.md)。

### 🏆 2025 年度热玩排行

> **别名：** 中文 `steam.年度榜单 [type] [year]`；English `steam.best-of-year [type] [year]`<br>
> **Arg：** `type`、`year` 均可选<br>
> **Option：** `-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`<br>
> **示例：** `steam.年度排行 热玩 2025 --settle-ms 2222`

> ⚠️ 当前未生成该指令截图：fetch https://store.steampowered.com/charts/bestofyear/bestof2025 failed。详见 [截图生成报告](docs/screenshots/report.md)。

### 🎁 Steam 商店推荐

> **别名：** 中文 `steam.促销`；English `steam.featured`<br>
> **Arg：** 无<br>
> **Option：** `-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`<br>
> **示例：** `steam.特惠 --image-timeout 30`

![🎁 Steam 商店推荐](docs/screenshots/storefront.png)

> ⚠️ 本次刷新失败，暂时保留上一张成功截图：fetch https://store.steampowered.com/api/featuredcategories?cc=CN&l=schinese failed。详见 [截图生成报告](docs/screenshots/report.md)。
<!-- SCREENSHOTS:END -->

## 🎨 出图风格

渲染图采用深蓝渐变、冷青细线与紧凑信息布局，借鉴 Steam 信息界面但不逐像素复刻。矩形内容区、封面和标签使用直角；仅头像、序号徽章等语义圆形元素保留圆形。每张图片页脚会标明插件名、数据来源、UTC+8 生成时间与非官方声明。

## 🧪 README 截图自动化

在插件目录执行：

```bash
yarn screenshots:readme
```

脚本默认读取上级 Koishi 工作区的 `koishi.yml`，使用 `onebot:1830540513` 的主 Steam 绑定生成截图。支持 `--config <路径>`、`--output <路径>`、`--uid <平台:用户ID>` 与 `--year <年份>` 覆盖默认值。`--output` 仅保存最终选中的 README 图片；每次渲染的候选图、各命令 manifest 和运行总 manifest 默认写入被 Git 忽略的 `temp/output/<运行ID>/`，可用 `--attempt-output <路径>` 修改。

为减少 Steam CDN 偶发断图，脚本每项默认生成 3 张候选：资源预下载各重试 2 次。图片超时与稳定等待依次按 `CLI 参数 > koishi.yml 插件配置 > 20 秒 / 2222ms 默认值` 解析；候选优先选择全部资源成功加载的一张。可用 `--attempts <次数>`、`--image-retries <次数>`、`--image-timeout <秒>` 与 `--settle-ms <毫秒>` 临时调整，均不会影响 Bot 运行时行为。

```bash
yarn screenshots:readme --uid onebot:1830540513 --year 2025 --attempts 3 --image-retries 2 --image-timeout 20 --settle-ms 2222
```

API Key、代理与数据库凭据仅在运行时读取，不会写入脚本、截图报告、README 或 Git。截图中的固定账号 Steam 公开资料、SteamID、库存与游玩数据会原样提交；无法获取的单项会在控制台、README 与 `docs/screenshots/report.md` 中明确标为缺失。

## ⚠️ 注意事项

- Steam 资料、库存、近期游玩和年度回顾必须公开，且 Steam 服务本身可能限流或暂时不可用。
- 年度回顾由 Steam 决定是否生成；没有分享图时插件会给出对应 Steam Replay 链接。
- 商店排行和特惠内容随地区、时间和 Steam 服务返回变化。
- 使用代理模式前必须启用 Koishi 全局 `proxy-agent`。

## ⚖️ 商标声明

本项目为非官方、免费开源的社区插件，与 Valve Corporation 或 Steam 无关联，亦未获其认可或背书。Steam 是 Valve Corporation 的商标及/或注册商标。本项目不使用 Steam 官方图标作为自身插件标识。

🙏 致谢：感谢上游 [yunzai-steam-plugin（GitHub）](https://github.com/XasYer/steam-plugin) 与 [yunzai-steam-plugin（Gitee）](https://gitee.com/xiaoye12123/steam-plugin) 为本插件提供功能设计与实现参考。
