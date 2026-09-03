import { useState, useSyncExternalStore } from "react";
import { signOut } from "@/lib/auth/client";
import { hasGateSessionMarker } from "@/lib/auth/gate-session-marker";
import { toast } from "sonner";

const subscribeToNothing = () => () => {};

export function SignOutBtn({ className = "btn btn-ghost" }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  const gateSession = useSyncExternalStore(subscribeToNothing, hasGateSessionMarker, () => false);
  if (gateSession) return null;
  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void signOut("/login").catch(() => {
          toast.error("Couldn’t sign out. Try again.");
          setBusy(false);
        });
      }}
    >
      {busy ? "Signing out…" : "Log out"}
    </button>
  );
}
