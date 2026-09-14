import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { FONT_MODE, type Config } from '../config'

const require = createRequire(__filename)
const extensions = new Set(['.ttf', '.otf', '.woff', '.woff2'])
const systemStack = "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif"
const cssCache = new Map<string, string>()

function rangeIncludes(range: string, point: number) {
  return range.split(',').some((item) => {
    const [fromText, toText] = item.trim().replace(/^U\+/i, '').split('-')
    const from = Number.parseInt(fromText, 16)
    const to = Number.parseInt(toText || fromText, 16)
    return point >= from && point <= to
  })
}

function npmFontCss(content: string) {
  const cssPath = require.resolve('@chinese-fonts/lxgwwenkai/dist/LXGWWenKai-Regular/result.css')
  const source = readFileSync(cssPath, 'utf8')
  const faces: string[] = source.match(/@font-face\{[^}]+\}/g) || []
  const points = [...new Set(Array.from(content).map(char => char.codePointAt(0)!))]
  const selected = points.length ? faces.filter((face) => {
    const range = face.match(/unicode-range:([^;]+);/)?.[1]
    return range && points.some(point => rangeIncludes(range, point))
  }) : faces
  const key = `${cssPath}:${selected.join('')}`
  const cached = cssCache.get(key)
  if (cached) return cached
  const directory = path.dirname(cssPath)
  const css = selected.map(face => face
    .replace(/local\("LXGW WenKai"\),/g, '')
    .replace(/font-display:swap/g, 'font-display:block')
    .replace(/url\((['"]?)(\.\/[^)'"]+)\1\)/g, (_all, _quote, relativePath) => {
      const file = path.resolve(directory, relativePath)
      return `url('data:font/woff2;base64,${readFileSync(file).toString('base64')}')`
    }))
    .join('\n')
  const result = `${css}\nbody { font-family: 'LXGW WenKai', ${systemStack}; }`
  cssCache.set(key, result)
  return result
}

export function resolveFontCss(config: Config, content: string) {
  if (config.fontMode === FONT_MODE.NPM_LXGW) return npmFontCss(content)
  if (config.fontMode === FONT_MODE.SYSTEM_DEFAULT) return `body { font-family: ${systemStack}; }`
  const fontPath = config.customFontPath.trim()
  if (!fontPath) throw new Error('🔤 已选择自定义字体，但未填写字体文件路径。')
  if (!path.isAbsolute(fontPath)) throw new Error(`🔤 自定义字体路径必须为绝对路径：${fontPath}`)
  if (!existsSync(fontPath)) throw new Error(`🔤 自定义字体文件不存在：${fontPath}`)
  const extension = path.extname(fontPath).toLowerCase()
  if (!extensions.has(extension)) throw new Error('🔤 自定义字体仅支持 .ttf、.otf、.woff、.woff2。')
  return [
    '@font-face {',
    "font-family: 'SteamCustomFont';",
    `src: url('${pathToFileURL(fontPath).href}') format('${extension.slice(1)}');`,
    'font-display: block;',
    '}',
    `body { font-family: 'SteamCustomFont', ${systemStack}; }`,
  ].join('\n')
}
