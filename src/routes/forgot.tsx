import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { friendlyAuthError, validateEmail } from "@/lib/auth-errors";
import { authClient } from "@/lib/auth/client";
import { APP_NAME } from "@/lib/constants";

export const Route = createFileRoute("/forgot")({ component: Forgot });

type ResetRequestClient = {
  requestPasswordReset: (args: {
    email: string;
    redirectTo: string;
  }) => Promise<{ error: { message?: string } | null }>;
};

function Forgot() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { error: authErr } = await (authClient as unknown as ResetRequestClient).requestPasswordReset({
        email: email.trim(),
        redirectTo: `${window.location.origin}/reset`,
      });
      if (authErr) {
        const msg = (authErr.message ?? "").toLowerCase();
        if (msg.includes("not found") || msg.includes("disabled") || msg.includes("not configured") || msg.includes("send") || msg.includes("isn't enabled") || msg.includes("isn’t enabled")) {
          setError("Password reset email isn’t set up on this deployment yet. Sign in with Google if that account is linked, or create a new email sign-in.");
        } else {
          throw new Error(authErr.message ?? "Could not send reset email");
        }
        return;
      }
      setSent(true);
    } catch (e) {
      const msg = friendlyAuthError(e);
      const low = msg.toLowerCase();
      if (low.includes("isn't enabled") || low.includes("isn’t enabled") || low.includes("not configured") || low.includes("disabled")) {
        setError("Password reset email isn’t set up on this deployment yet. Sign in with Google if that account is linked, or create a new email sign-in.");
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card auth-sheet">
        <Link to="/" className="auth-brand">
          <img src="/onegai-mark.png" alt="" width={72} height={22} />
          <span>{APP_NAME}</span>
        </Link>
        <h1 className="h1">Forgot password?</h1>
        {sent ? (
          <p className="muted">If that email is on an Onegai account, you’ll get a reset link. Check your inbox.</p>
        ) : (
          <>
            <p className="muted">We’ll send a reset link if that email is registered.</p>
            {error ? <p className="auth-error">{error}</p> : null}
            <div className="field">
              <label htmlFor="fp-email">Email</label>
              <input id="fp-email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-block" type="button" disabled={busy} onClick={() => void submit()}>
              {busy ? "Sending…" : "Send reset link"}
            </button>
          </>
        )}
        <p className="tiny auth-foot">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}