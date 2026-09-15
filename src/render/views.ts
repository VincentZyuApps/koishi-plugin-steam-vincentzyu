import type { Context } from 'koishi'
import type { Config } from '../config'
import { imageDataUrl } from '../steam/http'
import { escapeHtml } from './template-loader'
import { resolveConfigRenderPolicy, type RenderPolicy } from './policy'

export interface ImageLoadFailure {
  url: string
  attempts: number
  error: string
}

export interface ImageLoadSummary {
  requested: number
  loaded: number
  failures: ImageLoadFailure[]
}

export interface ResolvedSteamImages {
  sources: Map<string, string>
  summary: ImageLoadSummary
}

export function steamImage(url: string | undefined, alt: string) {
  return url
    ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}">`
    : '<div class="image-placeholder">Steam</div>'
}

export async function resolveSteamImages(ctx: Context, config: Config, urls: Array<string | undefined>, policyOverrides?: Partial<RenderPolicy>): Promise<ResolvedSteamImages> {
  const uniqueUrls = [...new Set(urls.filter((url): url is string => Boolean(url)))]
  const policy = resolveConfigRenderPolicy(config, policyOverrides)
  const sources = new Map<string, string>()
  const failures: ImageLoadFailure[] = []
  let cursor = 0
  const worker = async () => {
    while (cursor < uniqueUrls.length) {
      const url = uniqueUrls[cursor++]
      let failure: unknown
      let attempts = 0
      for (let attempt = 1; attempt <= policy.imageRetries + 1; attempt++) {
        for (const candidate of imageCandidates(url)) {
          attempts++
          try {
            // Always inline assets so Chromium never needs an independent CDN request.
            sources.set(url, await imageDataUrl(ctx, config, candidate, policy.imageTimeoutMs))
            failure = undefined
            break
          } catch (error) {
            failure = error
          }
        }
        if (!failure) break
      }
      if (failure) {
        failures.push({
          url,
          attempts,
          error: imageError(failure),
        })
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(6, uniqueUrls.length) }, worker))
  return {
    sources,
    summary: { requested: uniqueUrls.length, loaded: sources.size, failures },
  }
}

function imageCandidates(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'avatars.steamstatic.com') {
      parsed.hostname = 'avatars.akamai.steamstatic.com'
      return [url, parsed.toString()]
    }
  } catch {
    // Keep the original URL so the request error remains visible in diagnostics.
  }
  return [url]
}

function imageError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '未知错误')
  return message.replace(/(authorization|cookie|token)=([^\s&]+)/gi, '$1=***')
}
