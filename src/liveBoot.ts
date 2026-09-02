import { createSeedState, SEED_VERSION } from './data'
import { loadLiveCommunity, mergeLiveCommunity } from './live'

const KEY = 'favorloop.v5'

export async function bootLive() {
  try {
    const live = await loadLiveCommunity()
    if (!live.people.length) return
    let state
    try {
      const raw = localStorage.getItem(KEY)
      state = raw ? JSON.parse(raw) : createSeedState()
      if (state.seedVersion !== SEED_VERSION) state = createSeedState()
    } catch {
      state = createSeedState()
    }
    localStorage.setItem(KEY, JSON.stringify(mergeLiveCommunity(state, live)))
  } catch {
    /* offline: keep seeded community */
  }
}
