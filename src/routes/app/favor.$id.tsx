import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { Back } from "@/components/back";
import { IconChat, IconFlag, IconShield } from "@/components/icons";
import { CANCEL_REASONS, OUTCOME_REASONS, REPORT_REASONS, REVIEW_TAGS, WHEN_OPTS, helpTypeLabel, presenceLabel } from "@/lib/constants";
import { formatDistance, formatDuration, formatWalk } from "@/lib/format";
import { getMe } from "@/lib/loop";
import { boostPost, cancelPost, expandArea, getPost, reopenPost, shareMeeting, startFavor, toggleBookmark, updatePost } from "@/lib/loop";
import { confirmComplete, requestComplete } from "@/lib/loop";
import { blockUser, decideOffer, getChatForPost, offerHelp, reportContent, reportOutcome, submitReview } from "@/lib/loop";
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
  const [safetyForOffer, setSafetyForOffer] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [meeting, setMeeting] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>(CANCEL_REASONS[0]);
  const [wrongOpen, setWrongOpen] = useState(false);
  const [outcome, setOutcome] = useState<string>(OUTCOME_REASONS[0].id);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editWhen, setEditWhen] = useState("");

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
  const noResponse = mine && (post.status === "open" || post.status === "expired") && pending.length === 0;
  const canCancel = involved && !["completed", "cancelled", "expired"].includes(post.status);

  const run = async (fn: () => Promise<{ ok: true; data: unknown } | { ok: false; error: string }>, okMsg?: string) => {
    setBusy(true);
    try {
      const res = await fn();
      if (!res.ok) toast.error(res.error);
      else {
        if (okMsg) toast.success(okMsg);
        await reload();
      }
      return res;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
      return { ok: false as const, error: "Something went wrong." };
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
              {post.author.verified ? " · verified" : ""}
            </b>
            <span>
              {post.author.favorsGiven} favors completed · {post.author.reputation}% reliable
            </span>
          </div>
          <span className="chip">{post.lifecycle}</span>
        </div>
        <h1 className="h2" style={{ marginTop: 14 }}>
          {post.title}
        </h1>
        <p>{post.description}</p>
        {post.photoUrl ? <img src={post.photoUrl} alt="" className="post-photo" /> : null}
        <div className="meta">
          <span>{formatDistance(post.distanceKm, post.presence)}</span>
          {formatWalk(post.distanceKm) ? <span>{formatWalk(post.distanceKm)}</span> : null}
          <span>{post.whenNeeded}</span>
          <span>{formatDuration(post.estimatedTime)}</span>
          <span>{post.category}</span>
          <span>{presenceLabel(post.presence)}</span>
          <span className={`chip htype-${post.helpType}`}>{helpTypeLabel(post.helpType)}</span>
          {post.presence === "pickup" && post.destArea ? (
            <span>
              {post.area} → {post.destArea}
            </span>
          ) : post.presence === "online" ? null : (
            <span>
              {post.area}, {post.city}
              {post.radiusKm ? ` · within ${post.radiusKm} km` : ""}
            </span>
          )}
          {post.circleName ? <span>{post.circleName}</span> : null}
        </div>
        <p className="tiny" style={{ marginTop: 10 }}>
          {post.presence === "online"
            ? "This help happens online. No physical address is shared."
            : post.canSeeExact && post.meetingNote
              ? `Meeting point: ${post.meetingNote}`
              : "Approximate area only. Exact meeting details stay private until the requester shares them."}
        </p>
        {post.status === "cancelled" && (
          <p className="tiny" style={{ marginTop: 8 }}>
            Cancelled{post.cancelReason ? ` · ${post.cancelReason}` : ""}.
          </p>
        )}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <IconShield />
          <div>
            <b>Safety</b>
            <div className="tiny">Meet in public when you can. Cancel, report, or block anytime.</div>
          </div>
        </div>
        <button
          className="btn btn-soft btn-block"
          style={{ marginTop: 10 }}
          onClick={() => {
            setSafetyForOffer(false);
            setSafety(true);
          }}
        >
          Safety guidelines
        </button>
      </div>

      {noResponse && (
        <div className="card" style={{ marginTop: 12 }}>
          <b>No one has accepted this favor yet.</b>
          <p className="tiny">You can edit it, ask a wider area, wait, or cancel. Old requests do not stay open forever.</p>
          <div className="row" style={{ marginTop: 10 }}>
            <button
              className="btn btn-soft"
              onClick={() => {
                setEditTitle(post.title);
                setEditWhen(post.whenNeeded);
                setEditOpen(true);
              }}
            >
              Edit request
            </button>
            <button className="btn btn-ghost" disabled={busy} onClick={() => void run(() => expandArea({ data: { id: post.id } }), `Area expanded to ${Math.min(50, (post.radiusKm ?? 12) * 2)} km`)}>
              Expand area
            </button>
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn btn-ghost" disabled={busy} onClick={() => void run(() => reopenPost({ data: { id: post.id } }), "We'll keep this open a little longer.")}>
              Try again later
            </button>
            <button className="btn btn-ghost" onClick={() => setCancelOpen(true)}>
              Cancel request
            </button>
          </div>
        </div>
      )}

      {post.status === "open" && !mine && (
        <div className="row" style={{ marginTop: 12 }}>
          <button
            className="btn btn-primary"
            disabled={busy || !!post.myOfferStatus}
            onClick={() => {
              const inPerson = post.presence === "in_person" || post.presence === "pickup";
              if (inPerson && !window.localStorage.getItem("onegai.safety.inperson")) {
                setSafetyForOffer(true);
                setSafety(true);
                return;
              }
              setConfirm(true);
            }}
          >
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

      {post.status === "open" && mine && pending.length > 0 && (
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn btn-gold" disabled={busy} onClick={() => void run(() => boostPost({ data: { id: post.id } }))}>
            Boost 24h
          </button>
          <button className="btn btn-ghost" onClick={() => setCancelOpen(true)}>
            Cancel request
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
                <button className="btn btn-ghost" disabled={busy} onClick={() => void run(() => decideOffer({ data: { offerId: o.id, action: "decline" } }), "Declined")}>
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

      {involved && post.status !== "open" && post.status !== "cancelled" && post.status !== "expired" && (
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

      {mine && ["accepted", "in_progress"].includes(post.status) && !post.exactShared && (
        <div className="card" style={{ marginTop: 12 }}>
          <b>Share a meeting point</b>
          <p className="tiny">Keep your exact address private until you’re comfortable. A lobby, cafe, or building name is enough.</p>
          <textarea className="textarea" value={meeting} onChange={(e) => setMeeting(e.target.value)} placeholder="Marina mall south entrance, 6 PM" />
          <button className="btn btn-primary btn-block" disabled={busy} onClick={() => void run(() => shareMeeting({ data: { postId: post.id, note: meeting } }), "Meeting point shared")}>
            Share with helper
          </button>
        </div>
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
        <button className="btn btn-soft btn-block" style={{ marginTop: 12 }} disabled={busy} onClick={() => void run(() => requestComplete({ data: { postId: post.id } }), "Asked the requester to confirm")}>
          I've finished — request confirmation
        </button>
      )}

      {mine && (post.status === "accepted" || post.status === "in_progress" || post.status === "pending_confirm") && (
        <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} disabled={busy} onClick={() => void run(() => confirmComplete({ data: { postId: post.id } }), "Favor completed")}>
          Confirm completion
        </button>
      )}

      {involved && ["accepted", "in_progress", "pending_confirm"].includes(post.status) && (
        <div className="row" style={{ marginTop: 12 }}>
          {canCancel && (
            <button className="btn btn-ghost" onClick={() => setCancelOpen(true)}>
              Cancel
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => setWrongOpen(true)}>
            Something went wrong
          </button>
        </div>
      )}

      {post.status === "completed" && involved && other && !post.reviewedByMe && (
        <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => setRate(true)}>
          Rate {other.name}
        </button>
      )}
      {post.status === "completed" && post.reviewedByMe && <p className="tiny" style={{ marginTop: 12 }}>You already reviewed this favor. Trust only moves from completed favors.</p>}

      {post.status === "disputed" && (
        <div className="card" style={{ marginTop: 12 }}>
          <b>This favor is under review</b>
          <p className="tiny">A report was filed. Trust scores do not change on a single accusation.</p>
        </div>
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
                if (!window.confirm(`Block ${other.name}? You won’t be matched or able to message.`)) return;
                void run(() => blockUser({ data: { userId: other.userId, blocked: true } }), "Blocked");
              }}
            >
              Block
            </button>
          </div>
        </div>
      )}

      {post.status === "open" && !mine && (
        <button className="btn btn-ghost btn-block" style={{ marginTop: 12 }} onClick={() => setReportOpen(true)}>
          Report this request
        </button>
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
                  void run(() => offerHelp({ data: { postId: post.id, message: offerMsg } }), "Offer sent").then((res) => {
                    if (res.ok) setConfirm(false);
                  });
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
                <button key={t} className={`chip ${tags.includes(t) ? "on" : ""}`} onClick={() => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))}>
                  {t}
                </button>
              ))}
            </div>
            <textarea className="textarea" placeholder="Optional note" value={text} onChange={(e) => setText(e.target.value)} />
            <div className="row">
              <button className="btn btn-ghost" onClick={() => setRate(false)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                disabled={busy}
                onClick={() =>
                  void run(
                    () => submitReview({ data: { favorId: post.id, toUserId: other.userId, stars, tags, body: text } }),
                    "Thanks. Trust scores only move after real favors.",
                  ).then((res) => {
                    if (res.ok) setRate(false);
                  })
                }
              >
                Submit rating
              </button>
            </div>
          </div>
        </div>
      )}

      {safety && (
        <div className="modal-back" onClick={() => setSafety(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="h2">Meet in person safely</h2>
            <p>Meet safely and only share your exact location when you’re comfortable. Prefer a public meeting point. Cancel, report, or block anytime.</p>
            <button
              className="btn btn-primary btn-block"
              onClick={() => {
                window.localStorage.setItem("onegai.safety.inperson", "1");
                setSafety(false);
                if (safetyForOffer && post.status === "open" && !mine) setConfirm(true);
                setSafetyForOffer(false);
              }}
            >
              I understand
            </button>
          </div>
        </div>
      )}

      {cancelOpen && (
        <div className="modal-back" onClick={() => setCancelOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="h2">Cancel this favor?</h2>
            <p className="tiny">Legitimate cancellations are fine. Repeated last-minute cancellations can affect reliability.</p>
            <div className="filters">
              {CANCEL_REASONS.map((r) => (
                <button key={r} type="button" className={`chip ${cancelReason === r ? "on" : ""}`} onClick={() => setCancelReason(r)}>
                  {r}
                </button>
              ))}
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn btn-ghost" onClick={() => setCancelOpen(false)}>
                Keep it
              </button>
              <button
                className="btn btn-danger"
                disabled={busy}
                onClick={() =>
                  void run(() => cancelPost({ data: { id: post.id, reason: cancelReason } }), "Cancelled").then((res) => {
                    if (res.ok) setCancelOpen(false);
                  })
                }
              >
                Confirm cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {wrongOpen && (
        <div className="modal-back" onClick={() => setWrongOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="h2">Something went wrong</h2>
            <p className="tiny">Tell us what happened. One report does not damage someone’s trust.</p>
            <div className="filters">
              {OUTCOME_REASONS.map((r) => (
                <button key={r.id} type="button" className={`chip ${outcome === r.id ? "on" : ""}`} onClick={() => setOutcome(r.id)}>
                  {r.label}
                </button>
              ))}
            </div>
            <textarea className="textarea" placeholder="Optional details" value={details} onChange={(e) => setDetails(e.target.value)} />
            <div className="row">
              <button className="btn btn-ghost" onClick={() => setWrongOpen(false)}>
                Close
              </button>
              <button
                className="btn btn-danger"
                disabled={busy}
                onClick={() =>
                  void run(() => reportOutcome({ data: { postId: post.id, reason: outcome, details } }), "Report received. A moderator will review.").then((res) => {
                    if (res.ok) setWrongOpen(false);
                  })
                }
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="modal-back" onClick={() => setEditOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="h2">Edit request</h2>
            <input className="input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            <div className="filters" style={{ marginTop: 10 }}>
              {WHEN_OPTS.map((w) => (
                <button key={w} type="button" className={`chip ${editWhen === w ? "on" : ""}`} onClick={() => setEditWhen(w)}>
                  {w}
                </button>
              ))}
            </div>
            <button
              className="btn btn-primary btn-block"
              disabled={busy}
              onClick={() =>
                void run(() => updatePost({ data: { id: post.id, title: editTitle, whenNeeded: editWhen } }), "Request updated").then((res) => {
                  if (res.ok) setEditOpen(false);
                })
              }
            >
              Save
            </button>
          </div>
        </div>
      )}

      {reportOpen && (
        <div className="modal-back" onClick={() => setReportOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="h2">Report {other?.name ?? "this request"}</h2>
            <div className="filters">
              {REPORT_REASONS.map((r) => (
                <button key={r} type="button" className={`chip ${reason === r ? "on" : ""}`} onClick={() => setReason(r)}>
                  {r}
                </button>
              ))}
            </div>
            <textarea className="textarea" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="What happened?" />
            <button
              className="btn btn-danger btn-block"
              disabled={busy}
              onClick={() =>
                void run(
                  () => reportContent({ data: { reportedUserId: other?.userId ?? post.author.userId, postId: post.id, reason, details } }),
                  "Report received.",
                ).then((res) => {
                  if (res.ok) setReportOpen(false);
                })
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
