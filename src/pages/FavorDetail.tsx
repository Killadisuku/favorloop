import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { formatDistance } from '../data'
import { IconChat, IconFlag, IconShield } from '../icons'
import { useStore } from '../store'
import { Avatar, Back, Toast } from '../ui'

const TAGS = ['Reliable', 'Friendly', 'Helpful', 'On time', 'Skilled', 'Respectful']

export function FavorDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { favorById, userById, me, offerHelp, completeFavor, submitReview, reviewsFor, cancelFavor, reportUser, blockUser, boostFavor, state } = useStore()
  const favor = id ? favorById(id) : undefined
  const author = favor ? userById(favor.authorId) : undefined
  const helper = favor?.helperId ? userById(favor.helperId) : undefined
  const [confirm, setConfirm] = useState(false)
  const [rate, setRate] = useState(false)
  const [stars, setStars] = useState(5)
  const [tags, setTags] = useState<string[]>([])
  const [text, setText] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [safety, setSafety] = useState(false)
  if (!favor || !author || !me) return <div><Back to="/app/discover" /><div className="card empty">This request is gone.</div></div>
  const mine = favor.authorId === me.id
  const involved = mine || favor.helperId === me.id
  const other = mine ? helper : author
  const alreadyReviewed = state.reviews.some((r) => r.favorId === favor.id && r.fromId === me.id)
  return (
    <div>
      <Back to="/app/discover" label="Request" />
      <div className="card">
        <div className="favor-top">
          <Avatar user={author} />
          <div className="who"><b>{author.name} {author.verified && '✓'}</b><span className="trust">{author.trust}% Trust</span></div>
          <span className="chip">{favor.status.replace('_', ' ')}</span>
        </div>
        <h1 className="h2" style={{ marginTop: 14 }}>{favor.title}</h1>
        <p>{favor.description}</p>
        <div className="meta"><span>{favor.category}</span><span>{formatDistance(favor.distanceKm)} away</span><span>{favor.timeEstimate}</span><span className="chip gold">{favor.reward} Favors</span></div>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><IconShield /><div><b>Safety</b><div className="tiny">Meet in public when you can. Cancel, report, or block anytime.</div></div></div>
        <button className="btn btn-soft btn-block" style={{ marginTop: 10 }} onClick={() => setSafety(true)}>Safety guidelines</button>
      </div>
      {favor.status === 'OPEN' && !mine && <div className="row" style={{ marginTop: 12 }}><button className="btn btn-primary" onClick={() => setConfirm(true)}>Offer Help</button><button className="btn btn-ghost" disabled>Message</button></div>}
      {favor.status === 'OPEN' && mine && <div className="row" style={{ marginTop: 12 }}><button className="btn btn-ghost" onClick={() => cancelFavor(favor.id)}>Cancel request</button><button className="btn btn-gold" onClick={() => boostFavor(favor.id)}>Boost 24h</button></div>}
      {involved && favor.status !== 'OPEN' && favor.status !== 'CANCELLED' && (
        <div className="row" style={{ marginTop: 12 }}>
          <Link className="btn btn-primary" to={`/app/chat/${favor.id}`}><IconChat size={18} /> Message</Link>
          {favor.status !== 'COMPLETED' && <button className="btn btn-soft" onClick={() => { const res = completeFavor(favor.id); if (!res.ok) setMsg(res.error); else setRate(true) }}>Mark completed</button>}
        </div>
      )}
      {favor.status === 'COMPLETED' && involved && !alreadyReviewed && other && <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => setRate(true)}>Rate {other.name}</button>}
      {other && favor.status !== 'OPEN' && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="tiny">Connected with</div>
          <div className="favor-top" style={{ marginTop: 8 }}><Avatar user={other} /><div className="who"><b>{other.name}</b><span>{other.trust}% Trust</span></div></div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn btn-danger" onClick={() => { reportUser(other.id, favor.title); setMsg('Report received.') }}><IconFlag size={16} /> Report</button>
            <button className="btn btn-ghost" onClick={() => blockUser(other.id)}>Block</button>
          </div>
        </div>
      )}
      {confirm && (
        <div className="modal-back" onClick={() => setConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="h2">You're offering to help {author.name}.</h2>
            <div className="row"><button className="btn btn-ghost" onClick={() => setConfirm(false)}>Not now</button><button className="btn btn-primary" onClick={() => { const res = offerHelp(favor.id); if (!res.ok) setMsg(res.error); else { setConfirm(false); nav(`/app/chat/${favor.id}`) } }}>Confirm</button></div>
          </div>
        </div>
      )}
      {rate && other && (
        <div className="modal-back"><div className="modal">
          <h2 className="h2">Did this favor go well?</h2>
          <div className="stars">{[1,2,3,4,5].map((n) => <button key={n} className={n <= stars ? 'on' : ''} onClick={() => setStars(n)}>★</button>)}</div>
          <div className="filters">{TAGS.map((t) => <button key={t} className={`chip ${tags.includes(t) ? 'on' : ''}`} onClick={() => setTags((cur) => cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t])}>{t}</button>)}</div>
          <textarea className="textarea" placeholder="Optional note" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn btn-primary btn-block" onClick={() => { const res = submitReview({ favorId: favor.id, toId: other.id, stars, tags, text }); if (!res.ok) setMsg(res.error); else { setRate(false); setMsg('Thanks. Trust scores only move after real favors.') } }}>Submit rating</button>
        </div></div>
      )}
      {safety && <div className="modal-back" onClick={() => setSafety(false)}><div className="modal" onClick={(e) => e.stopPropagation()}><h2 className="h2">Safety guidelines</h2><p>Do not accept dangerous, illegal, medical, or financial tasks. Chat stays inside the favor.</p><button className="btn btn-primary btn-block" onClick={() => setSafety(false)}>Got it</button></div></div>}
      <Toast text={msg} />
    </div>
  )
}
