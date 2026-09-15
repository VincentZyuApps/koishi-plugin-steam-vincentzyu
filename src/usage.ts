export const usage = `
<h2>🎮 koishi-plugin-steam-vincentzyu</h2>
<p>查询 Steam 公开游戏库、游玩时长、年度回顾、状态卡与商店排行榜。</p>
<p>
  <a href="https://www.npmjs.com/package/koishi-plugin-steam-vincentzyu" target="_blank">
    <img src="https://img.shields.io/npm/v/koishi-plugin-steam-vincentzyu?style=flat-square&logo=npm" alt="npm version">
  </a>
  <a href="https://npm-stat.com/charts.html?package=koishi-plugin-steam-vincentzyu" target="_blank">
    <img src="https://img.shields.io/npm/dm/koishi-plugin-steam-vincentzyu?style=flat-square&logo=npm" alt="npm downloads">
  </a>
  <br>
  <a href="https://github.com/VincentZyuApps/koishi-plugin-steam-vincentzyu" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
  <a href="https://gitee.com/vincent-zyu/koishi-plugin-steam-vincentzyu" target="_blank">
    <img src="https://img.shields.io/badge/Gitee-C71D23?style=for-the-badge&logo=gitee&logoColor=white" alt="Gitee">
  </a>
  <br>
  <a href="https://forum.koishi.xyz/t/topic/13638" target="_blank">
    <img src="https://img.shields.io/badge/Koishi%20Forum-13638-5546A3?style=for-the-badge" alt="Koishi Forum">
  </a>
  <a href="https://qm.qq.com/q/ZHj33L5cuC" target="_blank">
    <img src="https://img.shields.io/badge/QQ群-1085190201-12B7F5?style=flat-square&logo=qq&logoColor=white" alt="QQ群">
  </a>
  <br>
</p>
<h2>💬 交流反馈</h2>
<p>🐛 Bug 反馈 / 💡 建议 / 👨‍💻 插件开发交流，欢迎加群：</p>
<p><del>💬 插件使用问题 / 🐛 Bug反馈 / 👨‍💻 插件开发交流，欢迎加入QQ群：<b>259248174</b>   🎉（这个群G了）</del></p>
<p>💬 插件使用问题 / 🐛 Bug反馈 / 👨‍💻 插件开发交流，欢迎加入QQ群：<b>1085190201</b> 🎉</p>
<p>💡 在群里直接艾特我，回复的更快哦~ ✨</p>
<h2>🚨 使用前必读</h2>
<p><b>必须配置 Steam Web API Key：</b>绝大多数功能依赖 <code>apiKeys</code>；未配置时 Steam 通常返回 <code>401</code> 或 <code>403</code>，申请时域名可随意填写。</p>
<p><a href="https://partner.steamgames.com/doc/webapi_overview/auth" target="_blank">Steam Web API 说明</a> · <a href="https://steamcommunity.com/dev/apikey" target="_blank">申请 Steam Web API Key</a> · <a href="https://steamcommunity.com/dev/apiterms" target="_blank">Steam API 条款</a></p>
<p><b>网络访问：</b>Steam 在部分网络环境下可能连接超时；网络受限时请配置插件代理，并在 Koishi 全局启用 <code>proxy-agent</code>。</p>
<p><b>依赖服务：</b><code>database</code>、<code>puppeteer</code>、<code>http</code>；需要 Steam Web API Key 的功能请配置 <code>apiKeys</code>。</p>
<p>🙏 功能设计与迁移工作参考上游 <a href="https://github.com/XasYer/steam-plugin" target="_blank">yunzai-steam-plugin（GitHub）</a> 与 <a href="https://gitee.com/xiaoye12123/steam-plugin" target="_blank">yunzai-steam-plugin（Gitee）</a>。</p>
`
