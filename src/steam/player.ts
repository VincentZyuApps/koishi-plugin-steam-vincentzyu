import type { SteamGame, SteamProfile, SteamStatusProfile } from '../types'
import { normalizeNumericSteamId } from '../shared/steam-id'
import { SteamApiClient } from './client'

export class PlayerService {
  constructor(private api: SteamApiClient) {}

  async resolveSteamId(input: string): Promise<string> {
    const value = input.trim()
    const profile = value.match(/steamcommunity\.com\/profiles\/(\d+)/i)?.[1]
    if (profile) return normalizeNumericSteamId(profile)
    const vanity = value.match(/steamcommunity\.com\/id\/([^/?#]+)/i)?.[1]
    if (vanity) {
      const data = await this.api.get<{ success: number, steamid?: string }>('ISteamUser/ResolveVanityURL/v0001/', { vanityurl: vanity })
      if (data.success !== 1 || !data.steamid) throw new Error('🔎 未找到该 Steam 个人主页。')
      return data.steamid
    }
    return normalizeNumericSteamId(value)
  }

  async profile(steamId: string): Promise<SteamProfile> {
    const data = await this.api.get<{ players?: Array<{ steamid: string, personaname?: string, avatarfull?: string }> }>('ISteamUser/GetPlayerSummaries/v0002/', { steamids: steamId })
    const player = data.players?.[0]
    return { steamId, name: player?.personaname || steamId, avatar: player?.avatarfull }
  }

  async statusProfile(steamId: string): Promise<SteamStatusProfile> {
    const data = await this.api.get<{ players?: PlayerSummary[] }>('ISteamUser/GetPlayerSummaries/v0002/', { steamids: steamId })
    const player = data.players?.[0]
    if (!player) throw new Error('🔎 未找到该 Steam 账号的信息。')
    if (player.communityvisibilitystate !== 3) throw new Error(`🔒 ${player.personaname || steamId} 的个人资料未公开。`)

    // Profile decorations are optional: account state remains useful when Steam omits or rejects them.
    let equipped: EquippedProfileItems = {}
    try {
      equipped = await this.api.get<EquippedProfileItems>('IPlayerService/GetProfileItemsEquipped/v1/', { steamid: steamId })
    } catch {
      // Fall back to the regular Steam avatar and the card's default background.
    }
    return {
      steamId: player.steamid,
      name: player.personaname || player.steamid,
      avatar: staticAsset(equipped.animated_avatar?.image_small) || player.avatarfull,
      frame: staticAsset(equipped.avatar_frame?.image_small),
      background: staticAsset(equipped.mini_profile_background?.image_large || equipped.profile_background?.image_large),
      personaState: Number(player.personastate) || 0,
      gameId: player.gameid ? Number(player.gameid) : undefined,
      gameName: player.gameextrainfo,
      createdAt: player.timecreated,
      lastLogoff: player.lastlogoff,
      countryCode: player.loccountrycode,
    }
  }

  async ownedGames(steamId: string) {
    const data = await this.api.get<{ games?: SteamGame[] }>('IPlayerService/GetOwnedGames/v0001/', {
      steamid: steamId,
      include_appinfo: true,
      include_played_free_games: true,
    })
    return data.games || []
  }

  async recentlyPlayed(steamId: string) {
    const data = await this.api.get<{ games?: SteamGame[] }>('IPlayerService/GetRecentlyPlayedGames/v0001/', { steamid: steamId })
    return data.games || []
  }
}

interface PlayerSummary {
  steamid: string
  personaname?: string
  avatarfull?: string
  personastate?: number
  gameid?: string | number
  gameextrainfo?: string
  timecreated?: number
  lastlogoff?: number
  loccountrycode?: string
  communityvisibilitystate?: number
}

interface EquippedProfileItems {
  animated_avatar?: { image_small?: string }
  avatar_frame?: { image_small?: string }
  mini_profile_background?: { image_large?: string }
  profile_background?: { image_large?: string }
}

function staticAsset(path?: string) {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  if (path.startsWith('items/') || path.startsWith('apps/')) return `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/${path}`
  if (path.startsWith('steam')) return `https://shared.akamai.steamstatic.com/store_item_assets/${path}`
  return `https://clan.fastly.steamstatic.com/images/${path}`
}
