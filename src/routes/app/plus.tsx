import { createFileRoute } from "@tanstack/react-router";
import { Back } from "@/components/back";
import { getMe, joinPlusWaitlist } from "@/lib/server/profile";
import { useApi } from "@/lib/use-api";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/app/plus")({ component: Plus });

function Plus() {
  const { data: me, reload } = useApi(() => getMe(), []);
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <Back to="/app/profile" />
      <p className="kicker">Optional extras</p>
      <h1 className="h1">Por Favor Plus</h1>
      <p className="muted">The core loop stays free. Plus is for people who want more signal.</p>
      <div className="card">
        <p className="tiny">Free</p>
        <ul>
          <li>Ask and help</li>
          <li>Credits, chat, ratings</li>
          <li>Challenges</li>
        </ul>
      </div>
      <div className="card">
        <p className="tiny">Plus</p>
        <ul>
          <li>Priority discovery</li>
          <li>24-hour boosts</li>
          <li>Reputation analytics</li>
          <li>Exclusive challenges</li>
        </ul>
        <div className="note">
          Payments are not processed in this environment. Joining the waitlist does not charge you and does not unlock Plus.
        </div>
        <button
          className="btn btn-gold btn-block"
          disabled={busy || me?.plusStatus === "waitlisted" || me?.plus}
          onClick={async () => {
            setBusy(true);
            const res = await joinPlusWaitlist();
            setBusy(false);
            toast.message(res.data.message);
            void reload();
          }}
        >
          {me?.plus ? "Plus is active" : me?.plusStatus === "waitlisted" ? "You're on the waitlist" : "Join Plus waitlist"}
        </button>
      </div>
      <div className="card">
        <h2 className="h2">Verified profile</h2>
        <p className="tiny">Identity verification is not available here. We will not mark you verified with a fake check.</p>
      </div>
    </div>
  );
}
