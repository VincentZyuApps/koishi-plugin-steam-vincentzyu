/*
 * Generates README screenshots from live Steam data without starting a Bot.
 * Credentials are read from the local Koishi config and are never serialized.
 */
const { mkdir, readFile, writeFile } = require('node:fs/promises')
const path = require('node:path')
const yaml = require('js-yaml')
const { Context } = require('koishi')
const http = require('@koishijs/plugin-http').default
const sqlite = require('@koishijs/plugin-database-sqlite').default
const puppeteer = require('koishi-plugin-puppeteer').default

const { BindingRepository } = require('../../src/database/bindings')
const { installTables } = require('../../src/database/tables')
const { renderBindings } = require('../../src/render/bindings')
const { renderGames } = require('../../src/render/games')
const { renderHelp } = require('../../src/render/help')
const { renderRanks } = require('../../src/render/ranks')
const { renderStatus } = require('../../src/render/status')
const { renderStorefront } = require('../../src/render/storefront')
const { defaultReplayYear } = require('../../src/shared/format')
const { ChartsService } = require('../../src/steam/charts')
const { SteamApiClient } = require('../../src/steam/client')
const { fetchSteamImage } = require('../../src/steam/http')
const { PlayerService } = require('../../src/steam/player')
const { ReplayService } = require('../../src/steam/replay')
const { StoreService } = require('../../src/steam/store')

const pluginRoot = path.resolve(__dirname, '../..')
const koishiRoot = path.resolve(pluginRoot, '../..')
const readmePath = path.join(pluginRoot, 'readme.md')

const DEFAULT_CONFIG = {
  apiKeys: [],
  countryCode: 'CN',
  timeout: 15,
  cacheSeconds: 120,
  proxyMode: 'disabled',
  proxy: { protocol: 'http', host: '127.0.0.1', port: 7891 },
  enableQuote: false,
  enableWaitingHint: false,
  inventoryLimit: 50,
  rankingLimit: 20,
  storefrontSpecialsLimit: 10,
  storefrontComingSoonLimit: 10,
  storefrontTopSellersLimit: 10,
  storefrontNewReleasesLimit: 10,
  imageWidth: 900,
  imageType: 'png',
  screenshotQuality: 88,
  fontMode: 'npm-lxgw',
  customFontPath: '',
}

function parseArguments(argv) {
  const result = {
    config: path.join(koishiRoot, 'koishi.yml'),
    output: path.join(pluginRoot, 'docs', 'screenshots'),
    uid: 'onebot:1830540513',
    year: defaultReplayYear(),
  }
  for (let index = 0; index < argv.length; index++) {
    const key = argv[index]
    const value = argv[index + 1]
    if (key === '--config' && value) result.config = path.resolve(value)
    if (key === '--output' && value) result.output = path.resolve(value)
    if (key === '--uid' && value) result.uid = value
    if (key === '--year' && value) result.year = Number(value)
  }
  if (!Number.isInteger(result.year) || result.year < 2003 || result.year > new Date().getFullYear()) {
    throw new Error('年度参数无效，请使用 2003 至当前年份之间的整数。')
  }
  return result
}

function findPluginConfig(value, name) {
  if (!value || typeof value !== 'object') return undefined
  for (const [key, child] of Object.entries(value)) {
    const normalized = key.replace(/^~/, '').split(':', 1)[0]
    if (normalized === name) return child
    const nested = findPluginConfig(child, name)
    if (nested) return nested
  }
}

function findPuppeteerConfig(value) {
  if (!value || typeof value !== 'object') return undefined
  for (const [key, child] of Object.entries(value)) {
    const normalized = key.replace(/^~/, '').split(':', 1)[0]
    if (!key.startsWith('~') && (normalized === 'puppeteer' || normalized === '@shangxueink/puppeteer-without-canvas')) return child
    const nested = findPuppeteerConfig(child)
    if (nested) return nested
  }
}

function sanitize(message, config) {
  let text = String(message || '未知错误')
  for (const key of config.apiKeys || []) text = text.split(key).join('***')
  return text.replace(/(authorization|cookie|token)=([^\s&]+)/gi, '$1=***')
}

function markdownReport(records, options) {
  const generated = records.filter(record => record.status === 'generated').length
  const skipped = records.length - generated
  const rows = records.map(record => {
    if (record.status === 'generated') return `| \`${record.command}\` | ✅ 已生成 | \`${record.file}\` |`
    if (record.status === 'stale') return `| \`${record.command}\` | ⚠️ 保留旧图 | \`${record.file}\`；刷新失败：${record.error} |`
    return `| \`${record.command}\` | ⚠️ 跳过 | ${record.error} |`
  }).join('\n')
  return `# 截图生成报告\n\n- 账号：\`${options.uid}\`\n- 年度：\`${options.year}\`\n- 生成时间：${new Date().toISOString()}\n- 结果：${generated} 项成功，${skipped} 项跳过。\n\n| 指令 | 状态 | 文件或原因 |\n| --- | --- | --- |\n${rows}\n`
}

function markdownScreenshots(records) {
  const blocks = records.map(record => {
    const heading = `### ${record.caption}\n\n`
    if (record.status === 'generated') return `${heading}![${record.caption}](docs/screenshots/${record.file})\n`
    if (record.status === 'stale') return `${heading}![${record.caption}](docs/screenshots/${record.file})\n\n> ⚠️ 本次刷新失败，暂时保留上一张成功截图：${record.error}。详见 [截图生成报告](docs/screenshots/report.md)。\n`
    return `${heading}> ⚠️ 当前未生成该指令截图：${record.error}。详见 [截图生成报告](docs/screenshots/report.md)。\n`
  })
  return `<!-- SCREENSHOTS:START -->\n## 🖼️ 指令效果图\n\n截图由 \`yarn screenshots:readme\` 使用当前 Steam 数据生成；数据可能随 Steam 实时变化。\n\n${blocks.join('\n')}<!-- SCREENSHOTS:END -->`
}

async function updateReadme(records) {
  const source = await readFile(readmePath, 'utf8')
  const start = '<!-- SCREENSHOTS:START -->'
  const end = '<!-- SCREENSHOTS:END -->'
  const begin = source.indexOf(start)
  const finish = source.indexOf(end)
  if (begin < 0 || finish < begin) throw new Error('README 缺少截图标记区。')
  const result = `${source.slice(0, begin)}${markdownScreenshots(records)}${source.slice(finish + end.length)}`
  await writeFile(readmePath, result)
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  process.chdir(path.dirname(options.config))
  const appConfig = yaml.load(await readFile(options.config, 'utf8'))
  const steamRaw = findPluginConfig(appConfig.plugins, 'steam-vincentzyu')
  const sqliteConfig = findPluginConfig(appConfig.plugins, 'database-sqlite')
  const browserConfig = findPuppeteerConfig(appConfig.plugins) || {}
  if (!steamRaw) throw new Error('未在 Koishi 配置中找到 steam-vincentzyu。')
  if (!sqliteConfig) throw new Error('未在 Koishi 配置中找到启用的 database-sqlite。')
  if (!browserConfig.executablePath) throw new Error('未在 Koishi 配置中找到 Puppeteer 浏览器路径。')

  const config = {
    ...DEFAULT_CONFIG,
    ...steamRaw,
    proxy: { ...DEFAULT_CONFIG.proxy, ...(steamRaw.proxy || {}) },
    enableQuote: false,
    enableWaitingHint: false,
  }
  const ctx = new Context()
  ctx.plugin(http)
  ctx.plugin(sqlite, sqliteConfig)
  ctx.plugin(puppeteer, { executablePath: browserConfig.executablePath, headless: true })
  installTables(ctx)
  await ctx.start()

  const records = []
  const capture = async (file, command, caption, task) => {
    let failure
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await task()
        if (!Buffer.isBuffer(result)) throw new Error('指令未返回可保存的图片数据。')
        await writeFile(path.join(options.output, file), result)
        records.push({ file, command, caption, status: 'generated' })
        console.info(`GENERATED ${file}`)
        return
      } catch (error) {
        failure = error
        if (attempt < 3) console.warn(`RETRY ${file} (${attempt}/3): ${sanitize(error instanceof Error ? error.message : error, config)}`)
      }
    }
    const reason = sanitize(failure instanceof Error ? failure.message : failure, config)
    const target = path.join(options.output, file)
    try {
      await readFile(target)
      records.push({ file, command, caption, status: 'stale', error: reason })
      console.warn(`STALE ${file}: ${reason}`)
    } catch {
      records.push({ file, command, caption, status: 'skipped', error: reason })
      console.warn(`SKIPPED ${file}: ${reason}`)
    }
  }

  try {
    await mkdir(options.output, { recursive: true })
    const bindings = new BindingRepository(ctx)
    const primary = await bindings.primary(options.uid)
    if (!primary) throw new Error(`未找到 ${options.uid} 的主 Steam 绑定。`)

    const api = new SteamApiClient(ctx, config)
    const player = new PlayerService(api)
    const store = new StoreService(ctx, api, config)
    const charts = new ChartsService(api, store, config)
    const replay = new ReplayService(ctx, api, store, config)

    await capture('help.png', 'steam', '📖 Steam 帮助', () => renderHelp(ctx, config))
    await capture('bindings.png', 'steam.绑定列表', '🔗 Steam 绑定列表', async () => renderBindings(ctx, config, await bindings.list(options.uid)))
    await capture('inventory.png', 'steam.库存', '🎒 Steam 库存', async () => {
      const [profile, games] = await Promise.all([player.profile(primary.steamId), player.ownedGames(primary.steamId)])
      games.sort((a, b) => b.playtime_forever - a.playtime_forever)
      return renderGames(ctx, config, '🎒 Steam 库存', profile, games, games.length)
    })
    await capture('playtime.png', 'steam.游戏时长', '⏱️ Steam 游戏时长', async () => {
      const [profile, games] = await Promise.all([player.profile(primary.steamId), player.ownedGames(primary.steamId)])
      games.sort((a, b) => b.playtime_forever - a.playtime_forever)
      return renderGames(ctx, config, '⏱️ Steam 游戏时长', profile, games, games.length)
    })
    await capture('recently-played.png', 'steam.最近游玩', '🕹️ Steam 最近游玩', async () => {
      const [profile, games] = await Promise.all([player.profile(primary.steamId), player.recentlyPlayed(primary.steamId)])
      games.sort((a, b) => (b.playtime_2weeks || 0) - (a.playtime_2weeks || 0))
      return renderGames(ctx, config, '🕹️ Steam 最近游玩', profile, games, games.length, true)
    })
    await capture(`replay-${options.year}.png`, 'steam.年度回顾', `📅 ${options.year} 年度回顾`, async () => {
      const url = await replay.shareImage(primary.steamId, options.year)
      if (!url) throw new Error(`${options.year} 年度回顾未公开或尚未生成。`)
      return (await fetchSteamImage(ctx, config, url)).data
    })
    await capture('status.png', 'steam.状态', '👤 Steam 状态', async () => renderStatus(ctx, config, await player.statusProfile(primary.steamId)))
    await capture('concurrent.png', 'steam.当前热玩', '🔥 当前热玩排行榜', async () => renderRanks(ctx, config, '🔥 当前热玩排行榜', await charts.concurrentRanks()))
    await capture('daily.png', 'steam.每日热玩', '📈 每日热玩排行榜', async () => renderRanks(ctx, config, '📈 每日热玩排行榜', await charts.dailyRanks()))
    await capture('top-new-releases.png', 'steam.热门新品', '🆕 热门新品排行榜', async () => renderRanks(ctx, config, '🆕 热门新品排行榜', await charts.topNewReleases()))
    await capture('top-sellers.png', 'steam.本周热销', '🛒 本周热销排行榜', async () => renderRanks(ctx, config, '🛒 本周热销排行榜', await store.topSellers(false)))
    await capture('weekly-top-sellers.png', 'steam.上周热销', '🕘 上周热销排行榜', async () => renderRanks(ctx, config, '🕘 上周热销排行榜', await store.topSellers(true)))
    await capture(`best-of-year-${options.year}.png`, 'steam.年度排行', `🏆 ${options.year} 年度热玩排行`, async () => renderRanks(ctx, config, `🏆 ${options.year} 年度热玩排行`, await replay.bestOfYear('热玩', options.year)))
    await capture('storefront.png', 'steam.特惠', '🎁 Steam 商店推荐', async () => renderStorefront(ctx, config, await store.featuredCategories()))
  } finally {
    await mkdir(options.output, { recursive: true })
    await writeFile(path.join(options.output, 'report.json'), `${JSON.stringify({ uid: options.uid, year: options.year, generatedAt: new Date().toISOString(), records }, null, 2)}\n`)
    await writeFile(path.join(options.output, 'report.md'), markdownReport(records, options))
    await updateReadme(records).catch(error => console.error(`README 截图区更新失败：${error.message}`))
    await ctx.stop().catch(() => undefined)
  }
}

main().catch(error => {
  console.error(`截图生成失败：${error.message}`)
  process.exitCode = 1
})
