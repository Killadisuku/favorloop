import { createFileRoute, Link } from "@tanstack/react-router";
import { Back } from "@/components/back";
import { relativeTime } from "@/lib/format";
import { getWallet } from "@/lib/loop";
import { useApi } from "@/lib/use-api";

export const Route = createFileRoute("/app/wallet")({ component: Wallet });

function Wallet() {
  const { data, loading, error, reload } = useApi(() => getWallet(), []);
  if (loading) return <div className="skeleton" style={{ height: 180 }} />;
  if (error || !data) {
    return (
      <div className="card empty">
        {error}
        <button className="btn btn-ghost" onClick={() => void reload()}>
          Retry
        </button>
      </div>
    );
  }
  return (
    <div>
      <Back to="/app" label="Favor exchange" />
      <section className="card balance">
        <div className="label">Favor exchange</div>
        <div className="num">{data.credits}</div>
        <div className="hint">
          {data.available} available · {data.reserved} reserved
        </div>
      </section>
      <div className="stat-grid" style={{ marginTop: 12 }}>
        <div className="stat">
          <b>{data.earned}</b>
          <span>Received</span>
        </div>
        <div className="stat">
          <b>{data.spent}</b>
          <span>Given</span>
        </div>
        <div className="stat">
          <b>{data.reserved}</b>
          <span>Reserved</span>
        </div>
      </div>
      <p className="tiny" style={{ margin: "12px 0 18px" }}>
        Kindness needs none of this. Favor exchange is optional, and only moves after both people confirm a completed favor. It is not money.
      </p>
      {data.pending.length > 0 && (
        <>
          <h2 className="h2">Pending</h2>
          <div className="card" style={{ marginBottom: 16 }}>
            {data.pending.map((p) => (
              <Link key={p.id} className="tx" to="/app/favor/$id" params={{ id: p.id }}>
                <div>
                  <div>{p.title}</div>
                  <div className="tiny">{p.status.replace("_", " ")} · {p.amount} reserved</div>
                </div>
                <div className="down">-{p.amount}</div>
              </Link>
            ))}
          </div>
        </>
      )}
      <h2 className="h2">History</h2>
      <div className="card">
        {data.transactions.length === 0 && <p className="empty">No movements yet.</p>}
        {data.transactions.map((t) => (
          <div className="tx" key={t.id}>
            <div>
              <div>{t.label}</div>
              <div className="tiny">
                {t.counterparty} · {t.status} · {relativeTime(t.createdAt)}
                {t.relatedFavorId ? " · favor" : ""}
              </div>
            </div>
            <div className={t.signedAmount >= 0 ? "up" : "down"}>
              {t.signedAmount >= 0 ? "+" : ""}
              {t.signedAmount}
            </div>
          </div>
        ))}
      </div>
      <Link className="btn btn-ghost btn-block" style={{ marginTop: 12 }} to="/app/discover">
        Help someone to earn more
      </Link>
    </div>
  );
}
