export interface SteamGame {
  appid: number
  name: string
  playtime_forever: number
  playtime_2weeks?: number
  img_icon_url?: string
}

export interface SteamProfile {
  steamId: string
  name: string
  avatar?: string
}

export interface StorefrontItem {
  appid: number
  name: string
  image?: string
  price: string
  originalPrice?: string
  discount?: string
  description?: string
}

export interface StorefrontSection {
  key: 'specials' | 'coming_soon' | 'top_sellers' | 'new_releases'
  title: string
  items: StorefrontItem[]
}

export interface SteamStatusProfile {
  steamId: string
  name: string
  avatar?: string
  frame?: string
  background?: string
  personaState: number
  gameId?: number
  gameName?: string
  level?: number
  createdAt?: number
  lastLogoff?: number
  countryCode?: string
}

export interface RankEntry {
  rank: number
  appid: number
  name: string
  detail: string
  description?: string
  image?: string
  price?: string
}

export interface SteamBinding {
  uid: string
  steamId: string
  isPrimary: boolean
  createdAt: Date
}
