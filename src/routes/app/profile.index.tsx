import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { APP_NAME } from "@/lib/constants";
import { getMe, getProfile } from "@/lib/loop";
import { useApi } from "@/lib/use-api";

export const Route = createFileRoute("/app/profile/")({ component: Profile });

function Profile() {
  const { data: me } = useApi(() => getMe(), []);
  const { data, loading, error } = useApi(
    () => (me ? getProfile({ data: { userId: me.userId } }) : Promise.resolve({ ok: false as const, error: "…" })),
    [me?.userId],
  );
  const [tab, setTab] = useState<"About" | "Completed" | "Reviews">("About");
  if (loading || !me) return <div className="skeleton" style={{ height: 200 }} />;
  if (error || !data) return <div className="card empty">{error}</div>;
  const ageDays = Math.max(1, Math.round((Date.now() - +new Date(me.createdAt)) / 86400000));
  return (
    <div>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Avatar user={me} size="lg" />
        <div>
          <h1 className="h1">{me.name}</h1>
          <div className="tiny">
            @{me.username} · {me.area || me.city}
          </div>
        </div>
      </div>

      <section className="card trust-card">
        <p className="kicker">Onegai Trust</p>
        <h2 className="h2">Built from completed favors</h2>
        <ul className="trust-list">
          <li>{me.verified ? "Identity verified" : "Identity not verified yet"}</li>
          <li>{me.phoneVerified ? "Phone verified" : "Phone not verified yet"}</li>
          <li>{me.favorsGiven} favors completed as a helper</li>
          <li>Helped {me.peopleHelped} people</li>
          <li>{me.reputation}% reliable from reviews</li>
          <li>{me.completionRate}% completion rate</li>
          <li>{me.responseRate}% response rate</li>
          <li>Member of {me.circleNames.length} Circles</li>
          <li>Account age · {ageDays} day{ageDays === 1 ? "" : "s"}</li>
        </ul>
        <p className="tiny">Trust cannot be self-awarded. It only moves after both people confirm a completed favor.</p>
      </section>

      <div className="impact-grid">
        <div className="stat">
          <b>{me.favorsGiven}</b>
          <span>Favors completed</span>
        </div>
        <div className="stat">
          <b>{me.peopleHelped}</b>
          <span>People helped</span>
        </div>
        <div className="stat">
          <b>{me.hoursGiven}h</b>
          <span>Time given</span>
        </div>
        <div className="stat">
          <b>{me.favorsReceived}</b>
          <span>People who helped you</span>
        </div>
      </div>

      <div className="filters" style={{ marginTop: 16 }}>
        {(["About", "Completed", "Reviews"] as const).map((t) => (
          <button key={t} className={`chip ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      {tab === "About" && (
        <div className="card">
          <p>{me.bio || "Tell neighbors what you are good at."}</p>
          <div className="badge-row">
            {me.skills.map((s) => (
              <span className="chip" key={s}>
                {s}
              </span>
            ))}
          </div>
          {me.circleNames.length > 0 && (
            <p className="tiny" style={{ marginTop: 10 }}>
              Circles · {me.circleNames.join(" · ")}
            </p>
          )}
        </div>
      )}
      {tab === "Completed" && (
        <div>
          {data.completed.length === 0 && <div className="card empty">No completed favors yet.</div>}
          {data.completed.map((f) => (
            <Link key={f.id} className="card" to="/app/favor/$id" params={{ id: f.id }} style={{ display: "block" }}>
              <b>{f.title}</b>
              <div className="tiny">{f.category}</div>
            </Link>
          ))}
        </div>
      )}
      {tab === "Reviews" && (
        <div>
          {data.reviews.length === 0 && <div className="card empty">Reviews appear after completed favors.</div>}
          {data.reviews.map((r) => (
            <div className="card" key={r.id}>
              <b>{r.stars}★</b> {r.tags.join(" · ")}
              <p>{r.body}</p>
              <div className="tiny">{r.fromName}</div>
            </div>
          ))}
        </div>
      )}
      <div className="row" style={{ marginTop: 16 }}>
        <Link className="btn btn-ghost" to="/app/help">
          I can help
        </Link>
        <Link className="btn btn-soft" to="/app/circles">
          Circles
        </Link>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <Link className="btn btn-ghost" to="/app/safety">
          Safety
        </Link>
        <Link className="btn btn-ghost" to="/app/settings">
          Settings
        </Link>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <Link className="btn btn-ghost" to="/app/inbox">
          Inbox
        </Link>
        <Link className="btn btn-ghost" to="/app/plus">
          {APP_NAME} Plus
        </Link>
      </div>
    </div>
  );
}
