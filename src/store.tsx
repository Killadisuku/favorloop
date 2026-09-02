import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createSeedState, DEMO_PASSWORD, levelFor, SEED_VERSION } from './data'
import type { AppState, Category, Challenge, FavorRequest, Message, Review, TimeEstimate, User } from './types'

const KEY = 'favorloop.v3'
function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return createSeedState()
    const parsed = JSON.parse(raw) as AppState
    if (parsed.seedVersion !== SEED_VERSION) return createSeedState()
    return parsed
  } catch { return createSeedState() }
}
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`
const now = () => new Date().toISOString()

type Store = {
  state: AppState; me: User | null
  userById: (id: string) => User | undefined
  favorById: (id: string) => FavorRequest | undefined
  openFavors: FavorRequest[]; myFavors: FavorRequest[]; helpingFavors: FavorRequest[]
  login: (email: string, password: string) => string | null
  demoLogin: () => void
  signup: (input: { name: string; email: string; password: string; city: string }) => string | null
  logout: () => void
  completeOnboarding: (input: { photoHue?: number; area: string; skills: string[]; needHelpWith: string[] }) => void
  postFavor: (input: { title: string; description: string; category: Category; timeEstimate: TimeEstimate; reward: number }) => { ok: true; id: string } | { ok: false; error: string }
  offerHelp: (favorId: string) => { ok: true } | { ok: false; error: string }
  acceptOffer: (favorId: string, helperId: string) => { ok: true } | { ok: false; error: string }
  cancelFavor: (favorId: string) => void
  sendMessage: (favorId: string, text: string) => void
  messagesFor: (favorId: string) => Message[]
  completeFavor: (favorId: string) => { ok: true } | { ok: false; error: string }
  submitReview: (input: { favorId: string; toId: string; stars: number; tags: string[]; text: string }) => { ok: true } | { ok: false; error: string }
  reviewsFor: (userId: string) => Review[]
  markActivityRead: () => void
  blockUser: (userId: string) => void
  reportUser: (userId: string, reason: string) => void
  togglePlus: () => void
  verifyProfile: () => void
  boostFavor: (favorId: string) => void
  resetDemo: () => void
  updateProfile: (patch: Partial<Pick<User, 'bio' | 'name' | 'area'>>) => void
  nearbyCount: number
  leaderboard: User[]
  challenges: Challenge[]
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => typeof window === 'undefined' ? createSeedState() : load())
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(state)) }, [state])
  const me = useMemo(() => state.users.find((u) => u.id === state.currentUserId) ?? null, [state.users, state.currentUserId])
  const userById = useCallback((id: string) => state.users.find((u) => u.id === id), [state.users])
  const favorById = useCallback((id: string) => state.favors.find((f) => f.id === id), [state.favors])
  const openFavors = useMemo(() => state.favors.filter((f) => f.status === 'OPEN' && f.authorId !== state.currentUserId && !state.blocked.includes(f.authorId)).sort((a, b) => a.distanceKm - b.distanceKm), [state.favors, state.currentUserId, state.blocked])
  const myFavors = useMemo(() => state.favors.filter((f) => f.authorId === state.currentUserId), [state.favors, state.currentUserId])
  const helpingFavors = useMemo(() => state.favors.filter((f) => f.helperId === state.currentUserId), [state.favors, state.currentUserId])
  const patchUser = (users: User[], id: string, fn: (u: User) => User) => users.map((u) => (u.id === id ? fn(u) : u))

  const login = (email: string, password: string) => {
    if (password !== DEMO_PASSWORD) return 'Use the demo password: loop'
    const user = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!user) return 'No account with that email. Try yasar@favorloop.app'
    setState((s) => ({ ...s, currentUserId: user.id, onboardingComplete: true }))
    return null
  }
  const demoLogin = () => setState((s) => ({ ...s, currentUserId: 'u-yasar', onboardingComplete: true }))
  const signup = (input: { name: string; email: string; password: string; city: string }) => {
    if (!input.name.trim() || !input.email.trim()) return 'Name and email are required.'
    if (input.password.length < 4) return 'Password should be at least 4 characters.'
    if (state.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) return 'That email is already on FavorLoop.'
    const id = uid('u')
    const user: User = { id, name: input.name.trim(), handle: input.name.trim().toLowerCase().replace(/\s+/g, ''), email: input.email.trim(), city: input.city || 'Dubai', area: '', avatarHue: Math.floor(Math.random() * 360), bio: '', skills: [], needHelpWith: [], trust: 70, favorsGiven: 0, favorsReceived: 0, balance: 3, streak: 0, level: 1, verified: false, plus: false, traits: { helpful: 70, reliable: 70, friendly: 70, problemSolver: 70 }, badges: ['New Neighbor'], joinedAt: now().slice(0, 10) }
    setState((s) => ({ ...s, users: [...s.users, user], currentUserId: id, onboardingComplete: false, transactions: [{ id: uid('t'), userId: id, amount: 3, label: 'Promotional starter credits', createdAt: now() }, ...s.transactions] }))
    return null
  }
  const logout = () => setState((s) => ({ ...s, currentUserId: null }))
  const completeOnboarding = (input: { photoHue?: number; area: string; skills: string[]; needHelpWith: string[] }) => {
    if (!state.currentUserId) return
    setState((s) => ({ ...s, onboardingComplete: true, users: patchUser(s.users, s.currentUserId!, (u) => ({ ...u, area: input.area || u.area, skills: input.skills, needHelpWith: input.needHelpWith, avatarHue: input.photoHue ?? u.avatarHue })) }))
  }
  const postFavor = (input: { title: string; description: string; category: Category; timeEstimate: TimeEstimate; reward: number }) => {
    if (!me) return { ok: false as const, error: 'Sign in first.' }
    const reward = Math.min(10, Math.max(1, Math.round(input.reward)))
    if (!input.title.trim()) return { ok: false as const, error: 'Add a short title.' }
    if (me.balance < reward) return { ok: false as const, error: `You need ${reward} credits. Help someone to earn more.` }
    const id = uid('f')
    setState((s) => ({ ...s, favors: [{ id, authorId: me.id, title: input.title.trim(), description: input.description.trim(), category: input.category, distanceKm: 0, reward, timeEstimate: input.timeEstimate, status: 'OPEN', createdAt: now() }, ...s.favors] }))
    return { ok: true as const, id }
  }
  const offerHelp = (favorId: string) => {
    if (!me) return { ok: false as const, error: 'Sign in first.' }
    const favor = state.favors.find((f) => f.id === favorId)
    if (!favor) return { ok: false as const, error: 'Request not found.' }
    if (favor.authorId === me.id) return { ok: false as const, error: 'You cannot help your own request.' }
    if (favor.status !== 'OPEN') return { ok: false as const, error: 'This request is no longer open.' }
    setState((s) => ({ ...s, favors: s.favors.map((f) => f.id === favorId ? { ...f, status: 'ACCEPTED', helperId: me.id } : f), messages: [...s.messages, { id: uid('m'), favorId, fromId: me.id, text: `Hi ${s.users.find((u) => u.id === favor.authorId)?.name ?? ''}, I can help with this.`, createdAt: now() }] }))
    return { ok: true as const }
  }
  const acceptOffer = (favorId: string, helperId: string) => {
    if (!me) return { ok: false as const, error: 'Sign in first.' }
    setState((s) => ({ ...s, favors: s.favors.map((f) => f.id === favorId ? { ...f, status: 'ACCEPTED', helperId } : f) }))
    return { ok: true as const }
  }
  const cancelFavor = (favorId: string) => setState((s) => ({ ...s, favors: s.favors.map((f) => f.id === favorId && (f.authorId === s.currentUserId || f.helperId === s.currentUserId) ? { ...f, status: 'CANCELLED', helperId: undefined } : f) }))
  const sendMessage = (favorId: string, text: string) => {
    if (!me || !text.trim()) return
    const favor = state.favors.find((f) => f.id === favorId)
    if (!favor || (favor.authorId !== me.id && favor.helperId !== me.id)) return
    setState((s) => ({ ...s, messages: [...s.messages, { id: uid('m'), favorId, fromId: me.id, text: text.trim(), createdAt: now() }] }))
  }
  const messagesFor = (favorId: string) => state.messages.filter((m) => m.favorId === favorId)
  const completeFavor = (favorId: string) => {
    if (!me) return { ok: false as const, error: 'Sign in first.' }
    const favor = state.favors.find((f) => f.id === favorId)
    if (!favor) return { ok: false as const, error: 'Request not found.' }
    if (favor.status === 'COMPLETED') return { ok: false as const, error: 'Already completed.' }
    if (favor.authorId !== me.id && favor.helperId !== me.id) return { ok: false as const, error: 'Only the two people in this favor can complete it.' }
    if (!favor.helperId) return { ok: false as const, error: 'No helper assigned yet.' }
    const author = state.users.find((u) => u.id === favor.authorId)
    const helper = state.users.find((u) => u.id === favor.helperId)
    if (!author || !helper) return { ok: false as const, error: 'Users missing.' }
    if (author.balance < favor.reward) return { ok: false as const, error: 'Requester does not have enough credits.' }
    setState((s) => ({
      ...s,
      users: s.users.map((u) => {
        if (u.id === author.id) return { ...u, balance: u.balance - favor.reward, favorsReceived: u.favorsReceived + 1 }
        if (u.id === helper.id) {
          const given = u.favorsGiven + 1
          const badges = new Set(u.badges)
          if (given >= 5) badges.add('Community Helper')
          return { ...u, balance: u.balance + favor.reward, favorsGiven: given, streak: u.streak + 1, level: levelFor(given).level, badges: [...badges] }
        }
        return u
      }),
      favors: s.favors.map((f) => f.id === favorId ? { ...f, status: 'COMPLETED' } : f),
      transactions: [
        { id: uid('t'), userId: helper.id, amount: favor.reward, label: `Helped ${author.name}`, favorId, createdAt: now() },
        { id: uid('t'), userId: author.id, amount: -favor.reward, label: favor.title, favorId, createdAt: now() },
        ...s.transactions,
      ],
    }))
    return { ok: true as const }
  }
  const submitReview = (input: { favorId: string; toId: string; stars: number; tags: string[]; text: string }) => {
    if (!me) return { ok: false as const, error: 'Sign in first.' }
    if (input.toId === me.id) return { ok: false as const, error: 'You cannot rate yourself.' }
    const favor = state.favors.find((f) => f.id === input.favorId)
    if (!favor || favor.status !== 'COMPLETED') return { ok: false as const, error: 'Rate only after a completed favor.' }
    if (state.reviews.some((r) => r.favorId === input.favorId && r.fromId === me.id)) return { ok: false as const, error: 'You already rated this favor.' }
    const stars = Math.min(5, Math.max(1, input.stars))
    setState((s) => ({
      ...s,
      users: s.users.map((u) => {
        if (u.id !== input.toId) return u
        const trust = Math.max(50, Math.min(99, Math.round((u.trust + (stars - 3) * 0.6 + input.tags.length * 0.15) * 10) / 10))
        return { ...u, trust }
      }),
      reviews: [{ id: uid('r'), favorId: input.favorId, fromId: me.id, toId: input.toId, stars, tags: input.tags, text: input.text.trim(), createdAt: now() }, ...s.reviews],
    }))
    return { ok: true as const }
  }
  const reviewsFor = (userId: string) => state.reviews.filter((r) => r.toId === userId)
  const markActivityRead = () => { if (!me) return; setState((s) => ({ ...s, activity: s.activity.map((a) => a.userId === me.id ? { ...a, read: true } : a) })) }
  const blockUser = (userId: string) => setState((s) => ({ ...s, blocked: Array.from(new Set([...s.blocked, userId])) }))
  const reportUser = (userId: string, reason: string) => { setState((s) => ({ ...s, blocked: Array.from(new Set([...s.blocked, userId])), activity: [{ id: uid('a'), userId: s.currentUserId!, kind: 'nearby', title: 'Report received', body: reason || 'Thanks. Our team will review this.', createdAt: now(), read: false }, ...s.activity] })) }
  const togglePlus = () => { if (!me) return; setState((s) => ({ ...s, users: patchUser(s.users, me.id, (u) => ({ ...u, plus: !u.plus })) })) }
  const verifyProfile = () => { if (!me) return; setState((s) => ({ ...s, users: patchUser(s.users, me.id, (u) => ({ ...u, verified: true })) })) }
  const boostFavor = (favorId: string) => setState((s) => ({ ...s, favors: s.favors.map((f) => f.id === favorId ? { ...f, boostedUntil: new Date(Date.now() + 86400000).toISOString() } : f) }))
  const resetDemo = () => { const fresh = createSeedState(); localStorage.setItem(KEY, JSON.stringify(fresh)); setState(fresh) }
  const updateProfile = (patch: Partial<Pick<User, 'bio' | 'name' | 'area'>>) => { if (!me) return; setState((s) => ({ ...s, users: patchUser(s.users, me.id, (u) => ({ ...u, ...patch })) })) }
  const leaderboard = useMemo(() => [...state.users].sort((a, b) => b.favorsGiven - a.favorsGiven), [state.users])
  const value: Store = { state, me, userById, favorById, openFavors, myFavors, helpingFavors, login, demoLogin, signup, logout, completeOnboarding, postFavor, offerHelp, acceptOffer, cancelFavor, sendMessage, messagesFor, completeFavor, submitReview, reviewsFor, markActivityRead, blockUser, reportUser, togglePlus, verifyProfile, boostFavor, resetDemo, updateProfile, nearbyCount: 24, leaderboard, challenges: state.challenges }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
