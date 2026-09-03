import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SessionGate } from "@/components/gate";
import { APP_NAME, AREAS, INTENT_OPTS, SKILL_OPTS } from "@/lib/constants";
import { compressImage } from "@/lib/format";
import { completeOnboarding } from "@/lib/loop";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({ component: Page });

function Page() {
  return (
    <SessionGate needOnboarding>
      {(me) => (
        <OnboardingForm
          defaultName={me.name === "New neighbor" || me.name === "Neighbor" ? "" : me.name}
          defaultUser={me.username === "new" || me.username === "neighbor" ? "" : me.username}
          defaultPhoto={me.photoUrl}
        />
      )}
    </SessionGate>
  );
}

function OnboardingForm({ defaultName, defaultUser, defaultPhoto }: { defaultName: string; defaultUser: string; defaultPhoto: string | null }) {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [intent, setIntent] = useState("both");
  const [name, setName] = useState(defaultName);
  const [username, setUsername] = useState(defaultUser);
  const [area, setArea] = useState("Marina");
  const [hue, setHue] = useState(168);
  const [photoUrl, setPhotoUrl] = useState<string | null>(defaultPhoto);
  const [skills, setSkills] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const toggle = (v: string) => setSkills((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));

  const finish = async (loc: { lat: number | null; lng: number | null }) => {
    if (name.trim().length < 2) {
      toast.error("Please add your name.");
      setStep(0);
      return;
    }
    let coords = loc;
    if (coords.lat == null) {
      const a = AREAS.find((x) => x.name === area);
      if (a) coords = { lat: a.lat, lng: a.lng };
    }
    setBusy(true);
    try {
      const res = await completeOnboarding({
        data: {
          name,
          username,
          bio: "",
          city: "Dubai",
          area,
          photoUrl,
          avatarHue: hue,
          lat: coords.lat,
          lng: coords.lng,
          skills: intent === "need" ? skills : skills.length ? skills : ["Household help"],
          needHelpWith: intent === "help" ? [] : ["Home"],
          interests: ["Neighbors"],
          intent,
        },
      });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success(`Welcome to ${APP_NAME}.`);
        nav({ to: "/app" });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save your profile.");
    } finally {
      setBusy(false);
    }
  };

  const geoThenFinish = () => {
    if (!navigator.geolocation) {
      void finish({ lat: null, lng: null });
      return;
    }
    let done = false;
    const end = (loc: { lat: number | null; lng: number | null }) => {
      if (done) return;
      done = true;
      void finish(loc);
    };
    const t = window.setTimeout(() => end({ lat: null, lng: null }), 1200);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.clearTimeout(t);
        end({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        window.clearTimeout(t);
        end({ lat: null, lng: null });
      },
      { timeout: 1000, maximumAge: 60_000 },
    );
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <p className="kicker">
          Step {step + 1} of 3 · {APP_NAME}
        </p>
        {step === 0 && (
          <>
            <h1 className="h1">What brings you to {APP_NAME}?</h1>
            <p className="muted">This only takes a minute. You can change it later.</p>
            <div className="field" style={{ marginTop: 16 }}>
              <label>Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="intent-grid">
              {INTENT_OPTS.map((opt) => (
                <button key={opt.id} type="button" className={`intent-card ${intent === opt.id ? "on" : ""}`} onClick={() => setIntent(opt.id)}>
                  {opt.label}
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => setStep(1)}>
              Continue
            </button>
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="h1">{intent === "need" ? "What might you need help with?" : "What can you help with?"}</h1>
            <p className="tiny">Pick a few. Matching uses these, plus distance and reliability.</p>
            <div className="filters" style={{ marginTop: 14 }}>
              {SKILL_OPTS.map((s) => (
                <button key={s} type="button" className={`chip ${skills.includes(s) ? "on" : ""}`} onClick={() => toggle(s)}>
                  {s}
                </button>
              ))}
            </div>
            <div className="field" style={{ marginTop: 14 }}>
              <label>Profile photo · optional</label>
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
            <input className="range" type="range" min={0} max={360} value={hue} onChange={(e) => setHue(Number(e.target.value))} />
            <div className="row" style={{ marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setStep(0)}>
                Back
              </button>
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                Continue
              </button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="h1">Where do you want to help?</h1>
            <p className="tiny">Pick a neighborhood. GPS is optional — we never show your exact door.</p>
            <div className="filters" style={{ marginTop: 14 }}>
              {AREAS.filter((a) => a.name !== "Nearby").map((a) => (
                <button key={a.name} type="button" className={`chip ${area === a.name ? "on" : ""}`} onClick={() => setArea(a.name)}>
                  {a.name}
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={busy} onClick={geoThenFinish}>
              {busy ? "Saving…" : "Use my location"}
            </button>
            <button className="btn btn-ghost btn-block" disabled={busy} onClick={() => void finish({ lat: null, lng: null })}>
              Skip GPS · stay in {area}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
