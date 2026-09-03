import { createFileRoute, Link } from "@tanstack/react-router";
import { adminAction, getAdmin, getMe } from "@/lib/loop";
import { useApi } from "@/lib/use-api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin")({ component: Admin });

function Admin() {
  const me = useApi(() => getMe(), []);
  const { data, loading, error, reload } = useApi(() => getAdmin(), []);

  const act = async (payload: { action: string; reportId?: string; disputeId?: string; userId?: string; postId?: string; resolution?: string }) => {
    const res = await adminAction({ data: payload });
    if (!res.ok) toast.error(res.error);
    else {
      toast.success("Saved");
      await reload();
    }
  };

  if (me.data && !me.data.admin) {
    return (
      <div className="card empty">
        <p>Admin tools are only for moderators.</p>
        <Link className="btn btn-ghost" to="/app">
          Home
        </Link>
      </div>
    );
  }
  if (loading) return <div className="skeleton" style={{ height: 200 }} />;
  if (error || !data) {
    return (
      <div className="card empty">
        <p>{error || "Could not load moderation."}</p>
        <button className="btn btn-ghost" onClick={() => void reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="kicker">Moderation</p>
      <h1 className="h1">Admin</h1>
      <p className="tiny">Review reports and disputes. Trust does not change from a single accusation.</p>

      <h2 className="h2" style={{ marginTop: 18 }}>
        Reports
      </h2>
      {data.reports.length === 0 && <div className="card empty">No reports yet.</div>}
      {data.reports.map((r) => (
        <div className="card" key={r.id}>
          <b>{r.reason}</b>
          <p className="tiny">
            {r.reporterName} → {r.reportedName ?? "listing"} · {r.status}
            {r.postTitle ? ` · ${r.postTitle}` : ""}
          </p>
          {r.details ? <p className="tiny">{r.details}</p> : null}
          {r.status === "open" && (
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn btn-soft" onClick={() => void act({ action: "review_report", reportId: r.id, resolution: "Reviewed, no further action" })}>
                Review
              </button>
              {r.reportedUserId && (
                <>
                  <button className="btn btn-ghost" onClick={() => void act({ action: "warn_user", userId: r.reportedUserId! })}>
                    Warn
                  </button>
                  <button className="btn btn-danger" onClick={() => void act({ action: "suspend_user", userId: r.reportedUserId! })}>
                    Suspend
                  </button>
                </>
              )}
              {r.postId && (
                <button className="btn btn-ghost" onClick={() => void act({ action: "remove_post", postId: r.postId! })}>
                  Remove listing
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      <h2 className="h2" style={{ marginTop: 18 }}>
        Disputes
      </h2>
      {data.disputes.length === 0 && <div className="card empty">No open disputes.</div>}
      {data.disputes.map((d) => (
        <div className="card" key={d.id}>
          <b>{d.postTitle}</b>
          <p className="tiny">
            {d.reporterName}: {d.reason} · {d.status}
          </p>
          {d.status === "open" && (
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn btn-soft" onClick={() => void act({ action: "resolve_dispute", disputeId: d.id, resolution: "no_fault" })}>
                No fault
              </button>
              <button className="btn btn-ghost" onClick={() => void act({ action: "resolve_dispute", disputeId: d.id, resolution: "helper_fault" })}>
                Helper at fault
              </button>
              <button className="btn btn-ghost" onClick={() => void act({ action: "resolve_dispute", disputeId: d.id, resolution: "requester_fault" })}>
                Requester at fault
              </button>
            </div>
          )}
        </div>
      ))}

      <h2 className="h2" style={{ marginTop: 18 }}>
        Active favors
      </h2>
      {data.activeFavors.length === 0 && <div className="card empty">No active favors.</div>}
      {data.activeFavors.slice(0, 12).map((f) => (
        <Link key={f.id} className="card" to="/app/favor/$id" params={{ id: f.id }} style={{ display: "block" }}>
          <b>{f.title}</b>
          <div className="tiny">
            {f.lifecycle} · {f.author.name}
          </div>
        </Link>
      ))}

      <h2 className="h2" style={{ marginTop: 18 }}>
        People
      </h2>
      {data.users.slice(0, 20).map((u) => (
        <div className="card" key={u.userId} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <b>{u.name}</b>
            <div className="tiny">
              {u.reputation}% trust · {u.favorsGiven} helped
              {u.suspended ? " · suspended" : ""}
              {u.warned ? " · warned" : ""}
            </div>
          </div>
          <div className="row">
            {u.suspended ? (
              <button className="btn btn-soft" onClick={() => void act({ action: "restore_user", userId: u.userId })}>
                Restore
              </button>
            ) : (
              <button className="btn btn-ghost" onClick={() => void act({ action: "suspend_user", userId: u.userId })}>
                Suspend
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
