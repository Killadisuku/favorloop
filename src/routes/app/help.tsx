import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FavorCard } from "@/components/favor-card";
import { SKILL_OPTS } from "@/lib/constants";
import { getMe, listDiscover, saveHelpSkills } from "@/lib/loop";
import { useApi } from "@/lib/use-api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/help")({ component: Help });

function Help() {
  const { data: me, reload: reloadMe } = useApi(() => getMe(), []);
  const [skills, setSkills] = useState<string[] | null>(null);
  const chosen = skills ?? me?.skills ?? [];
  const { data, loading } = useApi(() => listDiscover({ data: { type: "request", sort: "match", skillsOnly: true } }), [chosen.join(",")]);

  const toggle = (s: string) => {
    const next = chosen.includes(s) ? chosen.filter((x) => x !== s) : [...chosen, s];
    setSkills(next);
  };

  const save = async () => {
    const res = await saveHelpSkills({ data: { skills: chosen } });
    if (!res.ok) toast.error(res.error);
    else {
      toast.success("Skills saved. Matching nearby requests.");
      await reloadMe();
    }
  };

  return (
    <div>
      <p className="kicker">Give a hand</p>
      <h1 className="h1">I can help with…</h1>
      <p className="tiny">Pick what you’re happy to do. Onegai uses this to match you with nearby requests.</p>
      <div className="filters" style={{ marginTop: 14 }}>
        {SKILL_OPTS.map((s) => (
          <button key={s} type="button" className={`chip ${chosen.includes(s) ? "on" : ""}`} onClick={() => toggle(s)}>
            {s}
          </button>
        ))}
      </div>
      <button className="btn btn-soft" style={{ marginTop: 12 }} onClick={() => void save()}>
        Save skills
      </button>

      <div className="pulse">
        <h2 className="h2">Matching requests</h2>
        <Link className="tiny" to="/app/discover">
          All nearby
        </Link>
      </div>
      {loading && <div className="skeleton" style={{ height: 120 }} />}
      {!loading && (data ?? []).length === 0 && (
        <div className="card empty">No open requests match those skills yet. Check Discover, or ask your Circle.</div>
      )}
      {(data ?? []).map((f) => (
        <FavorCard key={f.id} favor={f} cta="I can help" />
      ))}
    </div>
  );
}
