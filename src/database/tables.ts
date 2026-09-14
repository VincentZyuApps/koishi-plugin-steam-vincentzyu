import type { Context } from 'koishi'
import type { SteamBinding } from '../types'

declare module 'koishi' {
  interface Tables {
    steam_binding: SteamBinding
  }
}

export function installTables(ctx: Context) {
  ctx.model.extend('steam_binding', {
    uid: 'string',
    steamId: 'string',
    isPrimary: 'boolean',
    createdAt: 'timestamp',
  }, { primary: ['uid', 'steamId'] })
}
