import { useState } from 'react'
import { Link } from 'react-router-dom'
import { levelFor } from '../data'
import { useStore } from '../store'
import { Avatar } from '../ui'

const tabs = ['About', 'Completed Favors', 'Reviews', 'Badges'] as const

export function Profile() {
  const { me, logout, reviewsFor, myFavors, helpingFavors, resetDemo } = useStore()
  const [tab, setTab] = useState<(typeof tabs)[number]>('About')
  if (!me) return null
  const lvl = levelFor(me.favorsGiven)
  const reviews = reviewsFor(me.id)
  const completed = [...myFavors, ...helpingFavors].filter((f) => f.status === 'COMPLETED')

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Avatar user={me} size="lg" />
        <div>
          <h1 className="h1">
            {me.name} {me.verified && <span title="Verified">✓</span>}
          </h1>
          <div className="trust">⭐ {me.trust}% Trust</div>
          <div className="tiny">
            {lvl.name} · Level {lvl.level}
            {me.plus ? ' · Plus' : ''}
          </div>
        </div>
      </div>
      <div className="stat-grid" style={{ marginTop: 16 }}>
        <div className="stat">
          <b>{me.favorsGiven}</b>
          <span>Given</span>
        </div>
        <div className="stat">
          <b>{me.favorsReceived}</b>
          <span>Received</span>
        </div>
        <div className="stat">
          <b>{me.balance}</b>
          <span>Balance</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 className="h2">Reputation</h2>
        {(
          [
            ['Helpful', me.traits.helpful],
            ['Reliable', me.traits.reliable],
            ['Friendly', me.traits.friendly],
            ['Problem Solver', me.traits.problemSolver],
          ] as const
        ).map(([l, v]) => (
          <div key={l} style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{l}</span>
              <b>{v}</b>
            </div>
            <div className="bar">
              <i style={{ width: `${v}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="badge-row">
        {me.badges.map((b) => (
          <span className="chip gold" key={b}>
            {b === 'Community Helper' ? '🏆 ' : b.includes('Streak') ? '🔥 ' : '🤝 '}
            {b}
          </span>
        ))}
      </div>

      <div className="filters" style={{ marginTop: 16 }}>
        {tabs.map((t) => (
          <button key={t} className={`chip ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'About' && (
        <div className="card">
          <p>{me.bio || 'Tell neighbors what you are good at.'}</p>
          <p className="tiny">
            {me.city} · {me.area} · Joined {me.joinedAt}
          </p>
          <div className="badge-row">
            {me.skills.map((s) => (
              <span className="chip" key={s}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
      {tab === 'Completed Favors' && (
        <div>
          {completed.length === 0 && <div className="card empty">No completed favors yet.</div>}
          {completed.map((f) => (
            <Link key={f.id} className="card" to={`/app/favor/${f.id}`} style={{ display: 'block' }}>
              <b>{f.title}</b>
              <div className="tiny">
                {f.category} · {f.reward} Favors
              </div>
            </Link>
          ))}
        </div>
      )}
      {tab === 'Reviews' && (
        <div>
          {reviews.length === 0 && <div className="card empty">Reviews appear after completed favors.</div>}
          {reviews.map((r) => (
            <div className="card" key={r.id}>
              <b>{r.stars}★</b> {r.tags.join(' · ')}
              <p>{r.text}</p>
            </div>
          ))}
        </div>
      )}
      {tab === 'Badges' && (
        <div className="card">
          {me.badges.map((b) => (
            <div key={b} className="tx">
              <b>{b}</b>
            </div>
          ))}
        </div>
      )}

      <div className="row" style={{ marginTop: 16 }}>
        <Link className="btn btn-ghost" to="/app/plus">
          Por Favor Plus
        </Link>
        <Link className="btn btn-soft" to="/wallet">
          Wallet
        </Link>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <Link className="btn btn-ghost" to="/app/safety">
          Safety
        </Link>
        <button className="btn btn-danger" onClick={logout}>
          Log out
        </button>
      </div>
      <button className="btn btn-soft btn-block" style={{ marginTop: 10 }} onClick={resetDemo}>
        Reset demo data
      </button>
    </div>
  )
}
