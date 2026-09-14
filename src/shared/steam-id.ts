const STEAM_ID_OFFSET = 76561197960265728n

export function friendCodeFromSteamId(steamId: string) {
  return (BigInt(steamId) - STEAM_ID_OFFSET).toString()
}

export function normalizeNumericSteamId(value: string) {
  if (!/^\d+$/.test(value)) throw new Error('🪪 请输入 SteamID、数字好友码或 Steam 个人主页链接。')
  const id = BigInt(value)
  const steamId = id < STEAM_ID_OFFSET ? id + STEAM_ID_OFFSET : id
  if (steamId < STEAM_ID_OFFSET || steamId > 99999999999999999n) throw new Error('🪪 SteamID 或好友码格式不正确。')
  return steamId.toString()
}
