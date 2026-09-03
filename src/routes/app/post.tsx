import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PlacePicker, type PlaceValue } from "@/components/place-picker";
import { AUDIENCE, CATEGORIES, HELP_TYPES, PRESENCE, TIMES, WHEN_OPTS } from "@/lib/constants";
import { compressImage } from "@/lib/format";
import { createPost, getMe, listCircles } from "@/lib/loop";
import { useApi } from "@/lib/use-api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/post")({ component: Post });

function Post() {
  const nav = useNavigate();
  const { data: me } = useApi(() => getMe(), []);
  const { data: circles } = useApi(() => listCircles(), []);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Home");
  const [timeEstimate, setTime] = useState<(typeof TIMES)[number]>("15–30 min");
  const [whenNeeded, setWhen] = useState<(typeof WHEN_OPTS)[number]>("Flexible");
  const [helpType, setHelpType] = useState<(typeof HELP_TYPES)[number]["id"]>("kindness");
  const [presence, setPresence] = useState<(typeof PRESENCE)[number]["id"]>("in_person");
  const [reward, setReward] = useState(2);
  const [deadline, setDeadline] = useState("");
  const [photoUrl, setPhoto] = useState<string | null>(null);
  const [circleId, setCircle] = useState<string>("");
  const [audience, setAudience] = useState<(typeof AUDIENCE)[number]["id"]>("nearby");
  const [place, setPlace] = useState<PlaceValue | null>(null);
  const [destArea, setDest] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const needPlace = presence === "in_person" || presence === "pickup";
  const optionalPlace = presence === "either";
  const joined = (circles ?? []).filter((c) => c.joined);

  const publish = async () => {
    if (presence === "pickup" && !destArea) {
      toast.error("Add a drop-off area.");
      return;
    }
    if (needPlace && !place && me?.lat == null) {
      toast.error("Add an approximate area so neighbors can find you.");
      return;
    }
    setBusy(true);
    try {
      const res = await createPost({
        data: {
          type: "request",
          title,
          description,
          category,
          estimatedTime: timeEstimate,
          creditReward: helpType === "kindness" ? 0 : reward,
          deadline: deadline || null,
          helpType,
          whenNeeded,
          photoUrl,
          circleId: circleId || null,
          presence,
          audience,
          lat: place?.lat ?? (presence === "online" ? null : me?.lat ?? null),
          lng: place?.lng ?? (presence === "online" ? null : me?.lng ?? null),
          destArea: destArea || null,
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        setConfirm(false);
      } else {
        toast.success("Posted.");
        nav({ to: "/app/favor/$id", params: { id: res.data.id } });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not post.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="kicker">Ask for help</p>
      <h1 className="h1">What do you need help with?</h1>
      <p className="tiny">Keep it small and specific — like moving a table or grabbing something nearby.</p>

      <div className="field" style={{ marginTop: 16 }}>
        <label>What kind of help is this?</label>
        <div className="help-types">
          {PRESENCE.map((h) => (
            <button key={h.id} type="button" className={`help-type ${presence === h.id ? "on" : ""}`} onClick={() => setPresence(h.id)}>
              <b>{h.label}</b>
              <span>{h.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>What do you need?</label>
        <input
          className="input"
          placeholder="Can someone help me move a small table?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Category</label>
        <div className="filters">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" className={`chip ${category === c ? "on" : ""}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>When do you need it?</label>
        <div className="filters">
          {WHEN_OPTS.map((t) => (
            <button key={t} type="button" className={`chip ${whenNeeded === t ? "on" : ""}`} onClick={() => setWhen(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Where?</label>
        <PlacePicker
          value={place}
          onChange={setPlace}
          dest={destArea}
          onDest={setDest}
          needPlace={needPlace}
          needDest={presence === "pickup"}
          optional={optionalPlace}
        />
      </div>
      <div className="field">
        <label>Estimated time</label>
        <div className="filters">
          {TIMES.map((t) => (
            <button key={t} type="button" className={`chip ${timeEstimate === t ? "on" : ""}`} onClick={() => setTime(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Thanks type</label>
        <div className="help-types">
          {HELP_TYPES.map((h) => (
            <button key={h.id} type="button" className={`help-type ${helpType === h.id ? "on" : ""}`} onClick={() => setHelpType(h.id)}>
              <b>{h.label}</b>
              <span>{h.hint}</span>
            </button>
          ))}
        </div>
      </div>
      {helpType !== "kindness" && (
        <div className="field">
          <label>{helpType === "paid" ? `Paid thanks · ${reward}` : `Favor exchange · ${reward}`}</label>
          <input className="range" type="range" min={1} max={helpType === "favor" ? 3 : 10} value={reward} onChange={(e) => setReward(Number(e.target.value))} />
        </div>
      )}
      <div className="field">
        <label>Optional description</label>
        <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Stairs, timing, anything useful." />
      </div>
      <div className="field">
        <label>Optional photo</label>
        <input
          className="input"
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              setPhoto(await compressImage(file));
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not read photo.");
            }
          }}
        />
        {photoUrl ? <img src={photoUrl} alt="" className="post-photo" /> : null}
      </div>
      <div className="field">
        <label>Who should see this?</label>
        <div className="filters">
          {AUDIENCE.map((a) => (
            <button key={a.id} type="button" className={`chip ${audience === a.id ? "on" : ""}`} onClick={() => setAudience(a.id)}>
              {a.label}
            </button>
          ))}
        </div>
        {(audience === "circle" || audience === "both") && joined.length > 0 && (
          <div className="filters" style={{ marginTop: 8 }}>
            {joined.map((c) => (
              <button key={c.id} type="button" className={`chip ${circleId === c.id ? "on" : ""}`} onClick={() => setCircle(c.id)}>
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <button className="btn btn-primary btn-block" onClick={() => setConfirm(true)} disabled={!title.trim()}>
        Post request
      </button>
      {confirm && (
        <div className="modal-back" onClick={() => setConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="h2">Ready to ask?</h2>
            <p>
              {presence === "online"
                ? "This stays online — no physical location is shared."
                : "Neighbors will see an approximate area, not your exact address. You choose who to accept."}
            </p>
            <div className="row">
              <button className="btn btn-ghost" onClick={() => setConfirm(false)}>
                Edit
              </button>
              <button className="btn btn-primary" disabled={busy} onClick={() => void publish()}>
                {busy ? "Publishing…" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
