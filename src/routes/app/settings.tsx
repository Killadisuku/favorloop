import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Back } from "@/components/back";
import { Avatar } from "@/components/avatar";
import { AREAS, INTEREST_OPTS, NEED_OPTS, SKILL_OPTS } from "@/lib/constants";
import { compressImage } from "@/lib/format";
import { requestGps } from "@/lib/location";
import { getMe, getPrefs, setMyLocation, updatePrefs, updateProfile } from "@/lib/loop";
import { useApi } from "@/lib/use-api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({ component: Settings });

function Settings() {
  const { data: me, reload } = useApi(() => getMe(), []);
  const { data: prefs, reload: reloadPrefs } = useApi(() => getPrefs(), []);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [needs, setNeeds] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locBusy, setLocBusy] = useState(false);

  useEffect(() => {
    if (!me || ready) return;
    setName(me.name);
    setBio(me.bio);
    setCity(me.city);
    setArea(me.area);
    setPhotoUrl(me.photoUrl);
    setSkills(me.skills);
    setNeeds(me.needHelpWith);
    setInterests(me.interests);
    setReady(true);
  }, [me, ready]);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  if (!me) return <div className="skeleton" style={{ height: 160 }} />;

  return (
    <div>
      <Back to="/app/profile" label="Settings" />
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <Avatar user={{ ...me, photoUrl }} size="lg" />
        <div>
          <b>{me.name}</b>
          <div className="tiny">@{me.username}</div>
        </div>
      </div>
      <div className="field">
        <label>Photo</label>
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
        <label>Name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label>Bio</label>
        <textarea className="textarea" value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
      <div className="field">
        <label>Your area</label>
        <p className="tiny">Used to match nearby favors. Others never see your exact door.</p>
        <div className="filters">
          <button
            type="button"
            className="chip"
            disabled={locBusy}
            onClick={async () => {
              setLocBusy(true);
              const res = await requestGps();
              setLocBusy(false);
              if ("error" in res) toast.error(res.error);
              else {
                await setMyLocation({ data: { ...res, source: "gps" } });
                setCity(res.city);
                setArea(res.area);
                toast.success(`Now matching near ${res.area}.`);
                void reload();
              }
            }}
          >
            {locBusy ? "Finding you…" : "Use my location"}
          </button>
          {AREAS.filter((a) => a.name !== "Nearby").map((a) => (
            <button
              key={a.name}
              type="button"
              className={`chip ${area === a.name ? "on" : ""}`}
              onClick={async () => {
                setCity(a.city);
                setArea(a.name);
                await setMyLocation({ data: { lat: a.lat, lng: a.lng, area: a.name, city: a.city, source: "manual" } });
                toast.success(`Now matching near ${a.name}.`);
                void reload();
              }}
            >
              {a.name}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Notifications</label>
        <p className="tiny">Onegai only pings you about nearby matches and Circles. Never a stream of map alerts.</p>
        <div className="filters">
          <button
            type="button"
            className={`chip ${prefs?.nearbyNotifs !== false ? "on" : ""}`}
            onClick={async () => {
              await updatePrefs({ data: { nearbyNotifs: !(prefs?.nearbyNotifs !== false) } });
              void reloadPrefs();
            }}
          >
            Nearby matches
          </button>
          <button
            type="button"
            className={`chip ${prefs?.circleNotifs !== false ? "on" : ""}`}
            onClick={async () => {
              await updatePrefs({ data: { circleNotifs: !(prefs?.circleNotifs !== false) } });
              void reloadPrefs();
            }}
          >
            Circle requests
          </button>
        </div>
      </div>
      <div className="field">
        <label>Skills</label>
        <div className="filters">
          {SKILL_OPTS.map((s) => (
            <button key={s} type="button" className={`chip ${skills.includes(s) ? "on" : ""}`} onClick={() => toggle(skills, setSkills, s)}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Need help with</label>
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
      <button
        className="btn btn-primary btn-block"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const res = await updateProfile({ data: { name, bio, city, area, photoUrl, skills, needHelpWith: needs, interests } });
          setBusy(false);
          if (!res.ok) toast.error(res.error);
          else {
            toast.success("Profile saved.");
            void reload();
          }
        }}
      >
        {busy ? "Saving…" : "Save profile"}
      </button>
    </div>
  );
}
