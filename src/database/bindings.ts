import type { Context } from 'koishi'

export class BindingRepository {
  constructor(private ctx: Context) {}

  async list(uid: string) {
    const rows = await this.ctx.database.get('steam_binding', { uid })
    return rows.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.createdAt.getTime() - b.createdAt.getTime())
  }

  async primary(uid: string) {
    const rows = await this.ctx.database.get('steam_binding', { uid, isPrimary: true })
    return rows[0]
  }

  async add(uid: string, steamId: string) {
    await this.ctx.database.withTransaction(async (database) => {
      await database.set('steam_binding', { uid }, { isPrimary: false })
      await database.upsert('steam_binding', [{ uid, steamId, isPrimary: true, createdAt: new Date() }])
    })
  }

  async switch(uid: string, index: number) {
    const item = (await this.list(uid))[index - 1]
    if (!item) return false
    await this.ctx.database.withTransaction(async (database) => {
      await database.set('steam_binding', { uid }, { isPrimary: false })
      await database.set('steam_binding', { uid, steamId: item.steamId }, { isPrimary: true })
    })
    return item
  }

  async remove(uid: string, index: number) {
    const item = (await this.list(uid))[index - 1]
    if (!item) return false
    await this.ctx.database.withTransaction(async (database) => {
      await database.remove('steam_binding', { uid, steamId: item.steamId })
      if (!item.isPrimary) return
      const remaining = await database.get('steam_binding', { uid })
      const fallback = remaining.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0]
      if (fallback) await database.set('steam_binding', { uid, steamId: fallback.steamId }, { isPrimary: true })
    })
    return item
  }
}
