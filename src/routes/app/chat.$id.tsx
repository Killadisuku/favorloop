import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/avatar";
import { Back } from "@/components/back";
import { REPORT_REASONS } from "@/lib/constants";
import { getMessages, sendMessage } from "@/lib/loop";
import { confirmComplete, requestComplete, startFavor } from "@/lib/loop";
import { blockUser, reportContent } from "@/lib/loop";
import { useApi } from "@/lib/use-api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/chat/$id")({ component: Chat });

function Chat() {
  const { id } = Route.useParams();
  const { data, loading, error, reload } = useApi(() => getMessages({ data: { conversationId: id } }), [id]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);

  useEffect(() => {
    const t = window.setInterval(() => void reload(), 4000);
    return () => window.clearInterval(t);
  }, [reload]);

  if (loading && !data) return <div className="skeleton" style={{ height: 200 }} />;
  if (error || !data) {
    return (
      <div>
        <Back to="/app/inbox" />
        <div className="card empty">{error || "Chat not found."}</div>
      </div>
    );
  }

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await sendMessage({ data: { conversationId: id, body: text } });
      if (!res.ok) toast.error(res.error);
      else {
        setText("");
        await reload();
      }
    } catch {
      toast.error("Your message couldn't be sent.");
    } finally {
      setBusy(false);
    }
  };

  const closed = data.post && (data.post.status === "completed" || data.post.status === "cancelled" || data.post.status === "expired");
  const helperHere = data.post?.helperId && data.post.authorId === data.other?.userId;

  return (
    <div className="chat-page">
      <Back to="/app/inbox" label={data.other?.name ?? "Chat"} />
      {data.post && (
        <Link className="card" style={{ padding: 12, display: "block" }} to="/app/favor/$id" params={{ id: data.post.id }}>
          <div className="tiny">This conversation belongs to</div>
          <b>{data.post.title}</b>
          <div className="tiny">{data.post.status.replace("_", " ")}</div>
        </Link>
      )}
      <div className="bubbles">
        {data.messages.length === 0 && (
          <p className="tiny">Say hello. After you accept, the requester can share a meeting point from the favor — keep exact addresses off chat until then.</p>
        )}
        {data.messages.map((m) => (
          <div key={m.id} className={`bubble ${m.mine ? "mine" : ""}`}>
            {m.body}
            <div className="tiny" style={{ opacity: 0.7, marginTop: 4 }}>
              {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        ))}
      </div>
      {closed ? (
        <p className="tiny">This favor is {data.post?.status}. The history stays here.</p>
      ) : (
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <input className="input" value={text} placeholder="Message…" onChange={(e) => setText(e.target.value)} />
          <button className="btn btn-primary" type="submit" disabled={busy || !text.trim()}>
            {busy ? "…" : "Send"}
          </button>
        </form>
      )}
      {data.post && !closed && (
        <div className="row" style={{ marginTop: 10 }}>
          {helperHere && data.post.status === "accepted" && (
            <button
              className="btn btn-ghost"
              onClick={async () => {
                const res = await startFavor({ data: { postId: data.post!.id } });
                if (!res.ok) toast.error(res.error);
                else {
                  toast.success("Marked in progress");
                  void reload();
                }
              }}
            >
              We're starting
            </button>
          )}
          {helperHere && (data.post.status === "accepted" || data.post.status === "in_progress") && (
            <button
              className="btn btn-soft"
              onClick={async () => {
                const res = await requestComplete({ data: { postId: data.post!.id } });
                if (!res.ok) toast.error(res.error);
                else {
                  toast.success("Asked them to confirm.");
                  void reload();
                }
              }}
            >
              I've finished
            </button>
          )}
          {data.post.authorId !== data.other?.userId && (data.post.status === "accepted" || data.post.status === "in_progress" || data.post.status === "pending_confirm") && (
            <button
              className="btn btn-primary"
              onClick={async () => {
                if (!window.confirm("Confirm this favor is done?")) return;
                const res = await confirmComplete({ data: { postId: data.post!.id } });
                if (!res.ok) toast.error(res.error);
                else {
                  toast.success("Favor completed. You can both leave a review.");
                  void reload();
                }
              }}
            >
              Confirm completion
            </button>
          )}
          {data.other && (
            <button className="btn btn-ghost" onClick={() => setReportOpen(true)}>
              Report / Block
            </button>
          )}
        </div>
      )}
      {data.post?.status === "completed" && (
        <Link className="btn btn-primary btn-block" style={{ marginTop: 10 }} to="/app/favor/$id" params={{ id: data.post.id }}>
          Leave a rating
        </Link>
      )}
      {data.other && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
          <Avatar user={data.other} size="sm" />
          <span className="tiny">{data.other.reputation}% trust · chat stays attached to this favor</span>
        </div>
      )}
      {reportOpen && data.other && (
        <div className="modal-back" onClick={() => setReportOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="h2">Report {data.other.name}</h2>
            <div className="filters">
              {REPORT_REASONS.map((r) => (
                <button key={r} type="button" className={`chip ${reason === r ? "on" : ""}`} onClick={() => setReason(r)}>
                  {r}
                </button>
              ))}
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn btn-ghost" onClick={() => setReportOpen(false)}>
                Close
              </button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  const res = await reportContent({ data: { reportedUserId: data.other!.userId, postId: data.post?.id ?? null, reason } });
                  if (!res.ok) toast.error(res.error);
                  else {
                    await blockUser({ data: { userId: data.other!.userId, blocked: true } });
                    toast.success("Reported and blocked.");
                    setReportOpen(false);
                  }
                }}
              >
                Report and block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
