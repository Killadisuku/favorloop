import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Back } from "@/components/back";
import { Avatar } from "@/components/avatar";
import { authClient } from "@/lib/auth/client";
import { compressImage } from "@/lib/format";
import { INTEREST_OPTS, NEED_OPTS, SKILL_OPTS } from "@/lib/constants";
import { getMe, updateProfile } from "@/lib/server/profile";
import { useApi } from "@/lib/use-api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({ component: Settings });

function Settings() {
  const { data: me, reload } = useApi(() => getMe(), []);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [needs, setNeeds] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [busy, setBusy] = useState(false);

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
        <label>City</label>
        <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
      </div>
      <div className="field">
        <label>Neighborhood</label>
        <input className="input" value={area} onChange={(e) => setArea(e.target.value)} />
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

      <h2 className="h2" style={{ margin: "24px 0 8px" }}>
        Change password
      </h2>
      <p className="tiny">Works for email-and-password accounts. Google / X logins don't have a local password.</p>
      <div className="field">
        <label>Current password</label>
        <input className="input" type="password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div className="field">
        <label>New password</label>
        <input className="input" type="password" value={newPassword} onChange={(e) => setNew(e.target.value)} />
      </div>
      <button
        className="btn btn-ghost btn-block"
        onClick={async () => {
          const { error } = await authClient.changePassword({ currentPassword, newPassword });
          if (error) toast.error(error.message ?? "Could not change password.");
          else {
            toast.success("Password updated.");
            setCurrent("");
            setNew("");
          }
        }}
      >
        Update password
      </button>
    </div>
  );
}
