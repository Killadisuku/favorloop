import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CATEGORIES, TIMES } from "@/lib/constants";
import { getMe } from "@/lib/server/profile";
import { createPost } from "@/lib/server/posts";
import { useApi } from "@/lib/use-api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/post")({ component: Post });

function Post() {
  const nav = useNavigate();
  const { data: me } = useApi(() => getMe(), []);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Home");
  const [timeEstimate, setTime] = useState<(typeof TIMES)[number]>("15–30 min");
  const [reward, setReward] = useState(2);
  const [type, setType] = useState<"request" | "offer">("request");
  const [deadline, setDeadline] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const publish = async () => {
    setBusy(true);
    try {
      const res = await createPost({
        data: { type, title, description, category, estimatedTime: timeEstimate, creditReward: reward, deadline: deadline || null },
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

  const available = me?.available ?? 0;

  return (
    <div>
      <p className="kicker">Create a favor</p>
      <h1 className="h1">What do you need help with?</h1>
      <p className="tiny">Available credits: {available}</p>
      <div className="filters" style={{ marginTop: 12 }}>
        <button className={`chip ${type === "request" ? "on" : ""}`} onClick={() => setType("request")}>
          Request help
        </button>
        <button className={`chip ${type === "offer" ? "on" : ""}`} onClick={() => setType("offer")}>
          Offer a skill
        </button>
      </div>
      <div className="field" style={{ marginTop: 16 }}>
        <label>Title</label>
        <input className="input" placeholder="Help me set up my Wi-Fi…" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="field">
        <label>Describe what you need</label>
        <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
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
        <label>Location</label>
        <input className="input" value={`${me?.area || "Nearby"}${me?.city ? `, ${me.city}` : ""}`} readOnly />
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
        <label>Favor reward · {reward}</label>
        <input className="range" type="range" min={1} max={10} value={reward} onChange={(e) => setReward(Number(e.target.value))} />
        <div className="tiny">1–10 community credits. Reserved until the favor completes or you cancel.</div>
      </div>
      <div className="field">
        <label>Optional deadline</label>
        <input className="input" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </div>
      <button className="btn btn-primary btn-block" onClick={() => setConfirm(true)} disabled={!title.trim()}>
        Post favor
      </button>
      {confirm && (
        <div className="modal-back" onClick={() => setConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="h2">Ready to post?</h2>
            <p>
              You are offering <b>{reward} Favor Credits</b>. They stay in your wallet but are reserved so you cannot overspend.
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
