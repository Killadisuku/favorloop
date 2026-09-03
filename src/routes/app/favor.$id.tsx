import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { Back } from "@/components/back";
import { IconChat, IconFlag, IconShield } from "@/components/icons";
import { REVIEW_TAGS, helpTypeLabel } from "@/lib/constants";
import { formatDistance } from "@/lib/format";
import { getMe } from "@/lib/loop";
import { boostPost, cancelPost, getPost, startFavor, toggleBookmark } from "@/lib/loop";
import { confirmComplete, requestComplete } from "@/lib/loop";
import { blockUser, decideOffer, getChatForPost, offerHelp, reportContent, submitReview } from "@/lib/loop";
import { useApi } from "@/lib/use-api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/favor/$id")({ component: FavorDetail });

function FavorDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { data: me } = useApi(() => getMe(), []);
  const { data, loading, error, reload } = useApi(() => getPost({ data: { id } }), [id]);
  const [confirm, setConfirm] = useState(false);
  const [offerMsg, setOfferMsg] = useState("");
  const [rate, setRate] = useState(false);
  const [stars, setStars] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [safety, setSafety] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="skeleton" style={{ height: 200 }} />;
  if (error || !data) {
    return (
      <div>
        <Back to="/app/discover" />
        <div className="card empty">{error || "This request is gone."}</div>
      </div>
    );
  }
  const { post, offers } = data;
  const mine = me?.userId === post.author.userId;
  const amHelper = me?.userId === post.helper?.userId;
  const involved = mine || amHelper;
  const other = mine ? post.helper : post.author;
  const pending = offers.filter((o) => o.status === "pending");

  const run = async (fn: () => Promise<{ ok: true; data: unknown } | { ok: false; error: string }>, okMsg?: string) => {
    setBusy(true);
    try {
      const res = await fn();
      if (!res.ok) toast.error(res.error);
      else {
        if (okMsg) toast.success(okMsg);
        await reload();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Back to="/app/discover" label="Request" />
      <div className="card">
        <div className="favor-top">
          <Avatar user={post.author} />
          <div className="who">
            <b>
              {post.author.name}
              {post.author.verified ? " ✓" : ""}
            </b>
            <span className="trust">{post.author.reputation}% Trust</span>
          </div>
          <span className="chip">{post.lifecycle}</span>
        </div>
        <h1 className="h2" style={{ marginTop: 14 }}>
          {post.title}
        </h1>
        <p>{post.description}</p>
        {post.photoUrl ? <img src={post.photoUrl} alt="" className="post-photo" /> : null}
        <div className="meta">
          <span>{post.category}</span>
          <span>{formatDistance(post.distanceKm)}</span>
          <span>{post.whenNeeded}</span>
          <span>{post.estimatedTime}</span>
          <span className={`chip htype-${post.helpType}`}>{helpTypeLabel(post.helpType)}</span>
          {post.circleName ? <span>{post.circleName}</span> : null}
        </div>
        <p className="tiny" style={{ marginTop: 10 }}>
          Approximate area only. Exact meeting details stay in chat after you accept.
        </p>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <IconShield />
          <div>
            <b>Safety</b>
            <div className="tiny">Meet in public when you can. Cancel, report, or block anytime.</div>
          </div>
        </div>
        <button className="btn btn-soft btn-block" style={{ marginTop: 10 }} onClick={() => setSafety(true)}>
          Safety guidelines
        </button>
      </div>

      {post.status === "open" && !mine && (
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" disabled={busy || !!post.myOfferStatus} onClick={() => setConfirm(true)}>
            {post.myOfferStatus ? `Offer ${post.myOfferStatus}` : "I can help"}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => void run(() => toggleBookmark({ data: { id: post.id } }), post.bookmarked ? "Removed" : "Saved")}
          >
            {post.bookmarked ? "Saved" : "Save"}
          </button>
        </div>
      )}

      {post.status === "open" && mine && (
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn btn-ghost" disabled={busy} onClick={() => {
            if (!window.confirm("Cancel this request? Pending offers will be declined.")) return;
            void run(() => cancelPost({ data: { id: post.id } }), "Cancelled");
          }}>
            Cancel request
          </button>
          <button
            className="btn btn-gold"
            disabled={busy}
            onClick={() => void run(() => boostPost({ data: { id: post.id } }))}
          >
            Boost 24h
          </button>
        </div>
      )}

      {mine && pending.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h2 className="h2">Pending offers</h2>
          {pending.map((o) => (
            <div className="card" key={o.id}>
              <div className="favor-top">
                <Avatar user={o.helper} />
                <div className="who">
                  <b>{o.helper.name}</b>
                  <span>
                    {o.helper.reputation}% trust · {o.helper.favorsGiven} helped
                  </span>
                </div>
              </div>
              {o.message && <p className="tiny">{o.message}</p>}
              <div className="row" style={{ marginTop: 10 }}>
                <button
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      const res = await decideOffer({ data: { offerId: o.id, action: "accept" } });
                      if (res.ok && "conversationId" in res.data) {
                        nav({ to: "/app/chat/$id", params: { id: (res.data as { conversationId: string }).conversationId } });
                      }
                      return res;
                    }, "Offer accepted")
                  }
                >
                  Accept
                </button>
                <button
                  className="btn btn-ghost"
                  disabled={busy}
                  onClick={() => void run(() => decideOffer({ data: { offerId: o.id, action: "decline" } }), "Declined")}
                >
                  Decline
                </button>
                <Link className="btn btn-soft" to="/app/profile/$id" params={{ id: o.helper.userId }}>
                  Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {involved && post.status !== "open" && post.status !== "cancelled" && (
        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 12 }}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const res = await getChatForPost({ data: { postId: post.id } });
              if (!res.ok) toast.error(res.error);
              else nav({ to: "/app/chat/$id", params: { id: res.data.conversationId } });
            } finally {
              setBusy(false);
            }
          }}
        >
          <IconChat size={18} /> Message
        </button>
      )}

      {involved && (post.status === "accepted" || post.status === "in_progress") && (
        <button
          className="btn btn-soft btn-block"
          style={{ marginTop: 12 }}
          disabled={busy || post.status === "in_progress"}
          onClick={() => void run(() => startFavor({ data: { postId: post.id } }), "Marked in progress")}
        >
          {post.status === "in_progress" ? "In progress" : "We're starting"}
        </button>
      )}

      {amHelper && (post.status === "accepted" || post.status === "in_progress") && (
        <button
          className="btn btn-soft btn-block"
          style={{ marginTop: 12 }}
          disabled={busy}
          onClick={() => void run(() => requestComplete({ data: { postId: post.id } }), "Asked the requester to confirm")}
        >
          I've finished — request confirmation
        </button>
      )}

      {mine && (post.status === "accepted" || post.status === "in_progress" || post.status === "pending_confirm") && (
        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 12 }}
          disabled={busy}
          onClick={() => void run(() => confirmComplete({ data: { postId: post.id } }), "Favor completed")}
        >
          Confirm completion
        </button>
      )}

      {post.status === "completed" && involved && other && (
        <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => setRate(true)}>
          Rate {other.name}
        </button>
      )}

      {other && post.status !== "open" && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="tiny">Connected with</div>
          <div className="favor-top" style={{ marginTop: 8 }}>
            <Avatar user={other} />
            <div className="who">
              <b>{other.name}</b>
              <span>{other.reputation}% trust</span>
            </div>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn btn-danger" onClick={() => setReportOpen(true)}>
              <IconFlag size={16} /> Report
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                if (!window.confirm(`Block ${other.name}?`)) return;
                void run(() => blockUser({ data: { userId: other.userId, blocked: true } }), "Blocked");
              }}
            >
              Block
            </button>
          </div>
        </div>
      )}

      {confirm && (
        <div className="modal-back" onClick={() => setConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="h2">Offer to help {post.author.name}?</h2>
            <p className="tiny">They will review your offer. Chat opens only after they accept.</p>
            <textarea className="textarea" placeholder="Optional note" value={offerMsg} onChange={(e) => setOfferMsg(e.target.value)} />
            <div className="row">
              <button className="btn btn-ghost" onClick={() => setConfirm(false)}>
                Not now
              </button>
              <button
                className="btn btn-primary"
                disabled={busy}
                onClick={() => {
                  void run(() => offerHelp({ data: { postId: post.id, message: offerMsg } }), "Offer sent");
                  setConfirm(false);
                }}
              >
                Send offer
              </button>
            </div>
          </div>
        </div>
      )}

      {rate && other && (
        <div className="modal-back">
          <div className="modal">
            <h2 className="h2">Did this favor go well?</h2>
            <div className="stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} className={n <= stars ? "on" : ""} onClick={() => setStars(n)}>
                  ★
                </button>
              ))}
            </div>
            <div className="filters">
              {REVIEW_TAGS.map((t) => (
                <button
                  key={t}
                  className={`chip ${tags.includes(t) ? "on" : ""}`}
                  onClick={() => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))}
                >
                  {t}
                </button>
              ))}
            </div>
            <textarea className="textarea" placeholder="Optional note" value={text} onChange={(e) => setText(e.target.value)} />
            <button
              className="btn btn-primary btn-block"
              disabled={busy}
              onClick={() =>
                void run(
                  () => submitReview({ data: { favorId: post.id, toUserId: other.userId, stars, tags, body: text } }),
                  "Thanks. Trust scores only move after real favors.",
                ).then(() => setRate(false))
              }
            >
              Submit rating
            </button>
          </div>
        </div>
      )}

      {safety && (
        <div className="modal-back" onClick={() => setSafety(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="h2">Safety guidelines</h2>
            <p>Do not accept dangerous, illegal, medical, or financial tasks. Chat stays inside the favor.</p>
            <button className="btn btn-primary btn-block" onClick={() => setSafety(false)}>
              Got it
            </button>
          </div>
        </div>
      )}

      {reportOpen && other && (
        <div className="modal-back" onClick={() => setReportOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="h2">Report {other.name}</h2>
            <textarea className="textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What happened?" />
            <button
              className="btn btn-danger btn-block"
              disabled={busy || !reason.trim()}
              onClick={() =>
                void run(
                  () => reportContent({ data: { reportedUserId: other.userId, postId: post.id, reason } }),
                  "Report received.",
                ).then(() => setReportOpen(false))
              }
            >
              Submit report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
