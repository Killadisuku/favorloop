import { createFileRoute, Link } from "@tanstack/react-router";
import { listCircles, joinCircle } from "@/lib/loop";
import { useApi } from "@/lib/use-api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/circles")({ component: Circles });

function Circles() {
  const { data, loading, reload } = useApi(() => listCircles(), []);

  const toggle = async (id: string, joined: boolean) => {
    const res = await joinCircle({ data: { circleId: id, join: !joined } });
    if (!res.ok) toast.error(res.error);
    else await reload();
  };

  return (
    <div>
      <p className="kicker">People you already know</p>
      <h1 className="h1">Circles</h1>
      <p className="tiny">Ask your Circle before the wider neighborhood. Membership is private to the group.</p>
      {loading && <div className="skeleton" style={{ height: 120 }} />}
      {!loading && (data ?? []).length === 0 && (
        <div className="card empty">
          <p>No Circles yet.</p>
          <p className="tiny">Circles are buildings, workplaces, and friends. Be the first to join one nearby.</p>
        </div>
      )}
      {(data ?? []).map((c) => (
        <div className="card" key={c.id}>
          <b>{c.name}</b>
          <div className="tiny">
            {c.kind} · {c.city} · {c.memberCount} members
          </div>
          <p className="tiny" style={{ marginTop: 8 }}>
            {c.joined ? "You can post “Ask my Circle” on new requests." : "Join to see Circle-only requests."}
          </p>
          <div className="row" style={{ marginTop: 10 }}>
            <button className={c.joined ? "btn btn-ghost" : "btn btn-primary"} onClick={() => void toggle(c.id, c.joined)}>
              {c.joined ? "Leave" : "Join"}
            </button>
            {c.joined ? (
              <Link className="btn btn-soft" to="/app/post">
                Ask this Circle
              </Link>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
