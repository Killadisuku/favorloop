import { createFileRoute, Link } from "@tanstack/react-router";
import { Back } from "@/components/back";
import { Avatar } from "@/components/avatar";
import { IconShield } from "@/components/icons";
import { blockUser, listBlocks } from "@/lib/loop";
import { useApi } from "@/lib/use-api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/safety")({ component: Safety });

function Safety() {
  const { data, reload } = useApi(() => listBlocks(), []);
  return (
    <div>
      <Back to="/app/profile" />
      <h1 className="h1">Safety</h1>
      <div className="card">
        <IconShield />
        <p>
          Por Favor is for small, ordinary help. Never accept tasks that are dangerous, illegal, medical, financial, or that
          ask you to handle someone else's money.
        </p>
        <ul>
          <li>Report and block from any connected favor.</li>
          <li>Cancel a request anytime before completion.</li>
          <li>Credits move only when the requester confirms completion on the server.</li>
          <li>You cannot rate the same favor twice.</li>
        </ul>
        <Link className="btn btn-primary btn-block" to="/app/discover">
          Back to helping
        </Link>
      </div>
      <h2 className="h2" style={{ margin: "18px 0 8px" }}>
        Blocked neighbors
      </h2>
      {(data ?? []).length === 0 && <div className="card empty">You haven't blocked anyone.</div>}
      {(data ?? []).map((p) => (
        <div className="card" key={p.userId} style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Avatar user={p} size="sm" />
          <div style={{ flex: 1 }}>
            <b>{p.name}</b>
            <div className="tiny">@{p.username}</div>
          </div>
          <button
            className="btn btn-ghost"
            onClick={async () => {
              const res = await blockUser({ data: { userId: p.userId, blocked: false } });
              if (!res.ok) toast.error(res.error);
              else {
                toast.success("Unblocked.");
                void reload();
              }
            }}
          >
            Unblock
          </button>
        </div>
      ))}
    </div>
  );
}
