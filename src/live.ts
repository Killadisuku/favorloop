import type { FavorRequest, User } from './types'
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
  dob: { age: number }
}

const FAVOR_TEMPLATES: Array<{
  title: string
  description: string
  category: FavorRequest['category']
  reward: number
  timeEstimate: FavorRequest['timeEstimate']
}> = [
  { title: 'Can someone help me set up my Wi-Fi router?', description: 'New ISP router is blinking and nothing connects. Box, cable, and tea are ready.', category: 'Tech', reward: 1, timeEstimate: '15–30 min' },
  { title: 'Need help carrying two boxes downstairs', description: 'Medium boxes, third floor to lobby. Elevator is out until Friday.', category: 'Home', reward: 2, timeEstimate: '5–15 min' },
  { title: 'Help me move a small table', description: 'Side table from the apartment down to a car at the curb. One extra person is enough.', category: 'Home', reward: 1, timeEstimate: '5–15 min' },
  { title: 'Need someone to practice English with', description: 'Thirty minutes, casual conversation — work, weekends, neighborhood spots.', category: 'Learning', reward: 2, timeEstimate: '15–30 min' },
  { title: 'Help me choose between two laptops', description: 'Shortlisted two machines for design work. Need someone who actually uses them.', category: 'Tech', reward: 1, timeEstimate: '15–30 min' },
  { title: 'Need help assembling a shelf', description: 'Flat-pack shelf, all parts here. Looking for a second pair of hands and a level.', category: 'Home', reward: 2, timeEstimate: '30–60 min' },
  { title: 'Can someone pick up a small parcel?', description: 'Locker pickup, book-sized package. Happy to meet in the lobby after.', category: 'Errands', reward: 1, timeEstimate: '15–30 min' },
  { title: 'Help me understand this spreadsheet formula', description: 'Nested lookup keeps returning an error. Screen-share or sit with me for 20 minutes.', category: 'Learning', reward: 1, timeEstimate: '15–30 min' },
  { title: 'Need someone to teach me basic photo editing', description: 'Crop, layers, and export for social. Laptop is ready.', category: 'Creative', reward: 3, timeEstimate: '30–60 min' },
  { title: 'Second opinion on a used bike listing', description: 'Seller is nearby. Want someone who knows bikes to look at photos / come along.', category: 'Shopping', reward: 1, timeEstimate: '15–30 min' },
  { title: 'Help carry groceries up two flights', description: 'Four bags after a big shop. Building stairs only today.', category: 'Errands', reward: 1, timeEstimate: '5–15 min' },
  { title: 'Walk me through connecting a printer', description: 'Wireless printer sees the network, computer does not. Need a calm pair of eyes.', category: 'Tech', reward: 1, timeEstimate: '15–30 min' },
]

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

export function userFromRandom(p: RandomUser): User {
  const given = 3 + (hash(p.login.uuid) % 40)
  const received = 2 + (hash(p.email) % 16)
  const trust = 78 + (hash(p.login.username) % 21)
  const lvl = levelFor(given)
  const badges = ['Trusted Member']
  if (given >= 5) badges.unshift('Community Helper')
  if (given >= 25) badges.unshift('Community Hero')
  return {
    id: `ru-${p.login.uuid.slice(0, 8)}`,
    name: `${p.name.first} ${p.name.last}`,
    handle: p.login.username,
    email: p.email,
    city: p.location.city,
    area: p.location.street.name,
    avatarHue: hueFromId(p.login.uuid),
    photo: p.picture.large,
    bio: `Lives near ${p.location.street.name} in ${p.location.city}.`,
    skills: [],
    needHelpWith: [],
    trust,
    favorsGiven: given,
    favorsReceived: received,
    balance: 3 + (hash(p.name.first) % 12),
    streak: hash(p.name.last) % 8,
    level: lvl.level,
    verified: hash(p.email) % 3 !== 0,
    plus: hash(p.login.username) % 5 === 0,
    traits: {
      helpful: Math.min(99, trust - 2),
      reliable: Math.min(99, trust - 1),
      friendly: Math.min(99, trust - 4),
      problemSolver: Math.min(99, trust - 6),
    },
    badges,
    joinedAt: p.registered.date.slice(0, 10),
  }
}

export async function fetchLivePeople(count = 16): Promise<User[]> {
  const url = `https://randomuser.me/api/?results=${count}&nat=us,gb,ie,nl,de,fr,in,tr&inc=name,location,email,login,picture,registered,dob`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Could not load live community')
  const json = (await res.json()) as { results: RandomUser[] }
  return json.results.map(userFromRandom)
}

export function favorsFromPeople(people: User[]): FavorRequest[] {
  const now = Date.now()
  return people.slice(0, FAVOR_TEMPLATES.length).map((person, i) => {
    const t = FAVOR_TEMPLATES[i]
    const hoursAgo = 1 + (hash(person.id) % 18)
    return {
      id: `live-${person.id}-${i}`,
      authorId: person.id,
      title: t.title,
      description: t.description,
      category: t.category,
      distanceKm: Math.round((0.4 + (hash(person.id + t.title) % 36) / 10) * 10) / 10,
      reward: t.reward,
      timeEstimate: t.timeEstimate,
      status: 'OPEN',
      createdAt: new Date(now - hoursAgo * 3600_000).toISOString(),
    }
  })
}
