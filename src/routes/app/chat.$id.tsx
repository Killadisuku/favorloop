import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/avatar";
import { Back } from "@/components/back";
import { getMessages, sendMessage } from "@/lib/loop";
import { confirmComplete, requestComplete } from "@/lib/loop";
import { blockUser, reportContent } from "@/lib/loop";
import { useApi } from "@/lib/use-api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/chat/$id")({ component: Chat });

function Chat() {
  const { id } = Route.useParams();
  const { data, loading, error, reload } = useApi(() => getMessages({ data: { conversationId: id } }), [id]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

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
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="chat-page">
      <Back to="/app/inbox" label={data.other?.name ?? "Chat"} />
      {data.post && (
        <Link className="card" style={{ padding: 12, display: "block" }} to="/app/favor/$id" params={{ id: data.post.id }}>
          <div className="tiny">Request</div>
          <b>{data.post.title}</b>
          <div className="tiny">{data.post.status}</div>
        </Link>
      )}
      <div className="bubbles">
        {data.messages.length === 0 && <p className="tiny">Say hello and confirm a meeting spot.</p>}
        {data.messages.map((m) => (
          <div key={m.id} className={`bubble ${m.mine ? "mine" : ""}`}>
            {m.body}
          </div>
        ))}
      </div>
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
      {data.post && data.post.status !== "completed" && data.post.status !== "cancelled" && (
        <div className="row" style={{ marginTop: 10 }}>
          {data.post.helperId && data.post.authorId === data.other?.userId && data.post.status === "accepted" && (
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
          {data.post.authorId !== data.other?.userId && (data.post.status === "accepted" || data.post.status === "pending_confirm") && (
            <button
              className="btn btn-primary"
              onClick={async () => {
                if (!window.confirm("Confirm this favor is done? Credits will move now.")) return;
                const res = await confirmComplete({ data: { postId: data.post!.id } });
                if (!res.ok) toast.error(res.error);
                else {
                  toast.success("Credits transferred.");
                  void reload();
                }
              }}
            >
              Confirm completion
            </button>
          )}
          {data.other && (
            <button
              className="btn btn-ghost"
              onClick={async () => {
                if (!window.confirm(`Report and block ${data.other?.name}?`)) return;
                await reportContent({ data: { reportedUserId: data.other!.userId, postId: data.post?.id ?? null, reason: "Reported from chat" } });
                await blockUser({ data: { userId: data.other!.userId, blocked: true } });
                toast.success("Reported and blocked.");
              }}
            >
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
    </div>
  );
}
