import { Link } from 'react-router-dom'
import { greeting } from '../data'
import { IconFlame, IconLoop } from '../icons'
import { useStore } from '../store'
import { FavorCard } from '../ui'

export function Home() {
  const { me, openFavors, nearbyCount, userById } = useStore()
  if (!me) return null
  const pulse = openFavors.slice(0, 4)
  return (
    <div>
      <div className="page-h">
        <div>
          <p className="kicker">FavorLoop · {me.area || me.city}</p>
          <h1 className="h1">{greeting()}, {me.name} 👋</h1>
        </div>
      </div>
      <section className="card balance">
        <div className="label">Favor Balance</div>
        <div className="num">{me.balance}</div>
        <div className="hint">Help someone to earn more.</div>
        <div className="tiny" style={{ marginTop: 8, opacity: 0.7 }}>Credits stay inside the community. They are not cash.</div>
      </section>
      <div className="row" style={{ marginTop: 12 }}>
        <Link className="btn btn-primary" to="/app/post">Ask for Help</Link>
        <Link className="btn btn-ghost" to="/app/discover">Help Someone</Link>
      </div>
      <div className="card" style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
        <IconFlame />
        <div>
          <b>{me.streak}-day helping streak</b>
          <div className="tiny">Help today to keep the loop warm.</div>
        </div>
        <Link className="chip" to="/app/challenges" style={{ marginLeft: 'auto' }}>Challenges</Link>
      </div>
      <div className="pulse">
        <div>
          <h2 className="h2">Community Pulse</h2>
          <p className="tiny">{nearbyCount} people need help near you</p>
        </div>
        <Link className="tiny" to="/app/discover">See all</Link>
      </div>
      {pulse.length === 0 && (
        <div className="card empty">
          <IconLoop />
          <p>Quiet for a moment. Post a request or check back soon.</p>
        </div>
      )}
      {pulse.map((f) => {
        const author = userById(f.authorId)
        if (!author) return null
        return <FavorCard key={f.id} favor={f} author={author} />
      })}
    </div>
  )
}
