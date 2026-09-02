import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/forgot")({ component: Forgot });

function Forgot() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      setErr(
        "Password reset email is not available here — this app has no mail provider. Sign in with Google or X if you used those, or change your password from Settings after you sign in.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <p className="kicker">Account</p>
        <h1 className="h1">Forgot password</h1>
        <p className="muted">If email reset is configured, we'll send a link. Signed-in users can also change a password in Settings.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="field" style={{ marginTop: 16 }}>
            <label>Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {err && <p className="start-err">{err}</p>}
          {msg && <p className="start-hint">{msg}</p>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Checking…" : "Send reset link"}
          </button>
        </form>
        <p className="tiny" style={{ marginTop: 14 }}>
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
