import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { levelFor } from "@/lib/constants";
import { getMe } from "@/lib/loop";
import { getProfile } from "@/lib/loop";
import { useApi } from "@/lib/use-api";

export const Route = createFileRoute("/app/profile/")({ component: Profile });

function Profile() {
  const { data: me } = useApi(() => getMe(), []);
  const { data, loading, error } = useApi(() => (me ? getProfile({ data: { userId: me.userId } }) : Promise.resolve({ ok: false as const, error: "…" })), [me?.userId]);
  const [tab, setTab] = useState<"About" | "Completed" | "Reviews">("About");
  if (loading || !me) return <div className="skeleton" style={{ height: 200 }} />;
  if (error || !data) return <div className="card empty">{error}</div>;
  const lvl = levelFor(me.favorsGiven);
  return (
    <div>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Avatar user={me} size="lg" />
        <div>
          <h1 className="h1">
            {me.name}
            {me.verified ? " ✓" : ""}
          </h1>
          <div className="trust">{me.reputation}% Trust</div>
          <div className="tiny">
            @{me.username} · {lvl.name} · Level {lvl.level}
            {me.plus ? " · Plus" : ""}
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
          <b>{me.credits}</b>
          <span>Balance</span>
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
          <p className="tiny">
            {me.city} · {me.area} · Joined {new Date(me.createdAt).toLocaleDateString()}
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
      {tab === "Completed" && (
        <div>
          {data.completed.length === 0 && <div className="card empty">No completed favors yet.</div>}
          {data.completed.map((f) => (
            <Link key={f.id} className="card" to="/app/favor/$id" params={{ id: f.id }} style={{ display: "block" }}>
              <b>{f.title}</b>
              <div className="tiny">
                {f.category} · {f.creditReward} Favors
              </div>
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
        <Link className="btn btn-ghost" to="/app/inbox">
          Inbox
        </Link>
        <Link className="btn btn-soft" to="/app/wallet">
          Wallet
        </Link>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <Link className="btn btn-ghost" to="/app/plus">
          Por Favor Plus
        </Link>
        <Link className="btn btn-ghost" to="/app/challenges">
          Challenges
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
    </div>
  );
}
