# 截图生成报告

- 账号：`onebot:1830540513`
- 年度：`2025`
- 生成时间：2026-09-14T17:38:12.743Z
- 候选次数：3
- 图片重试：2
- 单图超时：20 秒
- 资源稳定等待：2222 ms
- 结果：10 项成功，其中 4 项存在资源降级；3 项未更新。

| 指令 | 状态 | 文件或原因 |
| --- | --- | --- |
| `steam` | ✅ 已生成 | `help.png` |
| `steam.账号.列表` | ✅ 已生成 | `bindings.png` |
| `steam.库存` | ⚠️ 资源降级 | `inventory.png`；预下载 40/42，DOM 图片 40/40 |
| `steam.最近游玩` | ✅ 已生成 | `recently-played.png` |
| `steam.年度回顾` | ✅ 已生成 | `replay-2025.png` |
| `steam.状态` | ✅ 已生成 | `status.png` |
| `steam.当前热玩` | ⚠️ 资源降级 | `concurrent.png`；预下载 17/20，DOM 图片 17/17 |
| `steam.每日热玩` | ⚠️ 资源降级 | `daily.png`；预下载 17/20，DOM 图片 17/17 |
| `steam.热门新品` | ✅ 已生成 | `top-new-releases.png` |
| `steam.本周热销` | ⚠️ 保留旧图 | `top-sellers.png`；刷新失败：request timeout |
| `steam.上周热销` | ⚠️ 资源降级 | `weekly-top-sellers.png`；预下载 13/20，DOM 图片 13/13 |
| `steam.年度排行` | ⚠️ 跳过 | fetch https://store.steampowered.com/charts/bestofyear/bestof2025 failed |
| `steam.特惠` | ⚠️ 保留旧图 | `storefront.png`；刷新失败：fetch https://store.steampowered.com/api/featuredcategories?cc=CN&l=schinese failed |
