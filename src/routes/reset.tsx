import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { friendlyAuthError, validatePassword } from "@/lib/auth-errors";
import { authClient } from "@/lib/auth/client";
import { APP_NAME } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/reset")({
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : "",
  }),
  component: Reset,
});

function Reset() {
  const { token } = Route.useSearch();
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!token) {
      setError("This reset link is missing or expired. Request a new one.");
      return;
    }
    const pwErr = validatePassword(password);
    if (pwErr) {
      setError(pwErr);
      return;
    }
    if (password !== confirm) {
      setError("Passwords don’t match.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { error: authErr } = await authClient.resetPassword({ newPassword: password, token });
      if (authErr) throw new Error(authErr.message ?? "Could not reset password");
      toast.success("Password updated. Sign in.");
      nav({ to: "/login", search: { mode: "email" } });
    } catch (e) {
      setError(friendlyAuthError(e));
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
        <h1 className="h1">Set a new password</h1>
        {!token ? (
          <p className="muted">Open the reset link from your email, or request a new one.</p>
        ) : (
          <>
            {error ? <p className="auth-error">{error}</p> : null}
            <div className="field">
              <label htmlFor="rp-password">New password</label>
              <input
                id="rp-password"
                className="input"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="rp-confirm">Confirm password</label>
              <input
                id="rp-confirm"
                className="input"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <button className="btn btn-primary btn-block" type="button" disabled={busy} onClick={() => void submit()}>
              {busy ? "Saving…" : "Update password"}
            </button>
          </>
        )}
        <p className="tiny auth-foot">
          <Link to="/forgot">Request a new link</Link>
          {" · "}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
