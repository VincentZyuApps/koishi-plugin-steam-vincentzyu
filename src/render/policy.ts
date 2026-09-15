export interface RenderPolicy {
  imageRetries: number
  imageTimeoutMs: number
  settleMs: number
}

export const DEFAULT_RENDER_POLICY: RenderPolicy = {
  imageRetries: 2,
  imageTimeoutMs: 20_000,
  settleMs: 2222,
}

export function resolveRenderPolicy(overrides: Partial<RenderPolicy> = {}): RenderPolicy {
  return {
    imageRetries: clampInteger(overrides.imageRetries, DEFAULT_RENDER_POLICY.imageRetries, 0, 10),
    imageTimeoutMs: clampInteger(overrides.imageTimeoutMs, DEFAULT_RENDER_POLICY.imageTimeoutMs, 1_000, 30_000),
    settleMs: clampInteger(overrides.settleMs, DEFAULT_RENDER_POLICY.settleMs, 0, 10_000),
  }
}

export function resolveConfigRenderPolicy(config: Config, overrides: Partial<RenderPolicy> = {}): RenderPolicy {
  return resolveRenderPolicy({
    imageRetries: overrides.imageRetries,
    imageTimeoutMs: overrides.imageTimeoutMs ?? config.imageLoadTimeout * 1000,
    settleMs: overrides.settleMs ?? config.renderSettleMs,
  })
}

function clampInteger(value: number | undefined, fallback: number, min: number, max: number) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, Math.round(number)))
}
import type { Config } from '../config'
