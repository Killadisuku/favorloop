import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FavorCard } from "@/components/favor-card";
import { CATEGORIES } from "@/lib/constants";
import { listDiscover } from "@/lib/loop";
import { useApi } from "@/lib/use-api";

export const Route = createFileRoute("/app/discover")({ component: Discover });

const sorts = [
  { id: "newest", label: "Newest" },
  { id: "closest", label: "Closest" },
  { id: "reward", label: "Highest reward" },
  { id: "quickest", label: "Quickest" },
] as const;

function Discover() {
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("newest");
  const [type, setType] = useState<"all" | "request" | "offer">("all");
  const [q, setQ] = useState("");
  const nearby = cat === "Nearby";
  const { data, loading, error, reload } = useApi(
    () =>
      listDiscover({
        data: { q, category: cat, type, sort, nearby },
      }),
    [q, cat, type, sort, nearby],
  );

  const list = data ?? [];

  return (
    <div>
      <div className="page-h">
        <div>
          <p className="kicker">Nearby loop</p>
          <h1 className="h1">Discover</h1>
        </div>
        <Link className="chip" to="/app/search">
          Search
        </Link>
      </div>
      <div className="search-wrap">
        <span className="search-icon">⌕</span>
        <input className="input" placeholder="Search requests, skills, people…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="filters">
        {(["all", "request", "offer"] as const).map((t) => (
          <button key={t} className={`chip ${type === t ? "on" : ""}`} onClick={() => setType(t)}>
            {t === "all" ? "All types" : t === "request" ? "Requests" : "Offers"}
          </button>
        ))}
      </div>
      <div className="filters">
        {["All", "Nearby", ...CATEGORIES].map((c) => (
          <button key={c} className={`chip ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="filters">
        {sorts.map((s) => (
          <button key={s.id} className={`chip ${sort === s.id ? "on" : ""}`} onClick={() => setSort(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
      {loading && <div className="skeleton" style={{ height: 120 }} />}
      {error && (
        <div className="card empty">
          {error}
          <button className="btn btn-ghost" onClick={() => void reload()}>
            Retry
          </button>
        </div>
      )}
      {!loading && list.length === 0 && <div className="card empty">No open posts in this filter. Try All, or be the first to post.</div>}
      {list.map((f) => (
        <FavorCard key={f.id} favor={f} cta="Offer help" />
      ))}
    </div>
  );
}
