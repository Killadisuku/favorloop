import { createFileRoute, Link } from "@tanstack/react-router";
import { Avatar } from "@/components/avatar";
import { IconTrophy } from "@/components/icons";
import { LEVELS } from "@/lib/constants";
import { getChallenges } from "@/lib/loop";
import { useApi } from "@/lib/use-api";
import { useState } from "react";

export const Route = createFileRoute("/app/challenges")({ component: Challenges });

function Challenges() {
  const { data, loading, error } = useApi(() => getChallenges(), []);
  const [scope, setScope] = useState<"neighborhood" | "city" | "global">("global");
  if (loading) return <div className="skeleton" style={{ height: 200 }} />;
  if (error || !data) return <div className="card empty">{error}</div>;
  const board =
    scope === "neighborhood"
      ? data.leaderboard.filter((u) => u.area)
      : scope === "city"
        ? data.leaderboard.filter((u) => u.city)
        : data.leaderboard;
  return (
    <div>
      <p className="kicker">Stay in the loop</p>
      <h1 className="h1">Challenges</h1>
      <div className="card" style={{ marginTop: 8 }}>
        {data.streak}-day helping streak
      </div>
      {data.challenges.map((c) => (
        <div className="card" key={c.id}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b>{c.title}</b>
            <span className="chip gold">+{c.reward}</span>
          </div>
          <p className="tiny">{c.description}</p>
          <div className="bar">
            <i style={{ width: `${Math.min(100, (c.progress / c.goal) * 100)}%` }} />
          </div>
          <div className="tiny" style={{ marginTop: 6 }}>
            {c.progress}/{c.goal}
            {c.completed ? " · done" : ""}
            {c.rewarded ? " · rewarded" : ""}
          </div>
        </div>
      ))}
      <h2 className="h2" style={{ margin: "22px 0 8px" }}>
        <IconTrophy size={18} /> Top helpers
      </h2>
      <div className="filters">
        {(["neighborhood", "city", "global"] as const).map((s) => (
          <button key={s} className={`chip ${scope === s ? "on" : ""}`} onClick={() => setScope(s)}>
            {s}
          </button>
        ))}
      </div>
      <ul className="card reset leader">
        {board.slice(0, 8).map((u, i) => (
          <li key={u.userId}>
            <span className="rank">{i + 1}</span>
            <Avatar user={{ name: u.name, photoUrl: u.photoUrl, avatarHue: u.avatarHue }} size="sm" />
            <Link to="/app/profile/$id" params={{ id: u.userId }} style={{ flex: 1 }}>
              <b>{u.name}</b>
              <div className="tiny">{u.area || u.city}</div>
            </Link>
            <b>{u.favorsGiven}</b>
          </li>
        ))}
      </ul>
      <h2 className="h2" style={{ margin: "22px 0 8px" }}>
        Levels
      </h2>
      <div className="card">
        {LEVELS.map((l) => (
          <div className="tx" key={l.level}>
            <span>
              Level {l.level} — {l.name}
            </span>
            {data.level === l.level && <span className="chip on">You</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
