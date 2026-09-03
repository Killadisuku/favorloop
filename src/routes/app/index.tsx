import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FavorCard } from "@/components/favor-card";
import { Avatar } from "@/components/avatar";
import { IconLoop } from "@/components/icons";
import { greeting, relativeTime } from "@/lib/format";
import { APP_NAME } from "@/lib/constants";
import { getHome } from "@/lib/loop";
import { useApi } from "@/lib/use-api";

export const Route = createFileRoute("/app/")({ component: Home });

function Home() {
  const nav = useNavigate();
  const { data, loading, error, reload } = useApi(() => getHome(), []);
  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 36, width: "60%", marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 140, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 90 }} />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="card empty">
        <p>{error === "signin" ? "Please sign in again." : error || "Could not load home."}</p>
        <button className="btn btn-primary" onClick={() => void reload()}>
          Retry
        </button>
      </div>
    );
  }
  const { me, recommended, people, notifications, challenges, openMine, helping } = data;
  return (
    <div>
      <div className="page-h">
        <div>
          <p className="kicker">{APP_NAME} · {me.area || me.city || "Nearby"}</p>
          <h1 className="h1">
            {greeting()}, {me.name}
          </h1>
        </div>
      </div>

      <section className="card balance">
        <div className="label">Favor balance</div>
        <div className="num">{me.credits}</div>
        <div className="hint">
          {me.available} available · {me.reserved} reserved on open requests
        </div>
        <div className="tiny" style={{ marginTop: 8, opacity: 0.7 }}>
          Credits stay inside the community. They are not cash.
        </div>
      </section>

      <div className="row" style={{ marginTop: 12 }}>
        <Link className="btn btn-primary" to="/app/post">
          Ask for help
        </Link>
        <Link className="btn btn-ghost" to="/app/discover">
          Help someone
        </Link>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <b>{me.streak}-day helping streak</b>
        <div className="tiny">Help today to keep the loop warm. Reputation {me.reputation}%.</div>
        <Link className="chip" to="/app/challenges" style={{ marginTop: 8, display: "inline-flex" }}>
          Challenges
        </Link>
      </div>

      {openMine.length > 0 && (
        <>
          <div className="pulse">
            <h2 className="h2">Your open requests</h2>
          </div>
          {openMine.map((f) => (
            <FavorCard key={f.id} favor={f} />
          ))}
        </>
      )}
      {helping.length > 0 && (
        <>
          <div className="pulse">
            <h2 className="h2">You're helping</h2>
          </div>
          {helping.map((f) => (
            <FavorCard key={f.id} favor={f} />
          ))}
        </>
      )}

      <div className="pulse">
        <div>
          <h2 className="h2">Community pulse</h2>
          <p className="tiny">Open requests from neighbors</p>
        </div>
        <Link className="tiny" to="/app/discover">
          See all
        </Link>
      </div>
      {recommended.length === 0 && (
        <div className="card empty">
          <IconLoop />
          <p>Quiet for a moment. Post a request or check back when neighbors join.</p>
        </div>
      )}
      {recommended.map((f) => (
        <FavorCard key={f.id} favor={f} cta="Offer help" />
      ))}

      {people.length > 0 && (
        <>
          <div className="pulse">
            <h2 className="h2">Neighbors to know</h2>
          </div>
          <div className="card">
            {people.map((p) => (
              <Link key={p.userId} to="/app/profile/$id" params={{ id: p.userId }} className="tx">
                <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                  <Avatar user={p} size="sm" />
                  <div>
                    <b>{p.name}</b>
                    <div className="tiny">{p.skills.slice(0, 3).join(" · ") || p.city}</div>
                  </div>
                </div>
                <span className="tiny">{p.reputation}%</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="pulse">
        <h2 className="h2">Recent activity</h2>
        <Link className="tiny" to="/app/activity">
          All
        </Link>
      </div>
      <div className="card activity">
        {notifications.length === 0 && <p className="empty">The loop is quiet.</p>}
        {notifications.map((n) => (
          <article
            key={n.id}
            style={{ padding: "10px 0", cursor: n.href ? "pointer" : "default" }}
            onClick={() => {
              if (n.href) nav({ to: n.href as "/app" });
            }}
          >
            <i className={`dot ${n.read ? "read" : ""}`} />
            <div>
              <b>{n.title}</b>
              <p className="tiny">
                {n.body} · {relativeTime(n.createdAt)}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="pulse">
        <h2 className="h2">Challenges</h2>
      </div>
      {challenges.slice(0, 3).map((c) => (
        <div className="card" key={c.id}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b>{c.title}</b>
            <span className="chip gold">+{c.reward}</span>
          </div>
          <div className="bar" style={{ marginTop: 8 }}>
            <i style={{ width: `${Math.min(100, (c.progress / c.goal) * 100)}%` }} />
          </div>
          <div className="tiny" style={{ marginTop: 6 }}>
            {c.progress}/{c.goal}
            {c.completed ? " · done" : ""}
          </div>
        </div>
      ))}
    </div>
  );
}
