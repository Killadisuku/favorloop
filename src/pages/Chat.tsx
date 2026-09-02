import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { Avatar, Back, Toast } from '../ui'

export function Chat() {
  const { id } = useParams()
  const { favorById, userById, me, messagesFor, sendMessage, completeFavor, reportUser, blockUser } = useStore()
  const favor = id ? favorById(id) : undefined
  const [text, setText] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  if (!favor || !me) return <div><Back /><div className="card empty">Chat unlocks after a favor is accepted.</div></div>
  const involved = favor.authorId === me.id || favor.helperId === me.id
  if (!involved || favor.status === 'OPEN') return <div><Back /><div className="card empty">Messaging is only available after someone offers and is accepted.</div></div>
  const otherId = favor.authorId === me.id ? favor.helperId : favor.authorId
  const other = otherId ? userById(otherId) : undefined
  const messages = messagesFor(favor.id)
  return (
    <div className="chat-page">
      <Back to={`/app/favor/${favor.id}`} label={other?.name ?? 'Chat'} />
      <div className="card" style={{ padding: 12 }}>
        <div className="tiny">Request</div>
        <b>{favor.title}</b>
        <div className="tiny">{favor.category} · {favor.reward} Favors · {favor.status}</div>
      </div>
      <div className="bubbles">
        {messages.length === 0 && <p className="tiny">Say hello and confirm a meeting spot.</p>}
        {messages.map((m) => <div key={m.id} className={`bubble ${m.fromId === me.id ? 'mine' : ''}`}>{m.text}</div>)}
      </div>
      <form className="row" onSubmit={(e) => { e.preventDefault(); sendMessage(favor.id, text); setText('') }}>
        <input className="input" value={text} placeholder="Message…" onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-primary" type="submit" disabled={!text.trim()}>Send</button>
      </form>
      <div className="row" style={{ marginTop: 10 }}>
        {favor.status !== 'COMPLETED' && (
          <button className="btn btn-soft" onClick={() => { const res = completeFavor(favor.id); setMsg(res.ok ? 'Marked completed. Rate each other next.' : res.error) }}>Mark completed</button>
        )}
        {other && (
          <button className="btn btn-ghost" onClick={() => { reportUser(other.id, 'chat'); blockUser(other.id); setMsg('Reported and blocked.') }}>Report / Block</button>
        )}
      </div>
      {favor.status === 'COMPLETED' && <Link className="btn btn-primary btn-block" style={{ marginTop: 10 }} to={`/app/favor/${favor.id}`}>Leave a rating</Link>}
      {other && <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}><Avatar user={other} size="sm" /><span className="tiny">{other.trust}% trust · chat stays attached to this favor</span></div>}
      <Toast text={msg} />
    </div>
  )
}
