import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { FavorCard } from "@/components/favor-card";
import { listPeople } from "@/lib/server/profile";
import { listDiscover } from "@/lib/server/posts";
import { useApi } from "@/lib/use-api";

export const Route = createFileRoute("/app/search")({ component: SearchPage });

function SearchPage() {
  const [q, setQ] = useState("");
  const people = useApi(() => listPeople({ data: { q, city: "" } }), [q]);
  const posts = useApi(() => listDiscover({ data: { q, category: "All", type: "all", sort: "newest", nearby: false } }), [q]);
  return (
    <div>
      <p className="kicker">Find</p>
      <h1 className="h1">Search</h1>
      <input className="input" placeholder="People, skills, requests…" value={q} onChange={(e) => setQ(e.target.value)} />
      <h2 className="h2" style={{ margin: "18px 0 8px" }}>
        People
      </h2>
      {people.loading && <div className="skeleton" style={{ height: 80 }} />}
      {(people.data ?? []).length === 0 && !people.loading && <div className="card empty">No neighbors match.</div>}
      {(people.data ?? []).map((p) => (
        <Link key={p.userId} className="card" style={{ display: "flex", gap: 12, alignItems: "center" }} to="/app/profile/$id" params={{ id: p.userId }}>
          <Avatar user={p} />
          <div>
            <b>{p.name}</b>
            <div className="tiny">
              @{p.username} · {p.skills.slice(0, 3).join(" · ")}
            </div>
          </div>
        </Link>
      ))}
      <h2 className="h2" style={{ margin: "18px 0 8px" }}>
        Requests
      </h2>
      {posts.loading && <div className="skeleton" style={{ height: 80 }} />}
      {(posts.data ?? []).length === 0 && !posts.loading && <div className="card empty">No posts match.</div>}
      {(posts.data ?? []).map((f) => (
        <FavorCard key={f.id} favor={f} />
      ))}
    </div>
  );
}
