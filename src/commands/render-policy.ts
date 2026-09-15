import type { Command } from 'koishi'
import type { RenderPolicy } from '../render/policy'

export interface RenderCommandOptions {
  imageTimeout?: number
  settleMs?: number
}

export function addRenderOptions(command: Command) {
  return command
    .option('imageTimeout', '-t, --image-timeout <seconds:number> 单次图片加载超时（1-30 秒）')
    .option('settleMs', '-s, --settle-ms <milliseconds:number> 单次渲染稳定等待（0-10000 毫秒）')
}

export function commandRenderPolicy(options: RenderCommandOptions): Partial<RenderPolicy> {
  const imageTimeout = validateInteger(options.imageTimeout, 1, 30, '🖼️ 图片加载超时')
  const settleMs = validateInteger(options.settleMs, 0, 10_000, '⏳ 渲染稳定等待')
  return {
    imageTimeoutMs: imageTimeout === undefined ? undefined : imageTimeout * 1000,
    settleMs,
  }
}

function validateInteger(value: unknown, min: number, max: number, label: string): number | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${label}应为 ${min}-${max} 之间的整数。`)
  }
  return value
}
