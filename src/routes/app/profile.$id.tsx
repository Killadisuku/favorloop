import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Avatar } from "@/components/avatar";
import { Back } from "@/components/back";
import { IconChat } from "@/components/icons";
import { getProfile } from "@/lib/loop";
import { blockUser, reportContent, startDirectChat } from "@/lib/loop";
import { useApi } from "@/lib/use-api";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/app/profile/$id")({ component: OtherProfile });

function OtherProfile() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { data, loading, error, reload } = useApi(() => getProfile({ data: { userId: id } }), [id]);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  if (loading) return <div className="skeleton" style={{ height: 200 }} />;
  if (error || !data) {
    return (
      <div>
        <Back to="/app" />
        <div className="card empty">{error}</div>
      </div>
    );
  }
  if (data.isSelf) {
    return (
      <div>
        <Back to="/app/profile" />
        <p>That's you.</p>
        <Link className="btn btn-primary" to="/app/profile">
          Open your profile
        </Link>
      </div>
    );
  }
  const p = data.profile;
  return (
    <div>
      <Back to="/app/discover" />
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Avatar user={p} size="lg" />
        <div>
          <h1 className="h1">{p.name}</h1>
          <div className="tiny">
            @{p.username} · {p.area || p.city}
          </div>
        </div>
      </div>
      <section className="card trust-card">
        <p className="kicker">Onegai Trust</p>
        <ul className="trust-list">
          <li>{p.verified ? "Identity verified" : "Identity not verified yet"}</li>
          <li>{p.phoneVerified ? "Phone verified" : "Phone not verified yet"}</li>
          <li>{p.favorsGiven} favors completed</li>
          <li>Helped {p.peopleHelped} people</li>
          <li>{p.reputation}% reliable</li>
          <li>{p.completionRate}% completion rate</li>
          <li>Member of {p.circleNames.length} Circles</li>
        </ul>
      </section>
      <div className="impact-grid">
        <div className="stat">
          <b>{p.favorsGiven}</b>
          <span>Completed</span>
        </div>
        <div className="stat">
          <b>{p.hoursGiven}h</b>
          <span>Time given</span>
        </div>
        <div className="stat">
          <b>{p.favorsReceived}</b>
          <span>Helped by others</span>
        </div>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <p>{p.bio || "This neighbor hasn't written a bio yet."}</p>
        <p className="tiny">
          {p.city} · {p.area}
        </p>
        <div className="badge-row">
          {p.skills.map((s) => (
            <span className="chip" key={s}>
              {s}
            </span>
          ))}
        </div>
      </div>
      <button
        className="btn btn-primary btn-block"
        style={{ marginTop: 12 }}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const res = await startDirectChat({ data: { userId: p.userId } });
            if (!res.ok) toast.error(res.error);
            else nav({ to: "/app/chat/$id", params: { id: res.data.conversationId } });
          } finally {
            setBusy(false);
          }
        }}
      >
        <IconChat size={18} /> Message
      </button>
      <h2 className="h2" style={{ margin: "18px 0 8px" }}>
        Reviews
      </h2>
      {data.reviews.length === 0 && <div className="card empty">No reviews yet.</div>}
      {data.reviews.map((r) => (
        <div className="card" key={r.id}>
          <b>{r.stars}★</b> {r.tags.join(" · ")}
          <p>{r.body}</p>
        </div>
      ))}
      <div className="card" style={{ marginTop: 12 }}>
        <h2 className="h2">Safety</h2>
        <textarea className="textarea" placeholder="Reason to report" value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="row" style={{ marginTop: 10 }}>
          <button
            className="btn btn-danger"
            onClick={async () => {
              const res = await reportContent({ data: { reportedUserId: p.userId, postId: null, reason } });
              if (!res.ok) toast.error(res.error);
              else toast.success("Report received.");
            }}
          >
            Report
          </button>
          <button
            className="btn btn-ghost"
            onClick={async () => {
              if (!window.confirm(`Block ${p.name}? They will disappear from your feeds.`)) return;
              const res = await blockUser({ data: { userId: p.userId, blocked: true } });
              if (!res.ok) toast.error(res.error);
              else {
                toast.success("Blocked.");
                void reload();
              }
            }}
          >
            Block
          </button>
        </div>
      </div>
    </div>
  );
}
