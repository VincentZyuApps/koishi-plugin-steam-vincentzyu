import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const cache = new Map<string, string>()

function assetsRoot() {
  return existsSync(path.join(__dirname, 'templates')) ? __dirname : path.join(__dirname, 'render')
}

function readAsset(...parts: string[]) {
  const file = path.join(assetsRoot(), ...parts)
  const cached = cache.get(file)
  if (cached !== undefined) return cached
  const source = readFileSync(file, 'utf8')
  cache.set(file, source)
  return source
}

export function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function fillTemplate(template: string, values: Record<string, string>) {
  return template.replace(/{{([A-Z_]+)}}/g, (_all, key: string) => values[key] ?? '')
}

export function pageTemplate(name: string, values: Record<string, string>) {
  return fillTemplate(readAsset('templates', `${name}.html`), values)
}

export function partialTemplate(name: string, values: Record<string, string>) {
  return fillTemplate(readAsset('templates', 'partials', `${name}.html`), values)
}

export function allStyles() {
  return ['base.css', 'help.css', 'bindings.css', 'games.css', 'ranks.css', 'storefront.css', 'status.css']
    .map(name => readAsset('styles', name))
    .join('\n')
}

export function layout(values: Record<string, string>) {
  return fillTemplate(readAsset('templates', 'layout.html'), values)
}
