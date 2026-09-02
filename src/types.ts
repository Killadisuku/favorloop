export type Category =
  | 'Home'
  | 'Tech'
  | 'Errands'
  | 'Learning'
  | 'Transport'
  | 'Shopping'
  | 'Creative'
  | 'Other'

export type FavorStatus =
  | 'OPEN'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export type TimeEstimate = '5–15 min' | '15–30 min' | '30–60 min' | '1–2 hours' | 'Other'

export type ActivityKind =
  | 'offer'
  | 'accepted'
  | 'completed'
  | 'rating'
  | 'message'
  | 'transaction'
  | 'badge'
  | 'challenge'
  | 'streak'
  | 'nearby'

export interface User {
  id: string
  name: string
  handle: string
  email: string
  city: string
  area: string
  country?: string
  lat?: number
  lng?: number
  avatarHue: number
  photo?: string
  bio: string
  skills: string[]
  needHelpWith: string[]
  trust: number
  favorsGiven: number
  favorsReceived: number
  balance: number
  streak: number
  level: number
  verified: boolean
  plus: boolean
  traits: {
    helpful: number
    reliable: number
    friendly: number
    problemSolver: number
  }
  badges: string[]
  joinedAt: string
}

export interface FavorRequest {
  id: string
  authorId: string
  title: string
  description: string
  category: Category
  distanceKm: number
  reward: number
  timeEstimate: TimeEstimate
  status: FavorStatus
  helperId?: string
  photo?: string
  createdAt: string
  boostedUntil?: string
  flagged?: boolean
}

export interface Offer {
  id: string
  favorId: string
  helperId: string
  createdAt: string
  status: 'pending' | 'accepted' | 'declined'
}

export interface Transaction {
  id: string
  userId: string
  amount: number
  label: string
  favorId?: string
  createdAt: string
}

export interface Message {
  id: string
  favorId: string
  fromId: string
  text: string
  createdAt: string
}

export interface Review {
  id: string
  favorId: string
  fromId: string
  toId: string
  stars: number
  tags: string[]
  text: string
  createdAt: string
}

export interface ActivityItem {
  id: string
  userId: string
  kind: ActivityKind
  title: string
  body: string
  createdAt: string
  read: boolean
  href?: string
}

export interface Challenge {
  id: string
  title: string
  description: string
  goal: number
  progress: number
  reward: number
  active: boolean
}

export interface Conversation {
  favorId: string
  participants: [string, string]
}

export interface AppState {
  users: User[]
  currentUserId: string | null
  favors: FavorRequest[]
  offers: Offer[]
  transactions: Transaction[]
  messages: Message[]
  reviews: Review[]
  activity: ActivityItem[]
  challenges: Challenge[]
  blocked: string[]
  onboardingComplete: boolean
  seedVersion: number
}
