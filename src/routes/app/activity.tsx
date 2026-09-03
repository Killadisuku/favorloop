import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { relativeTime } from "@/lib/format";
import { listNotifications, markNotificationsRead } from "@/lib/loop";
import { useApi } from "@/lib/use-api";

export const Route = createFileRoute("/app/activity")({ component: Activity });

function Activity() {
  const nav = useNavigate();
  const { data, loading, error, reload } = useApi(() => listNotifications(), []);
  useEffect(() => {
    void markNotificationsRead().then(() => void reload());
  }, []);
  if (loading && !data) return <div className="skeleton" style={{ height: 160 }} />;
  if (error) return <div className="card empty">{error}</div>;
  const items = data?.notifications ?? [];
  return (
    <div>
      <p className="kicker">Updates</p>
      <h1 className="h1">Activity</h1>
      <Link className="btn btn-ghost btn-block" style={{ margin: "12px 0" }} to="/app/inbox">
        Open inbox
      </Link>
      <div className="card activity">
        {items.length === 0 && <p className="empty">No notifications yet. When someone offers help, you’ll see it here.</p>}
        {items.map((a) => {
          const inner = (
            <article>
              <i className={`dot ${a.read ? "read" : ""}`} />
              <div>
                <b>{a.title}</b>
                <p className="tiny">
                  {a.body} · {relativeTime(a.createdAt)}
                </p>
              </div>
            </article>
          );
          return a.href ? (
            <button
              key={a.id}
              type="button"
              className="notif-hit"
              onClick={() => nav({ to: a.href as "/app" })}
            >
              {inner}
            </button>
          ) : (
            <div key={a.id} style={{ padding: "10px 0" }}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
