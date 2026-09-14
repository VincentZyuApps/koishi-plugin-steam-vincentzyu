import type { Context } from 'koishi'
import type { Config } from '../config'
import { displayHours } from '../shared/format'
import type { SteamGame, SteamProfile } from '../types'
import { renderPage } from './index'
import { escapeHtml, pageTemplate, partialTemplate } from './template-loader'
import { resolveSteamImages, steamImage } from './views'

export async function renderGames(ctx: Context, config: Config, title: string, profile: SteamProfile, games: SteamGame[], totalGames: number, recent = false) {
  const totalMinutes = games.reduce((sum, game) => sum + (game.playtime_forever || 0), 0)
  const recentMinutes = games.reduce((sum, game) => sum + (game.playtime_2weeks || 0), 0)
  const shown = games.slice(0, config.inventoryLimit)
  const imageUrls = shown.map(game => `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`)
  const images = await resolveSteamImages(ctx, config, imageUrls)
  const metric = (value: string | number, label: string) => partialTemplate('metric', { VALUE: escapeHtml(value), LABEL: escapeHtml(label) })
  const content = pageTemplate('games', {
    METRICS: [
      metric(totalGames, '🎮 游戏总数'),
      metric(displayHours(totalMinutes), '⏱️ 累计游玩时长'),
      metric(displayHours(recentMinutes), '📅 近两周时长'),
    ].join(''),
    SECTION_TITLE: escapeHtml(`${recent ? '🕹️ 近期游玩' : '🏅 游玩时长最高'}${shown.length < totalGames ? ` · 📋 展示前 ${shown.length} 项` : ''}`),
    GAMES: shown.map((game, index) => partialTemplate('game', {
      IMAGE: steamImage(images.get(imageUrls[index]), game.name),
      NAME: escapeHtml(game.name),
      TIME: escapeHtml(`⏱️ 累计 ${displayHours(game.playtime_forever)}${game.playtime_2weeks ? ` · 📅 近两周 ${displayHours(game.playtime_2weeks)}` : ''}`),
    })).join(''),
  })
  return renderPage(ctx, config, {
    title,
    subtitle: `${profile.name} · ${profile.steamId}`,
    content,
    fontText: `${title} 🎮 游戏总数 ⏱️ 累计游玩时长 📅 近两周时长 🕹️ 近期游玩 🏅 游玩时长最高 📋 展示前 ${profile.name} ${games.map(game => game.name).join(' ')}`,
    source: 'Steam Web API',
  })
}
