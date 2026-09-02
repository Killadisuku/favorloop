import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './Layout'
import { Activity } from './pages/Activity'
import { Login, Onboarding, Signup } from './pages/Auth'
import { Chat } from './pages/Chat'
import { Discover } from './pages/Discover'
import { FavorDetail } from './pages/FavorDetail'
import { Home } from './pages/Home'
import { Landing } from './pages/Landing'
import { Challenges, Plus, Safety } from './pages/More'
import { Post } from './pages/Post'
import { Profile } from './pages/Profile'
import { Wallet } from './pages/Wallet'
import { useStore } from './store'

function RequireAuth({ children }: { children: ReactNode }) {
  const { me } = useStore()
  if (!me) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/wallet" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Wallet />} />
      </Route>
      <Route path="/app" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Home />} />
        <Route path="discover" element={<Discover />} />
        <Route path="post" element={<Post />} />
        <Route path="activity" element={<Activity />} />
        <Route path="profile" element={<Profile />} />
        <Route path="favor/:id" element={<FavorDetail />} />
        <Route path="chat/:id" element={<Chat />} />
        <Route path="challenges" element={<Challenges />} />
        <Route path="plus" element={<Plus />} />
        <Route path="safety" element={<Safety />} />
        <Route path="wallet" element={<Wallet />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
