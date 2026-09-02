import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { authClient } from "@/lib/auth/client";

export const Route = createFileRoute("/reset")({ component: Reset });

function Reset() {
  const nav = useNavigate();
  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("token") ?? "";
  }, []);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (password.length < 8) return setErr("Password should be at least 8 characters.");
    if (!token) return setErr("This reset link is missing a token. Request a new one.");
    setBusy(true);
    setErr(null);
    try {
      const { error } = await authClient.resetPassword({ newPassword: password, token });
      if (error) setErr(error.message ?? "Could not reset that password.");
      else nav({ to: "/login" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not reset that password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1 className="h1">Set a new password</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="field" style={{ marginTop: 16 }}>
            <label>New password</label>
            <input
              className="input"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {err && <p className="start-err">{err}</p>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Saving…" : "Update password"}
          </button>
        </form>
        <p className="tiny" style={{ marginTop: 14 }}>
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
