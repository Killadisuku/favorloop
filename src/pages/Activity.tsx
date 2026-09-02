import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { relativeTime } from '../data'
import { useStore } from '../store'

export function Activity() {
  const { me, state, markActivityRead } = useStore()
  useEffect(() => { markActivityRead() }, [])
  if (!me) return null
  const items = state.activity.filter((a) => a.userId === me.id)
  return (
    <div>
      <p className="kicker">Updates</p>
      <h1 className="h1">Activity</h1>
      <div className="card" style={{ marginTop: 16 }}>
        {items.length === 0 && <p className="empty">The loop is quiet. Help someone nearby.</p>}
        {items.map((a) => {
          const inner = (
            <article>
              <i className={`dot ${a.read ? 'read' : ''}`} />
              <div>
                <b>{a.title}</b>
                <p className="tiny">{a.body} · {relativeTime(a.createdAt)}</p>
              </div>
            </article>
          )
          return a.href ? (
            <Link key={a.id} to={a.href} style={{ display: 'block', padding: '10px 0' }}>{inner}</Link>
          ) : (
            <div key={a.id} style={{ padding: '10px 0' }}>{inner}</div>
          )
        })}
      </div>
    </div>
  )
}
