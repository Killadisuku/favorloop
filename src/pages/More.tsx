import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LEVELS } from '../data'
import { IconShield, IconTrophy } from '../icons'
import { useStore } from '../store'
import { Avatar, Back } from '../ui'

export function Challenges() {
  const { me, challenges, leaderboard } = useStore()
  const [scope, setScope] = useState<'neighborhood' | 'city' | 'global'>('neighborhood')
  if (!me) return null
  const board = scope === 'neighborhood' ? leaderboard.filter((u) => u.area === me.area || u.city === me.city) : scope === 'city' ? leaderboard.filter((u) => u.city === me.city) : leaderboard
  return (
    <div>
      <p className="kicker">Stay in the loop</p>
      <h1 className="h1">Challenges</h1>
      <div className="card" style={{ marginTop: 8 }}>🔥 {me.streak}-day helping streak</div>
      {challenges.map((c) => (
        <div className="card" key={c.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>{c.title}</b><span className="chip gold">+{c.reward}</span></div>
          <p className="tiny">{c.description}</p>
          <div className="bar"><i style={{ width: `${(c.progress / c.goal) * 100}%` }} /></div>
          <div className="tiny" style={{ marginTop: 6 }}>{c.progress}/{c.goal} {c.active ? '' : '· done'}</div>
        </div>
      ))}
      <h2 className="h2" style={{ margin: '22px 0 8px' }}><IconTrophy size={18} /> Top Helpers This Week</h2>
      <div className="filters">{(['neighborhood','city','global'] as const).map((s) => <button key={s} className={`chip ${scope === s ? 'on' : ''}`} onClick={() => setScope(s)}>{s === 'neighborhood' ? 'My neighborhood' : s === 'city' ? 'My city' : 'Global'}</button>)}</div>
      <ul className="card reset leader">{board.slice(0, 8).map((u, i) => <li key={u.id}><span className="rank">{i + 1}</span><Avatar user={u} size="sm" /><div style={{ flex: 1 }}><b>{u.name}</b><div className="tiny">{u.area}</div></div><b>{u.favorsGiven} Favors</b></li>)}</ul>
      <h2 className="h2" style={{ margin: '22px 0 8px' }}>Levels</h2>
      <div className="card">{LEVELS.map((l) => <div className="tx" key={l.level}><span>Level {l.level} — {l.name}</span>{me.level === l.level && <span className="chip on">You</span>}</div>)}</div>
    </div>
  )
}

export function Plus() {
  const { me, togglePlus, verifyProfile } = useStore()
  if (!me) return null
  return (
    <div>
      <Back to="/app/profile" />
      <p className="kicker">Optional extras</p>
      <h1 className="h1">FavorLoop Plus</h1>
      <div className="card">
        <ul><li>Advanced profile</li><li>Priority discovery</li><li>Reputation analytics</li><li>Exclusive challenges</li></ul>
        <button className="btn btn-gold btn-block" onClick={togglePlus}>{me.plus ? 'Plus is active — manage' : 'Start Plus (demo)'}</button>
      </div>
      <div className="card">
        <h2 className="h2">Verified Profile</h2>
        <button className="btn btn-primary btn-block" onClick={verifyProfile} disabled={me.verified}>{me.verified ? 'Verified ✓' : 'Verify identity (demo)'}</button>
      </div>
    </div>
  )
}

export function Safety() {
  return (
    <div>
      <Back to="/app/profile" />
      <h1 className="h1">Safety</h1>
      <div className="card">
        <IconShield />
        <p>FavorLoop is for small, ordinary help. Never accept dangerous, illegal, medical, or financial tasks.</p>
        <Link className="btn btn-primary btn-block" to="/app/discover">Back to helping</Link>
      </div>
    </div>
  )
}
