import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Back } from "@/components/back";
import { Avatar } from "@/components/avatar";
import { IconLocate } from "@/components/icons";
import { PersonaSwitch } from "@/components/persona-switch";
import { SignOutBtn } from "@/components/sign-out-btn";
import { AREAS, INTEREST_OPTS, NEED_OPTS, SKILL_OPTS } from "@/lib/constants";
import { compressImage, relativeTime } from "@/lib/format";
import {
  formatAccuracy,
  isGpsFix,
  permissionLabel,
  queryLocationPermission,
  requestGps,
  watchLocationPermission,
  type GpsFix,
  type LocPermission,
} from "@/lib/location";
import { getMe, getPrefs, setMyLocation, updatePrefs, updateProfile } from "@/lib/loop";
import { useApi } from "@/lib/use-api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({ component: Settings });

function LocationPermissionTest({
  savedArea,
  onLocated,
}: {
  savedArea: string;
  onLocated: (fix: GpsFix) => Promise<void>;
}) {
  const [perm, setPerm] = useState<LocPermission>("unknown");
  const [busy, setBusy] = useState(false);
  const [fix, setFix] = useState<GpsFix | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => watchLocationPermission(setPerm), []);

  const test = async () => {
    setBusy(true);
    setError(null);
    const res = await requestGps();
    const queried = await queryLocationPermission();
    if (isGpsFix(res)) setPerm("granted");
    else if (res.permission === "denied" || res.permission === "unsupported") setPerm(res.permission);
    else setPerm(queried === "unknown" ? res.permission : queried);
    setBusy(false);
    if (!isGpsFix(res)) {
      setFix(null);
      setError(res.error);
      toast.error(res.error);
      return;
    }
    setFix(res);
    await onLocated(res);
    toast.success(`Location works. Matching near ${res.area}.`);
  };

  const status = fix ? "granted" : perm;
  const statusClass = status === "granted" || status === "denied" || status === "prompt" || status === "unsupported" ? status : "unknown";

  return (
    <section className="card loc-test">
      <div className="loc-test-head">
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span className="loc-test-icon" aria-hidden>
            <IconLocate size={18} />
          </span>
          <div>
            <label>Location permissions</label>
            <p className="tiny">Test whether this device will share an approximate area. Exact coordinates stay on your phone.</p>
          </div>
        </div>
        <span className={`loc-status ${statusClass}`}>
          <span className="loc-dot" />
          {permissionLabel(status)}
        </span>
      </div>

      <div className="loc-test-rows">
        <div className="loc-test-row">
          <span>Browser support</span>
          <b>{perm === "unsupported" ? "No GPS on this device" : "Geolocation available"}</b>
        </div>
        <div className="loc-test-row">
          <span>Permission</span>
          <b>{permissionLabel(perm)}</b>
        </div>
        <div className="loc-test-row">
          <span>Saved area</span>
          <b>{savedArea || "Not set"}</b>
        </div>
        {fix ? (
          <>
            <div className="loc-test-row">
              <span>Last test</span>
              <b>
                {fix.area}, {fix.city}
              </b>
            </div>
            <div className="loc-test-row">
              <span>Accuracy</span>
              <b>{formatAccuracy(fix.accuracyM)}</b>
            </div>
            <div className="loc-test-row">
              <span>Checked</span>
              <b>{relativeTime(new Date(fix.at).toISOString())}</b>
            </div>
          </>
        ) : null}
      </div>

      {error ? <p className="loc-test-hint">{error}</p> : null}
      {perm === "denied" ? (
        <p className="loc-test-hint">
          Open this site’s settings in your browser, set Location to Allow, then test again. On iPhone: Settings → Safari (or
          Chrome) → Location.
        </p>
      ) : null}
      {perm === "unsupported" ? (
        <p className="loc-test-hint">This browser cannot share GPS. Pick a neighborhood below — nearby matching still works.</p>
      ) : null}

      <div className="loc-test-actions">
        <button type="button" className="btn btn-primary" disabled={busy || perm === "unsupported"} onClick={() => void test()}>
          {busy ? "Checking…" : fix ? "Test again" : "Test location"}
        </button>
      </div>
    </section>
  );
}

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

      <LocationPermissionTest
        savedArea={area || me.area}
        onLocated={async (res) => {
          await setMyLocation({ data: { ...res, source: "gps" } });
          setCity(res.city);
          setArea(res.area);
          void reload();
        }}
      />

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
              if (!isGpsFix(res)) toast.error(res.error);
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
      <div className="card" style={{ marginTop: 16 }}>
        <b>Account</b>
        <p className="tiny">This session is signed with Onegai. Logging out ends it on this device.</p>
        <SignOutBtn className="btn btn-ghost btn-block" />
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <b>Preview neighbors</b>
        <p className="tiny">Only for trying the two-person journey in this preview. Production accounts stay one user, one profile.</p>
        <PersonaSwitch me={me} />
      </div>
    </div>
  );
}
