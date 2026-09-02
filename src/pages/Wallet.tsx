import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { Back } from '../ui'

export function Wallet() {
  const { me, state } = useStore()
  if (!me) return null
  const txs = state.transactions.filter((t) => t.userId === me.id)
  return (
    <div>
      <Back to="/app" label="Wallet" />
      <section className="card balance">
        <div className="label">Current Balance</div>
        <div className="num">{me.balance}</div>
        <div className="hint">Favor Credits</div>
      </section>
      <p className="tiny" style={{ margin: '12px 0 18px' }}>
        Favor Credits are not cash. They are community credits used inside FavorLoop.
      </p>
      <h2 className="h2">History</h2>
      <div className="card">
        {txs.length === 0 && <p className="empty">No movements yet.</p>}
        {txs.map((t) => (
          <div className="tx" key={t.id}>
            <div>
              <div>{t.label}</div>
              <div className="tiny">{new Date(t.createdAt).toLocaleString()}</div>
            </div>
            <div className={t.amount >= 0 ? 'up' : 'down'}>
              {t.amount >= 0 ? '+' : ''}{t.amount} Favor
            </div>
          </div>
        ))}
      </div>
      <Link className="btn btn-ghost btn-block" style={{ marginTop: 12 }} to="/app/discover">Help someone to earn more</Link>
    </div>
  )
}
