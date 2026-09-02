import { createFileRoute, Link } from "@tanstack/react-router";
import { Avatar } from "@/components/avatar";
import { relativeTime } from "@/lib/format";
import { archiveConversation, listInbox } from "@/lib/server/social";
import { useApi } from "@/lib/use-api";

export const Route = createFileRoute("/app/inbox")({ component: Inbox });

function Inbox() {
  const { data, loading, error, reload } = useApi(() => listInbox(), []);
  if (loading) return <div className="skeleton" style={{ height: 160 }} />;
  if (error) return <div className="card empty">{error}</div>;
  const rows = data ?? [];
  return (
    <div>
      <p className="kicker">Messages</p>
      <h1 className="h1">Inbox</h1>
      {rows.length === 0 && <div className="card empty">No conversations yet. Accept an offer to start chatting.</div>}
      {rows.map((c) => (
        <div key={c.id} className="card" style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link to="/app/chat/$id" params={{ id: c.id }} style={{ display: "flex", gap: 12, alignItems: "center", flex: 1, minWidth: 0 }}>
            {c.other ? <Avatar user={c.other} /> : <span className="avatar" />}
            <div style={{ minWidth: 0 }}>
              <b>
                {c.other?.name ?? "Neighbor"}
                {c.unread ? ` · ${c.unread}` : ""}
              </b>
              <div className="tiny" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.postTitle ?? "Chat"} · {c.lastMessage ?? "No messages"} {c.lastAt ? `· ${relativeTime(c.lastAt)}` : ""}
              </div>
            </div>
          </Link>
          <button
            className="btn btn-ghost"
            onClick={async () => {
              await archiveConversation({ data: { conversationId: c.id } });
              void reload();
            }}
          >
            Hide
          </button>
        </div>
      ))}
    </div>
  );
}
