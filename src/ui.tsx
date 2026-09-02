import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { initials, formatDistance, relativeTime } from './data'
import { IconBack } from './icons'
import type { FavorRequest, User } from './types'

export function Avatar({ user, size = 'md' }: { user: User; size?: 'sm' | 'md' | 'lg' }) {
  const cls = `avatar ${size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : ''}`
  if (user.photo) return <img className={cls} src={user.photo} alt={user.name} />
  return (
    <div className={cls} style={{ background: `hsl(${user.avatarHue} 42% 38%)` }} aria-hidden>
      {initials(user.name)}
    </div>
  )
}
export function Back({ to, label }: { to?: string; label?: string }) {
  const nav = useNavigate()
  return (
    <div className="topbar">
      <button className="icon-btn" onClick={() => (to ? nav(to) : nav(-1))} aria-label="Back"><IconBack /></button>
      {label && <b>{label}</b>}
    </div>
  )
}
export function FavorCard({ favor, author, cta = 'Help' }: { favor: FavorRequest; author: User; cta?: string }) {
  return (
    <article className="card favor-card">
      <div className="favor-top">
        <Avatar user={author} />
        <div className="who">
          <b>{author.name} {author.verified && <span title="Verified">✓</span>}</b>
          <span>{author.trust}% Trust · {relativeTime(favor.createdAt)} · {author.city}</span>
        </div>
        <span className="chip gold">{favor.reward} Favor{favor.reward === 1 ? '' : 's'}</span>
      </div>
      <p className="title-line">{favor.title}</p>
      <div className="meta">
        <span>{favor.category}</span>
        <span>{formatDistance(favor.distanceKm)} away</span>
        <span>{favor.timeEstimate}</span>
        {favor.boostedUntil && new Date(favor.boostedUntil) > new Date() && <span className="chip gold">Boosted</span>}
      </div>
      <Link className="btn btn-primary btn-block" to={`/app/favor/${favor.id}`}>{cta}</Link>
    </article>
  )
}
export function Toast({ text }: { text: string | null }) {
  if (!text) return null
  return <div className="toast">{text}</div>
}
