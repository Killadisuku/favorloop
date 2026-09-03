import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FavorCard } from "@/components/favor-card";
import { AVAILABILITY_OPTS, PRESENCE, RADIUS_OPTS, SKILL_OPTS } from "@/lib/constants";
import { getMe, listDiscover, saveHelpSkills } from "@/lib/loop";
import { useApi } from "@/lib/use-api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/help")({ component: Help });

function Help() {
  const { data: me, reload: reloadMe } = useApi(() => getMe(), []);
  const [skills, setSkills] = useState<string[] | null>(null);
  const [availability, setAvailability] = useState<string | null>(null);
  const [radius, setRadius] = useState<number | null>(null);
  const [presence, setPresence] = useState<string | null>(null);
  const chosen = skills ?? me?.skills ?? [];
  const avail = availability ?? me?.availability ?? "Flexible";
  const rad = radius ?? me?.preferredRadius ?? 12;
  const pres = presence ?? me?.presencePref ?? "either";
  const { data, loading } = useApi(() => listDiscover({ data: { type: "request", sort: "match", skillsOnly: true } }), [chosen.join(",")]);

  const toggle = (s: string) => setSkills(chosen.includes(s) ? chosen.filter((x) => x !== s) : [...chosen, s]);

  const save = async () => {
    const res = await saveHelpSkills({ data: { skills: chosen, availability: avail, preferredRadius: rad, presencePref: pres } });
    if (!res.ok) toast.error(res.error);
    else {
      toast.success("Matching nearby requests with your skills.");
      await reloadMe();
    }
  };

  return (
    <div>
      <p className="kicker">Give a hand</p>
      <h1 className="h1">I can help with…</h1>
      <p className="tiny">Skills, availability, and how far you’ll go. Onegai uses this to match you — not a random nearby feed.</p>
      <div className="filters" style={{ marginTop: 14 }}>
        {SKILL_OPTS.map((s) => (
          <button key={s} type="button" className={`chip ${chosen.includes(s) ? "on" : ""}`} onClick={() => toggle(s)}>
            {s}
          </button>
        ))}
      </div>
      <p className="tiny" style={{ marginTop: 14 }}>
        When I’m free
      </p>
      <div className="filters">
        {AVAILABILITY_OPTS.map((a) => (
          <button key={a} type="button" className={`chip ${avail === a ? "on" : ""}`} onClick={() => setAvailability(a)}>
            {a}
          </button>
        ))}
      </div>
      <p className="tiny" style={{ marginTop: 14 }}>
        Preferred radius
      </p>
      <div className="filters">
        {RADIUS_OPTS.map((n) => (
          <button key={n} type="button" className={`chip ${rad === n ? "on" : ""}`} onClick={() => setRadius(n)}>
            {n} km
          </button>
        ))}
      </div>
      <p className="tiny" style={{ marginTop: 14 }}>
        How I like to help
      </p>
      <div className="filters">
        {PRESENCE.filter((p) => p.id !== "pickup").map((p) => (
          <button key={p.id} type="button" className={`chip ${pres === p.id ? "on" : ""}`} onClick={() => setPresence(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
      <button className="btn btn-soft" style={{ marginTop: 12 }} onClick={() => void save()}>
        Save how I help
      </button>

      <div className="pulse">
        <h2 className="h2">Requests that match you</h2>
        <Link className="tiny" to="/app/discover">
          All nearby
        </Link>
      </div>
      {loading && <div className="skeleton" style={{ height: 120 }} />}
      {!loading && (data ?? []).length === 0 && (
        <div className="card empty">
          <p>Nothing matches your skills right now.</p>
          <p className="tiny">Check Discover, or ask your Circle.</p>
        </div>
      )}
      {(data ?? []).map((f) => (
        <FavorCard key={f.id} favor={f} cta="I can help" />
      ))}
    </div>
  );
}
