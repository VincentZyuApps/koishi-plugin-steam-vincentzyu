import type { Context } from 'koishi'
import type { Config } from '../config'
import { imageDataUrl, shouldProxy } from '../steam/http'
import { escapeHtml } from './template-loader'

export function steamImage(url: string | undefined, alt: string) {
  return url
    ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}">`
    : '<div class="image-placeholder">Steam</div>'
}

export async function resolveSteamImages(ctx: Context, config: Config, urls: Array<string | undefined>) {
  const uniqueUrls = [...new Set(urls.filter((url): url is string => Boolean(url)))]
  if (!shouldProxy(config, 'images')) return new Map(uniqueUrls.map(url => [url, url]))

  const sources = new Map<string, string>()
  let cursor = 0
  const worker = async () => {
    while (cursor < uniqueUrls.length) {
      const url = uniqueUrls[cursor++]
      try {
        sources.set(url, await imageDataUrl(ctx, config, url))
      } catch {
        // Keep the card usable without allowing Puppeteer to bypass the image proxy.
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(6, uniqueUrls.length) }, worker))
  return sources
}
