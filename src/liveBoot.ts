import { createSeedState, SEED_VERSION } from './data'
import { favorsFromPeople, fetchLivePeople } from './live'

const KEY = 'favorloop.v3'

export async function bootLive() {
  try {
    const people = await fetchLivePeople(16)
    if (!people.length) return
    const incoming = favorsFromPeople(people)
    let state
    try {
      const raw = localStorage.getItem(KEY)
      state = raw ? JSON.parse(raw) : createSeedState()
      if (state.seedVersion !== SEED_VERSION) state = createSeedState()
    } catch {
      state = createSeedState()
    }
    const byId = new Map(state.users.map((u: { id: string }) => [u.id, u]))
    for (const person of people) {
      const prev = byId.get(person.id) as { balance: number; favorsGiven: number; favorsReceived: number } | undefined
      byId.set(person.id, prev ? { ...person, balance: prev.balance, favorsGiven: prev.favorsGiven, favorsReceived: prev.favorsReceived } : person)
    }
    const kept = state.favors.filter((f: { id: string; status: string }) => !String(f.id).startsWith('live-') || f.status !== 'OPEN')
    localStorage.setItem(KEY, JSON.stringify({ ...state, users: [...byId.values()], favors: [...incoming, ...kept] }))
  } catch {
    /* offline: keep seeded community */
  }
}
