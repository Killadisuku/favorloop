import type { AppState, Challenge, FavorRequest, Transaction, User } from './types'

export const CATEGORIES = ['Home','Tech','Errands','Learning','Transport','Shopping','Creative','Other'] as const
export const LEVELS = [
  { level: 1, name: 'New Neighbor', minGiven: 0 },
  { level: 2, name: 'Helpful Human', minGiven: 3 },
  { level: 3, name: 'Community Member', minGiven: 8 },
  { level: 4, name: 'Trusted Helper', minGiven: 15 },
  { level: 5, name: 'Community Hero', minGiven: 25 },
  { level: 6, name: 'Local Legend', minGiven: 40 },
]
export const DEMO_PASSWORD = 'loop'
export const SEED_VERSION = 3

export function levelFor(given: number) {
  let current = LEVELS[0]
  for (const l of LEVELS) if (given >= l.minGiven) current = l
  return current
}
export function initials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
}
export function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
export function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)} km`
}

const ago = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString()
const u = (p: Partial<User> & Pick<User, 'id' | 'name' | 'handle' | 'email' | 'avatarHue'>): User => ({
  city: 'Dubai', area: 'Marina', bio: '', skills: [], needHelpWith: [], trust: 90, favorsGiven: 10,
  favorsReceived: 6, balance: 5, streak: 2, level: 3, verified: false, plus: false,
  traits: { helpful: 88, reliable: 88, friendly: 88, problemSolver: 85 }, badges: ['Trusted Member'], joinedAt: '2025-11-02',
  ...p,
})

const users: User[] = [
  u({ id: 'u-yasar', name: 'Yasar', handle: 'yasar', email: 'yasar@favorloop.app', avatarHue: 168, area: 'Marina', bio: 'Designer who likes fixing small problems for neighbors.', skills: ['Design','Tech setup','IKEA assembly','Excel'], trust: 96, favorsGiven: 18, favorsReceived: 11, balance: 7, streak: 5, level: 4, verified: true, traits: { helpful: 94, reliable: 91, friendly: 89, problemSolver: 87 }, badges: ['Community Helper','7-Day Helping Streak','Trusted Member'] }),
  u({ id: 'u-maya', name: 'Maya', handle: 'maya', email: 'maya@favorloop.app', avatarHue: 28, area: 'JBR', trust: 92, favorsGiven: 14, verified: true, plus: true }),
  u({ id: 'u-omar', name: 'Omar', handle: 'omar', email: 'omar@favorloop.app', avatarHue: 210, area: 'Downtown', trust: 96, favorsGiven: 22, verified: true }),
  u({ id: 'u-sarah', name: 'Sarah', handle: 'sarah', email: 'sarah@favorloop.app', avatarHue: 330, area: 'Business Bay', trust: 98, favorsGiven: 42, level: 6, verified: true, plus: true }),
  u({ id: 'u-ahmed', name: 'Ahmed', handle: 'ahmed', email: 'ahmed@favorloop.app', avatarHue: 48, area: 'Al Quoz', trust: 94, favorsGiven: 38, level: 5 }),
  u({ id: 'u-leila', name: 'Leila', handle: 'leila', email: 'leila@favorloop.app', avatarHue: 280, area: 'Palm Jumeirah', trust: 89, favorsGiven: 9 }),
  u({ id: 'u-noah', name: 'Noah', handle: 'noah', email: 'noah@favorloop.app', avatarHue: 195, area: 'Al Barsha', trust: 91, favorsGiven: 16, verified: true }),
  u({ id: 'u-priya', name: 'Priya', handle: 'priya', email: 'priya@favorloop.app', avatarHue: 12, area: 'Mirdif', trust: 88, favorsGiven: 11 }),
]

const favors: FavorRequest[] = [
  { id: 'f-wifi', authorId: 'u-maya', title: 'Can someone help me set up my Wi-Fi router?', description: 'New router from the ISP, lights are blinking and nothing connects.', category: 'Tech', distanceKm: 1.2, reward: 1, timeEstimate: '15–30 min', status: 'OPEN', createdAt: ago(2) },
  { id: 'f-boxes', authorId: 'u-omar', title: 'Need help carrying two boxes downstairs', description: 'Two medium boxes from the 3rd floor to the lobby. Elevator is out.', category: 'Home', distanceKm: 0.8, reward: 2, timeEstimate: '5–15 min', status: 'OPEN', createdAt: ago(1) },
  { id: 'f-table', authorId: 'u-leila', title: 'Help me move a small table', description: 'A side table from my apartment to a friend’s car downstairs.', category: 'Home', distanceKm: 2.4, reward: 1, timeEstimate: '5–15 min', status: 'OPEN', createdAt: ago(5) },
  { id: 'f-english', authorId: 'u-ahmed', title: 'Need someone to practice English with', description: '30-minute conversation over coffee nearby.', category: 'Learning', distanceKm: 1.8, reward: 2, timeEstimate: '15–30 min', status: 'OPEN', createdAt: ago(6) },
  { id: 'f-laptops', authorId: 'u-priya', title: 'Help me choose between two laptops', description: 'Two models shortlisted for design work.', category: 'Tech', distanceKm: 3.1, reward: 1, timeEstimate: '15–30 min', status: 'OPEN', createdAt: ago(8) },
  { id: 'f-shelf', authorId: 'u-sarah', title: 'Need help assembling a shelf', description: 'IKEA-style shelf. All parts are here.', category: 'Home', distanceKm: 2.0, reward: 2, timeEstimate: '30–60 min', status: 'OPEN', createdAt: ago(3) },
  { id: 'f-parcel', authorId: 'u-noah', title: 'Can someone pick up a small parcel?', description: 'Locker at the Marina mall. Book-sized package.', category: 'Errands', distanceKm: 0.6, reward: 1, timeEstimate: '15–30 min', status: 'OPEN', createdAt: ago(4) },
  { id: 'f-excel', authorId: 'u-maya', title: 'Help me understand this Excel formula', description: 'A nested INDEX/MATCH that keeps returning #N/A.', category: 'Learning', distanceKm: 1.2, reward: 1, timeEstimate: '15–30 min', status: 'OPEN', createdAt: ago(10) },
  { id: 'f-ps', authorId: 'u-leila', title: 'Need someone to teach me basic Photoshop', description: 'Crop, layers, and export for Instagram.', category: 'Creative', distanceKm: 2.6, reward: 3, timeEstimate: '30–60 min', status: 'OPEN', createdAt: ago(12) },
  { id: 'f-done', authorId: 'u-yasar', title: 'Received computer help', description: 'Noah walked me through a slow Mac cleanup.', category: 'Tech', distanceKm: 1.5, reward: 1, timeEstimate: '15–30 min', status: 'COMPLETED', helperId: 'u-noah', createdAt: ago(72) },
  { id: 'f-move-past', authorId: 'u-yasar', title: 'Moving assistance', description: 'Omar helped shift a desk.', category: 'Home', distanceKm: 0.9, reward: 2, timeEstimate: '15–30 min', status: 'COMPLETED', helperId: 'u-omar', createdAt: ago(120) },
]

const transactions: Transaction[] = [
  { id: 't1', userId: 'u-yasar', amount: 2, label: 'Helped Omar', createdAt: ago(20) },
  { id: 't2', userId: 'u-yasar', amount: 1, label: 'Helped Maya', createdAt: ago(40) },
  { id: 't3', userId: 'u-yasar', amount: -1, label: 'Received computer help', favorId: 'f-done', createdAt: ago(72) },
  { id: 't4', userId: 'u-yasar', amount: -2, label: 'Moving assistance', favorId: 'f-move-past', createdAt: ago(120) },
  { id: 't5', userId: 'u-yasar', amount: 3, label: 'Starter credits', createdAt: ago(2000) },
]

const challenges: Challenge[] = [
  { id: 'c-weekend', title: 'Weekend Kindness Challenge', description: 'Complete 3 favors this weekend.', goal: 3, progress: 1, reward: 3, active: true },
  { id: 'c-five', title: 'Help 5 people this week', description: 'Offer and complete five favors before Sunday.', goal: 5, progress: 2, reward: 2, active: true },
  { id: 'c-first', title: 'Complete your first favor', description: 'Finish one favor from start to rating.', goal: 1, progress: 1, reward: 1, active: false },
  { id: 'c-newcat', title: 'Cross-category helper', description: 'Help someone outside your usual category.', goal: 1, progress: 0, reward: 2, active: true },
]

export function createSeedState(): AppState {
  return {
    users, currentUserId: null, favors, offers: [], transactions, messages: [],
    reviews: [
      { id: 'r1', favorId: 'f-done', fromId: 'u-yasar', toId: 'u-noah', stars: 5, tags: ['Skilled', 'On time'], text: 'Calm and clear.', createdAt: ago(70) },
      { id: 'r2', favorId: 'f-move-past', fromId: 'u-omar', toId: 'u-yasar', stars: 5, tags: ['Reliable', 'Friendly'], text: 'Showed up fast.', createdAt: ago(118) },
    ],
    activity: [
      { id: 'a1', userId: 'u-yasar', kind: 'transaction', title: 'You earned 2 Favors', body: 'Omar marked your favor as completed.', createdAt: ago(20), read: false, href: '/wallet' },
      { id: 'a2', userId: 'u-yasar', kind: 'nearby', title: '24 people need help near you', body: 'Maya just posted a Tech request 1.2 km away.', createdAt: ago(2), read: false, href: '/app/discover' },
      { id: 'a3', userId: 'u-yasar', kind: 'streak', title: '5-day helping streak', body: 'Help someone today to keep it going.', createdAt: ago(8), read: true, href: '/app/challenges' },
    ],
    challenges, blocked: [], onboardingComplete: false, seedVersion: SEED_VERSION,
  }
}
