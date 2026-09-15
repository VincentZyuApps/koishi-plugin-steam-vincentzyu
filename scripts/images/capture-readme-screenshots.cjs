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
const { getRenderDiagnostics } = require('../../src/render')
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
  dataRequestTimeout: 15,
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
  deviceScaleFactor: 2.5,
  imageLoadTimeout: 20,
  renderSettleMs: 2222,
  imageType: 'png',
  screenshotQuality: 88,
  fontMode: 'npm-lxgw',
  customFontPath: '',
}

const SCREENSHOT_USAGE = {
  steam: { aliases: '中文 `steam.帮助`；English `steam.help`', args: '无', options: '`-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`', example: '`steam --image-timeout 20`' },
  'steam.账号.列表': { aliases: '中文 `steam.账号.绑定列表`；English `steam.account.list`', args: '无', options: '`-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`', example: '`steam.账号.列表 --settle-ms 2222`' },
  'steam.库存': { aliases: '中文 `steam.游戏时长 [target]`；English `steam.library [target]`', args: '`target` 可选；SteamID、好友码或个人主页链接，省略时使用主账号', options: '`-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`', example: '`steam.库存 --image-timeout 30`' },
  'steam.最近游玩': { aliases: '中文 `steam.近期游玩 [target]`；English `steam.recent [target]`', args: '`target` 可选；省略时使用主账号', options: '`-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`', example: '`steam.最近游玩 76561198307564265 --settle-ms 2222`' },
  'steam.年度回顾': { aliases: '中文 `steam.年终回顾 [year] [target]`；English `steam.replay [year] [target]`', args: '`year`、`target` 均可选', options: '无', example: '`steam.年度回顾 2025`' },
  'steam.状态': { aliases: '中文 `steam.信息 [target]`；English `steam.status [target]`', args: '`target` 可选；省略时使用主账号', options: '`-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`', example: '`steam.状态 --settle-ms 2222`' },
  'steam.当前热玩': { aliases: '中文 `steam.在线热玩`；English `steam.concurrent`', args: '无', options: '`-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`', example: '`steam.当前热玩 --image-timeout 30`' },
  'steam.每日热玩': { aliases: '中文 `steam.日榜热玩`；English `steam.daily`', args: '无', options: '`-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`', example: '`steam.每日热玩 --settle-ms 2222`' },
  'steam.热门新品': { aliases: '中文 `steam.新品热榜`；English `steam.new-releases`', args: '无', options: '`-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`', example: '`steam.热门新品 --image-timeout 30`' },
  'steam.本周热销': { aliases: '中文 `steam.本周畅销`；English `steam.top-sellers`', args: '无', options: '`-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`', example: '`steam.本周热销 --settle-ms 2222`' },
  'steam.上周热销': { aliases: '中文 `steam.上周畅销`；English `steam.last-week-sellers`', args: '无', options: '`-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`', example: '`steam.上周热销 --image-timeout 30`' },
  'steam.年度排行': { aliases: '中文 `steam.年度榜单 [type] [year]`；English `steam.best-of-year [type] [year]`', args: '`type`、`year` 均可选', options: '`-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`', example: '`steam.年度排行 热玩 2025 --settle-ms 2222`' },
  'steam.特惠': { aliases: '中文 `steam.促销`；English `steam.featured`', args: '无', options: '`-t, --image-timeout <seconds>`；`-s, --settle-ms <milliseconds>`', example: '`steam.特惠 --image-timeout 30`' },
}

function parseArguments(argv) {
  const result = {
    config: path.join(koishiRoot, 'koishi.yml'),
    output: path.join(pluginRoot, 'docs', 'screenshots'),
    uid: 'onebot:1830540513',
    year: defaultReplayYear(),
    attempts: 3,
    imageRetries: 2,
    imageTimeout: undefined,
    settleMs: undefined,
    attemptOutput: path.join(pluginRoot, 'temp', 'output'),
    only: undefined,
  }
  for (let index = 0; index < argv.length; index++) {
    const key = argv[index]
    const value = argv[index + 1]
    if (key === '--config' && value) result.config = path.resolve(value)
    if (key === '--output' && value) result.output = path.resolve(value)
    if (key === '--uid' && value) result.uid = value
    if (key === '--year' && value) result.year = Number(value)
    if (key === '--attempts' && value) result.attempts = Number(value)
    if (key === '--image-retries' && value) result.imageRetries = Number(value)
    if (key === '--image-timeout' && value) result.imageTimeout = Number(value)
    if (key === '--settle-ms' && value) result.settleMs = Number(value)
    if (key === '--attempt-output' && value) result.attemptOutput = path.resolve(value)
    if (key === '--only' && value) result.only = value
  }
  if (!Number.isInteger(result.year) || result.year < 2003 || result.year > new Date().getFullYear()) {
    throw new Error('年度参数无效，请使用 2003 至当前年份之间的整数。')
  }
  const integerOption = (key, min, max, label) => {
    if (!Number.isInteger(result[key]) || result[key] < min || result[key] > max) {
      throw new Error(`${label} 无效，请使用 ${min} 至 ${max} 之间的整数。`)
    }
  }
  integerOption('attempts', 1, 10, '--attempts')
  integerOption('imageRetries', 0, 10, '--image-retries')
  if (result.imageTimeout !== undefined) integerOption('imageTimeout', 1, 30, '--image-timeout')
  if (result.settleMs !== undefined) integerOption('settleMs', 0, 10_000, '--settle-ms')
  return result
}

function resolveScreenshotRenderOptions(options, config) {
  const imageTimeout = options.imageTimeout ?? config.imageLoadTimeout
  const settleMs = options.settleMs ?? config.renderSettleMs
  const validate = (value, min, max, label) => {
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new Error(`${label} 无效，请使用 ${min} 至 ${max} 之间的整数。`)
    }
  }
  validate(imageTimeout, 1, 30, '图片超时')
  validate(settleMs, 0, 10_000, '渲染稳定等待')
  return { ...options, imageTimeout, settleMs }
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
  const generated = records.filter(record => record.status === 'generated' || record.status === 'degraded').length
  const degraded = records.filter(record => record.status === 'degraded').length
  const skipped = records.length - generated
  const rows = records.map(record => {
    if (record.status === 'generated') return `| \`${record.command}\` | ✅ 已生成 | \`${record.file}\` |`
    if (record.status === 'degraded') return `| \`${record.command}\` | ⚠️ 资源降级 | \`${record.file}\`；${diagnosticNote(record.diagnostics)} |`
    if (record.status === 'stale') return `| \`${record.command}\` | ⚠️ 保留旧图 | \`${record.file}\`；刷新失败：${record.error} |`
    return `| \`${record.command}\` | ⚠️ 跳过 | ${record.error} |`
  }).join('\n')
  return `# 截图生成报告\n\n- 账号：\`${options.uid}\`\n- 年度：\`${options.year}\`\n- 生成时间：${new Date().toISOString()}\n- 候选次数：${options.attempts}\n- 图片重试：${options.imageRetries}\n- 单图超时：${options.imageTimeout} 秒\n- 资源稳定等待：${options.settleMs} ms\n- 结果：${generated} 项成功，其中 ${degraded} 项存在资源降级；${skipped} 项未更新。\n\n| 指令 | 状态 | 文件或原因 |\n| --- | --- | --- |\n${rows}\n`
}

function markdownScreenshots(records) {
  const blocks = records.map(record => {
    const heading = `### ${record.caption}\n\n`
    const usage = SCREENSHOT_USAGE[record.command]
    const guide = usage
      ? `> **别名：** ${usage.aliases}<br>\n> **Arg：** ${usage.args}<br>\n> **Option：** ${usage.options}<br>\n> **示例：** ${usage.example}\n\n`
      : ''
    if (record.status === 'generated') return `${heading}${guide}![${record.caption}](docs/screenshots/${record.file})\n`
    if (record.status === 'degraded') return `${heading}${guide}![${record.caption}](docs/screenshots/${record.file})\n\n> ⚠️ 本次截图有资源未完整加载；已从候选中选出最佳结果。详见 [截图生成报告](docs/screenshots/report.md)。\n`
    if (record.status === 'stale') return `${heading}${guide}![${record.caption}](docs/screenshots/${record.file})\n\n> ⚠️ 本次刷新失败，暂时保留上一张成功截图：${proseError(record.error)}。详见 [截图生成报告](docs/screenshots/report.md)。\n`
    return `${heading}${guide}> ⚠️ 当前未生成该指令截图：${proseError(record.error)}。详见 [截图生成报告](docs/screenshots/report.md)。\n`
  })
  return `<!-- SCREENSHOTS:START -->\n## 🖼️ 指令效果图\n\n截图由 \`yarn screenshots:readme\` 使用当前 Steam 数据生成；数据可能随 Steam 实时变化。\n\n${blocks.join('\n')}<!-- SCREENSHOTS:END -->`
}

function emptyDiagnostics() {
  return { assets: { requested: 0, loaded: 0, failures: [] }, dom: { requested: 0, loaded: 0, failed: 0 }, durationMs: 0 }
}

function isDegraded(diagnostics) {
  return diagnostics.assets.failures.length > 0 || diagnostics.dom.failed > 0
}

function diagnosticNote(diagnostics) {
  return `预下载 ${diagnostics.assets.loaded}/${diagnostics.assets.requested}，DOM 图片 ${diagnostics.dom.loaded}/${diagnostics.dom.requested}`
}

function compareCandidates(left, right) {
  const leftComplete = !isDegraded(left.diagnostics)
  const rightComplete = !isDegraded(right.diagnostics)
  if (leftComplete !== rightComplete) return leftComplete ? 1 : -1
  const leftLoaded = left.diagnostics.assets.loaded + left.diagnostics.dom.loaded
  const rightLoaded = right.diagnostics.assets.loaded + right.diagnostics.dom.loaded
  if (leftLoaded !== rightLoaded) return leftLoaded - rightLoaded
  const leftFailed = left.diagnostics.assets.failures.length + left.diagnostics.dom.failed
  const rightFailed = right.diagnostics.assets.failures.length + right.diagnostics.dom.failed
  return rightFailed - leftFailed
}

function safeDirectoryName(command) {
  return command.replace(/[\\/:*?"<>|]/g, '_')
}

function proseError(error) {
  return String(error || '未知错误').replace(/[。.!！?？]+$/, '')
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
  let options = parseArguments(process.argv.slice(2))
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
  options = resolveScreenshotRenderOptions(options, config)
  const ctx = new Context()
  ctx.plugin(http)
  ctx.plugin(sqlite, sqliteConfig)
  ctx.plugin(puppeteer, { executablePath: browserConfig.executablePath, headless: true })
  installTables(ctx)
  await ctx.start()

  const records = []
  const runId = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')
  const runOutput = path.join(options.attemptOutput, runId)
  const renderPolicy = {
    imageRetries: options.imageRetries,
    imageTimeoutMs: options.imageTimeout * 1000,
    settleMs: options.settleMs,
  }
  const capture = async (file, command, caption, task) => {
    if (options.only && options.only !== command) return
    let failure
    const candidates = []
    const candidateOutput = path.join(runOutput, safeDirectoryName(command))
    await mkdir(candidateOutput, { recursive: true })
    for (let attempt = 1; attempt <= options.attempts; attempt++) {
      try {
        const result = await task(renderPolicy)
        if (!Buffer.isBuffer(result)) throw new Error('指令未返回可保存的图片数据。')
        const diagnostics = getRenderDiagnostics(result) || emptyDiagnostics()
        const candidate = { attempt, file: `attempt-${String(attempt).padStart(2, '0')}.png`, diagnostics }
        await writeFile(path.join(candidateOutput, candidate.file), result)
        candidates.push({ ...candidate, result })
        console.info(`CANDIDATE ${file} (${attempt}/${options.attempts}): ${diagnosticNote(diagnostics)}`)
      } catch (error) {
        failure = error
        console.warn(`FAILED ${file} (${attempt}/${options.attempts}): ${sanitize(error instanceof Error ? error.message : error, config)}`)
      }
    }
    if (candidates.length) {
      const best = candidates.reduce((current, candidate) => compareCandidates(candidate, current) > 0 ? candidate : current)
      await writeFile(path.join(candidateOutput, 'best.png'), best.result)
      await writeFile(path.join(options.output, file), best.result)
      const degraded = isDegraded(best.diagnostics)
      const summary = {
        command,
        caption,
        file,
        policy: renderPolicy,
        attempts: candidates.map(({ result, ...candidate }) => candidate),
        bestAttempt: best.attempt,
        selection: '优先资源和 DOM 图片全成功，其次加载成功数量最多、失败数量最少。',
      }
      await writeFile(path.join(candidateOutput, 'manifest.json'), `${JSON.stringify(summary, null, 2)}\n`)
      records.push({ file, command, caption, status: degraded ? 'degraded' : 'generated', diagnostics: best.diagnostics, bestAttempt: best.attempt, candidateDirectory: candidateOutput })
      console.info(`${degraded ? 'DEGRADED' : 'GENERATED'} ${file} (best attempt ${best.attempt})`)
      return
    }
    const reason = sanitize(failure instanceof Error ? failure.message : failure, config)
    await writeFile(path.join(candidateOutput, 'manifest.json'), `${JSON.stringify({
      command,
      caption,
      file,
      policy: renderPolicy,
      attempts: [],
      failure: reason,
    }, null, 2)}\n`)
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
    await mkdir(runOutput, { recursive: true })
    const bindings = new BindingRepository(ctx)
    const primary = await bindings.primary(options.uid)
    if (!primary) throw new Error(`未找到 ${options.uid} 的主 Steam 绑定。`)

    const api = new SteamApiClient(ctx, config)
    const player = new PlayerService(api)
    const store = new StoreService(ctx, api, config)
    const charts = new ChartsService(api, store, config)
    const replay = new ReplayService(ctx, api, store, config)

    await capture('help.png', 'steam', '📖 Steam 帮助', policy => renderHelp(ctx, config, policy))
    await capture('bindings.png', 'steam.账号.列表', '🔗 Steam 账号列表', async policy => renderBindings(ctx, config, await bindings.list(options.uid), policy))
    await capture('inventory.png', 'steam.库存', '🎒 Steam 库存', async policy => {
      const [profile, games] = await Promise.all([player.profile(primary.steamId), player.ownedGames(primary.steamId)])
      games.sort((a, b) => b.playtime_forever - a.playtime_forever)
      return renderGames(ctx, config, '🎒 Steam 库存', profile, games, games.length, false, policy)
    })
    await capture('recently-played.png', 'steam.最近游玩', '🕹️ Steam 最近游玩', async policy => {
      const [profile, games] = await Promise.all([player.profile(primary.steamId), player.recentlyPlayed(primary.steamId)])
      games.sort((a, b) => (b.playtime_2weeks || 0) - (a.playtime_2weeks || 0))
      return renderGames(ctx, config, '🕹️ Steam 最近游玩', profile, games, games.length, true, policy)
    })
    await capture(`replay-${options.year}.png`, 'steam.年度回顾', `📅 ${options.year} 年度回顾`, async () => {
      const url = await replay.shareImage(primary.steamId, options.year)
      if (!url) throw new Error(`${options.year} 年度回顾未公开或尚未生成。`)
      return (await fetchSteamImage(ctx, config, url)).data
    })
    await capture('status.png', 'steam.状态', '👤 Steam 状态', async policy => renderStatus(ctx, config, await player.statusProfile(primary.steamId), policy))
    await capture('concurrent.png', 'steam.当前热玩', '🔥 当前热玩排行榜', async policy => renderRanks(ctx, config, '🔥 当前热玩排行榜', await charts.concurrentRanks(), policy))
    await capture('daily.png', 'steam.每日热玩', '📈 每日热玩排行榜', async policy => renderRanks(ctx, config, '📈 每日热玩排行榜', await charts.dailyRanks(), policy))
    await capture('top-new-releases.png', 'steam.热门新品', '🆕 热门新品排行榜', async policy => renderRanks(ctx, config, '🆕 热门新品排行榜', await charts.topNewReleases(), policy))
    await capture('top-sellers.png', 'steam.本周热销', '🛒 本周热销排行榜', async policy => renderRanks(ctx, config, '🛒 本周热销排行榜', await store.topSellers(false), policy))
    await capture('weekly-top-sellers.png', 'steam.上周热销', '🕘 上周热销排行榜', async policy => renderRanks(ctx, config, '🕘 上周热销排行榜', await store.topSellers(true), policy))
    await capture(`best-of-year-${options.year}.png`, 'steam.年度排行', `🏆 ${options.year} 年度热玩排行`, async policy => renderRanks(ctx, config, `🏆 ${options.year} 年度热玩排行`, await replay.bestOfYear('热玩', options.year), policy))
    await capture('storefront.png', 'steam.特惠', '🎁 Steam 商店推荐', async policy => renderStorefront(ctx, config, await store.featuredCategories(), policy))
  } finally {
    await writeFile(path.join(runOutput, 'manifest.json'), `${JSON.stringify({ uid: options.uid, year: options.year, generatedAt: new Date().toISOString(), options: { attempts: options.attempts, imageRetries: options.imageRetries, imageTimeout: options.imageTimeout, settleMs: options.settleMs }, records }, null, 2)}\n`)
    if (!options.only) {
      await mkdir(options.output, { recursive: true })
      await writeFile(path.join(options.output, 'report.json'), `${JSON.stringify({ uid: options.uid, year: options.year, generatedAt: new Date().toISOString(), records }, null, 2)}\n`)
      await writeFile(path.join(options.output, 'report.md'), markdownReport(records, options))
      await updateReadme(records).catch(error => console.error(`README 截图区更新失败：${error.message}`))
    }
    await ctx.stop().catch(() => undefined)
  }
}

main().catch(error => {
  console.error(`截图生成失败：${error.message}`)
  process.exitCode = 1
})
