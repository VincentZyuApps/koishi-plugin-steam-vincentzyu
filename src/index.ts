import { Context } from 'koishi'
import { registerBindingCommands } from './commands/binding'
import { registerChartsCommands } from './commands/charts'
import { registerHelpCommands } from './commands/help'
import { registerLibraryCommands } from './commands/library'
import { registerReplayCommands } from './commands/replay'
import { registerStatusCommands } from './commands/status'
import { registerStorefrontCommands } from './commands/storefront'
import { Config, type Config as SteamConfig } from './config'
import { BindingRepository } from './database/bindings'
import { installTables } from './database/tables'
import { ChartsService } from './steam/charts'
import { SteamApiClient } from './steam/client'
import { PlayerService } from './steam/player'
import { ReplayService } from './steam/replay'
import { StoreService } from './steam/store'

export const name = 'steam-vincentzyu'
export const inject = { required: ['database', 'puppeteer', 'http'] }
export { Config }

export function apply(ctx: Context, config: SteamConfig) {
  installTables(ctx)

  const bindings = new BindingRepository(ctx)
  const api = new SteamApiClient(ctx, config)
  const player = new PlayerService(api)
  const store = new StoreService(ctx, api, config)
  const charts = new ChartsService(api, store, config)
  const replay = new ReplayService(ctx, api, store, config)
  const services = { ctx, config, bindings, player }

  registerHelpCommands(services)
  registerBindingCommands(services)
  registerLibraryCommands(services)
  registerStatusCommands(services)
  registerReplayCommands(services, replay)
  registerChartsCommands(services, charts, store, replay)
  registerStorefrontCommands(services, store)
}
