import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SessionGate } from "@/components/gate";
import { INTEREST_OPTS, NEED_OPTS, SKILL_OPTS } from "@/lib/constants";
import { compressImage } from "@/lib/format";
import { completeOnboarding } from "@/lib/server/profile";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({ component: Page });

function Page() {
  return (
    <SessionGate needOnboarding>
      {(me) => <OnboardingForm defaultName={me.name} defaultUser={me.username} />}
    </SessionGate>
  );
}

function OnboardingForm({ defaultName, defaultUser }: { defaultName: string; defaultUser: string }) {
  const nav = useNavigate();
  const [name, setName] = useState(defaultName);
  const [username, setUsername] = useState(defaultUser);
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [bio, setBio] = useState("");
  const [hue, setHue] = useState(168);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [needs, setNeeds] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const geo = () => {
    void (async () => {
      const loc = await new Promise<{ lat: number | null; lng: number | null }>((resolve) => {
        if (!navigator.geolocation) {
          resolve({ lat: null, lng: null });
          return;
        }
        let done = false;
        const finish = (value: { lat: number | null; lng: number | null }) => {
          if (done) return;
          done = true;
          resolve(value);
        };
        const timer = window.setTimeout(() => finish({ lat: null, lng: null }), 1200);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            window.clearTimeout(timer);
            finish({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => {
            window.clearTimeout(timer);
            finish({ lat: null, lng: null });
          },
          { timeout: 1000, maximumAge: 60_000 },
        );
      });
      await completeAndGo(loc);
    })();
  };

  const completeAndGo = async (loc: { lat: number | null; lng: number | null }) => {
    setBusy(true);
    try {
      const res = await completeOnboarding({
        data: { name, username, bio, city, area, photoUrl, avatarHue: hue, lat: loc.lat, lng: loc.lng, skills, needHelpWith: needs, interests },
      });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Welcome to Por Favor.");
        nav({ to: "/app" });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save your profile.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <p className="kicker">Almost there</p>
        <h1 className="h1">Welcome to Por Favor.</h1>
        <p className="muted">You start with 3 promotional starter credits.</p>
        <div className="field" style={{ marginTop: 16 }}>
          <label>Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Username</label>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="field">
          <label>Profile photo</label>
          <input
            className="input"
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                setPhotoUrl(await compressImage(file));
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not read photo.");
              }
            }}
          />
        </div>
        <div className="field">
          <label>Profile color</label>
          <input className="range" type="range" min={0} max={360} value={hue} onChange={(e) => setHue(Number(e.target.value))} />
        </div>
        <div className="field">
          <label>City</label>
          <input className="input" value={city} placeholder="Dubai" onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="field">
          <label>Neighborhood</label>
          <input className="input" value={area} placeholder="Marina" onChange={(e) => setArea(e.target.value)} />
        </div>
        <div className="field">
          <label>Short bio</label>
          <textarea className="textarea" value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <div className="field">
          <label>What can you help with?</label>
          <div className="filters">
            {SKILL_OPTS.map((s) => (
              <button key={s} type="button" className={`chip ${skills.includes(s) ? "on" : ""}`} onClick={() => toggle(skills, setSkills, s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>What might you need help with?</label>
          <div className="filters">
            {NEED_OPTS.map((s) => (
              <button key={s} type="button" className={`chip ${needs.includes(s) ? "on" : ""}`} onClick={() => toggle(needs, setNeeds, s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Interests</label>
          <div className="filters">
            {INTEREST_OPTS.map((s) => (
              <button key={s} type="button" className={`chip ${interests.includes(s) ? "on" : ""}`} onClick={() => toggle(interests, setInterests, s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-block" disabled={busy} onClick={geo}>
          {busy ? "Saving…" : "Start looping"}
        </button>
        <p className="tiny" style={{ marginTop: 8 }}>
          We'll ask for location to sort nearby requests. You can skip the prompt.
        </p>
      </div>
    </div>
  );
}
