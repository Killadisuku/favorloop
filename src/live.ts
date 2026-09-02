import type { AppState, FavorRequest, User } from './types'
import { levelFor } from './data'

type RandomUser = {
  login: { uuid: string; username: string }
  name: { first: string; last: string }
  email: string
  location: {
    city: string
    state: string
    country: string
    street: { number: number; name: string }
    coordinates: { latitude: string; longitude: string }
  }
  picture: { large: string; medium: string }
  registered: { date: string }
}

export type Place = { city: string; region: string; country: string; lat: number; lng: number }

const LIVE_SEED = 'favorloop-v5'
const LIVE_COUNT = 20

const SKILL_SETS = [
  ['Tech setup', 'Wi-Fi', 'Laptops'],
  ['Moving', 'Home repair', 'Assembly'],
  ['Errands', 'Parcels', 'Groceries'],
  ['English', 'Tutoring', 'Study'],
  ['Excel', 'Spreadsheets', 'Planning'],
  ['Photo editing', 'Creative', 'Design'],
  ['Driving', 'Transport', 'Pickup'],
  ['Shopping', 'Second opinions'],
]
const NEED_SETS = [
  ['Moving small items', 'Errands'],
  ['Tech', 'Home'],
  ['Language practice', 'Learning'],
  ['Transport', 'Shopping'],
  ['Creative', 'Design feedback'],
]

const FAVOR_TEMPLATES: Array<{
  title: string
  description: (place: string) => string
  category: FavorRequest['category']
  reward: number
  timeEstimate: FavorRequest['timeEstimate']
}> = [
  { title: 'Can someone help me set up my Wi-Fi router?', description: (p) => `New ISP router is blinking and nothing connects. I'm in ${p} with the box, cable, and tea ready.`, category: 'Tech', reward: 1, timeEstimate: '15–30 min' },
  { title: 'Need help carrying two boxes downstairs', description: (p) => `Medium boxes, third floor to lobby in ${p}. Elevator is out until Friday.`, category: 'Home', reward: 2, timeEstimate: '5–15 min' },
  { title: 'Help me move a small table', description: (p) => `Side table from the apartment down to a car at the curb in ${p}. One extra person is enough.`, category: 'Home', reward: 1, timeEstimate: '5–15 min' },
  { title: 'Need someone to practice English with', description: (p) => `Thirty minutes nearby in ${p}. Casual conversation.`, category: 'Learning', reward: 2, timeEstimate: '15–30 min' },
  { title: 'Help me choose between two laptops', description: () => 'Shortlisted two machines for design work. Need someone who actually uses them.', category: 'Tech', reward: 1, timeEstimate: '15–30 min' },
  { title: 'Need help assembling a shelf', description: (p) => `Flat-pack shelf, all parts here in ${p}. Looking for a second pair of hands.`, category: 'Home', reward: 2, timeEstimate: '30–60 min' },
  { title: 'Can someone pick up a small parcel?', description: (p) => `Locker pickup near ${p}, book-sized package.`, category: 'Errands', reward: 1, timeEstimate: '15–30 min' },
  { title: 'Help me understand this spreadsheet formula', description: () => 'Nested lookup keeps returning an error. Twenty minutes is enough.', category: 'Learning', reward: 1, timeEstimate: '15–30 min' },
  { title: 'Need someone to teach me basic photo editing', description: () => 'Crop, layers, and export for social. Laptop is ready.', category: 'Creative', reward: 3, timeEstimate: '30–60 min' },
  { title: 'Second opinion on a used bike listing', description: (p) => `Seller is nearby in ${p}. Want someone who knows bikes.`, category: 'Shopping', reward: 1, timeEstimate: '15–30 min' },
  { title: 'Help carry groceries up two flights', description: (p) => `Four bags after a big shop near ${p}. Stairs only today.`, category: 'Errands', reward: 1, timeEstimate: '5–15 min' },
  { title: 'Walk me through connecting a printer', description: () => 'Wireless printer sees the network, computer does not.', category: 'Tech', reward: 1, timeEstimate: '15–30 min' },
  { title: 'Need a ride to drop off donations', description: (p) => `Two bags of clothes going across ${p}. About 20 minutes.`, category: 'Transport', reward: 2, timeEstimate: '15–30 min' },
  { title: 'Help me hang two frames straight', description: (p) => `Frames and a tape measure ready in ${p}.`, category: 'Home', reward: 1, timeEstimate: '5–15 min' },
  { title: 'Look over a short resume with me', description: () => 'One page. Want a second pair of eyes tonight.', category: 'Learning', reward: 2, timeEstimate: '15–30 min' },
  { title: 'Help me pick a reliable used phone', description: (p) => `Two listings in ${p}. Need someone who can spot a refurbished trap.`, category: 'Shopping', reward: 1, timeEstimate: '15–30 min' },
]

export const DEFAULT_PLACE: Place = { city: 'Dubai', region: 'Dubai', country: 'United Arab Emirates', lat: 25.0772, lng: 55.1398 }

function hueFromId(id: string) {
  let n = 0
  for (const c of id) n = (n + c.charCodeAt(0) * 17) % 360
  return n
}
function hash(s: string) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}
function offsetPlace(origin: Place, id: string) {
  const h = hash(id)
  const angle = ((h % 360) * Math.PI) / 180
  const km = 0.25 + (h % 42) / 10
  const dLat = (km * Math.cos(angle)) / 111
  const dLng = (km * Math.sin(angle)) / (111 * Math.max(0.2, Math.cos((origin.lat * Math.PI) / 180)))
  return { lat: origin.lat + dLat, lng: origin.lng + dLng }
}

export function userFromRandom(p: RandomUser, place: Place): User {
  const given = 3 + (hash(p.login.uuid) % 40)
  const received = 2 + (hash(p.email) % 16)
  const trust = 78 + (hash(p.login.username) % 21)
  const lvl = levelFor(given)
  const badges = ['Trusted Member']
  if (given >= 5) badges.unshift('Community Helper')
  if (given >= 25) badges.unshift('Community Hero')
  const pin = offsetPlace(place, p.login.uuid)
  return {
    id: `ru-${p.login.uuid.slice(0, 8)}`,
    name: `${p.name.first} ${p.name.last}`,
    handle: p.login.username,
    email: p.email,
    city: place.city,
    area: p.location.street.name,
    country: place.country,
    lat: pin.lat,
    lng: pin.lng,
    avatarHue: hueFromId(p.login.uuid),
    photo: p.picture.large,
    bio: `Neighbor on ${p.location.street.name} in ${place.city}. Originally from ${p.location.city}, ${p.location.country}.`,
    skills: SKILL_SETS[hash(p.login.username) % SKILL_SETS.length],
    needHelpWith: NEED_SETS[hash(p.email) % NEED_SETS.length],
    trust,
    favorsGiven: given,
    favorsReceived: received,
    balance: 3 + (hash(p.name.first) % 12),
    streak: hash(p.name.last) % 8,
    level: lvl.level,
    verified: hash(p.email) % 3 !== 0,
    plus: hash(p.login.username) % 5 === 0,
    traits: { helpful: Math.min(99, trust - 2), reliable: Math.min(99, trust - 1), friendly: Math.min(99, trust - 4), problemSolver: Math.min(99, trust - 6) },
    badges,
    joinedAt: p.registered.date.slice(0, 10),
  }
}

const FALLBACK_SNAPSHOT: Array<[string, string, string, string, string, string, string, string]> = [
  ['42b89ac1', 'Charlie', 'Campbell', 'yellowgorilla259', 'charlie.campbell@example.com', 'Southampton', 'Park Rd', 'women/50'],
  ['8cbf05f2', 'Elijah', 'Garza', 'bluemeercat648', 'elijah.garza@example.com', 'Orange', 'Hogan St', 'men/18'],
  ['ef539975', 'Lenn', 'Stokkink', 'blueleopard721', 'lenn.stokkink@example.com', 'Gulpen', 'Amaryllisplein', 'men/95'],
  ['134508ac', 'Adem', 'Asikoglu', 'bluesnake898', 'adem.asikoglu@example.com', 'Osmaniye', 'Doktorlar Cd', 'men/59'],
  ['d2f52924', 'Mandy', 'Webb', 'yellowgoose956', 'mandy.webb@example.com', 'Salisbury', 'King Street', 'women/55'],
  ['f242ded7', 'Louanne', 'Dubois', 'smallkoala134', 'louanne.dubois@example.com', 'Paris', 'Rue Duquesne', 'women/8'],
]

export const FALLBACK_PEOPLE: RandomUser[] = FALLBACK_SNAPSHOT.map(([id, first, last, handle, email, city, street, portrait]) => ({
  login: { uuid: `${id}-live`, username: handle },
  name: { first, last },
  email,
  location: { city, state: city, country: 'Unknown', street: { number: 1, name: street }, coordinates: { latitude: '0', longitude: '0' } },
  picture: { large: `https://randomuser.me/api/portraits/${portrait}.jpg`, medium: `https://randomuser.me/api/portraits/med/${portrait}.jpg` },
  registered: { date: '2018-01-01' },
}))

export async function fetchVisitorPlace(): Promise<Place> {
  try {
    const res = await fetch('https://ipwho.is/')
    if (!res.ok) return DEFAULT_PLACE
    const json = (await res.json()) as { success?: boolean; city?: string; region?: string; country?: string; latitude?: number; longitude?: number }
    if (!json.success || !json.city || json.latitude == null || json.longitude == null) return DEFAULT_PLACE
    return { city: json.city, region: json.region || json.city, country: json.country || DEFAULT_PLACE.country, lat: json.latitude, lng: json.longitude }
  } catch {
    return DEFAULT_PLACE
  }
}

export async function fetchLivePeople(place: Place = DEFAULT_PLACE, count = LIVE_COUNT): Promise<User[]> {
  try {
    const res = await fetch(`https://randomuser.me/api/?results=${count}&seed=${LIVE_SEED}&nat=us,gb,ie,nl,de,fr,in,tr,au,ca&inc=name,location,email,login,picture,registered,dob,nat`)
    if (!res.ok) throw new Error('live people unavailable')
    const json = (await res.json()) as { results: RandomUser[] }
    if (!json.results?.length) throw new Error('empty community')
    return json.results.map((p) => userFromRandom(p, place))
  } catch {
    return FALLBACK_PEOPLE.map((p) => userFromRandom(p, place))
  }
}

export function favorsFromPeople(people: User[], place: Place = DEFAULT_PLACE): FavorRequest[] {
  const now = Date.now()
  return people.slice(0, FAVOR_TEMPLATES.length).map((person, i) => {
    const t = FAVOR_TEMPLATES[i]
    const hoursAgo = 1 + (hash(person.id) % 18)
    const km = person.lat != null && person.lng != null
      ? Math.round(haversineKm({ lat: place.lat, lng: place.lng }, { lat: person.lat, lng: person.lng }) * 10) / 10
      : Math.round((0.4 + (hash(person.id + t.title) % 36) / 10) * 10) / 10
    return {
      id: `live-${person.id}-${i}`,
      authorId: person.id,
      title: t.title,
      description: t.description(person.area ? `${person.area}, ${place.city}` : place.city),
      category: t.category,
      distanceKm: Math.max(0.2, km),
      reward: t.reward,
      timeEstimate: t.timeEstimate,
      status: 'OPEN',
      createdAt: new Date(now - hoursAgo * 3600_000).toISOString(),
    }
  })
}

export async function loadLiveCommunity() {
  const place = await fetchVisitorPlace()
  const people = await fetchLivePeople(place)
  return { people, favors: favorsFromPeople(people, place), place }
}

export function mergeLiveCommunity(s: AppState, live: { people: User[]; favors: FavorRequest[]; place: Place }): AppState {
  const localUsers = s.users.filter((u) => !u.id.startsWith('ru-'))
  const byId = new Map(localUsers.map((u) => [u.id, u]))
  for (const p of live.people) {
    const prev = byId.get(p.id)
    byId.set(p.id, prev ? { ...p, balance: prev.balance, favorsGiven: prev.favorsGiven, favorsReceived: prev.favorsReceived } : p)
  }
  const users = [...byId.values()].map((u) => u.id.startsWith('ru-') ? u : {
    ...u,
    city: u.city && u.city !== 'Dubai' ? u.city : live.place.city,
    country: u.country || live.place.country,
    lat: u.lat ?? live.place.lat,
    lng: u.lng ?? live.place.lng,
    area: u.area || live.place.region,
  })
  const keptFavors = s.favors.filter((f) => !((f.id.startsWith('live-') || f.id.startsWith('f-')) && f.status === 'OPEN'))
  const existingIds = new Set(keptFavors.map((f) => f.id))
  return { ...s, users, favors: [...live.favors.filter((f) => !existingIds.has(f.id)), ...keptFavors] }
}
