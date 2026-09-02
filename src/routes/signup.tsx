import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { signInWithGoogle } from "@/lib/google-oauth";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/signup")({ component: Signup });

function Signup() {
  const { user, isPending } = useCurrentUserState();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPending && user) nav({ to: "/onboarding" });
  }, [isPending, user, nav]);

  const submit = async () => {
    setErr(null);
    if (name.trim().length < 2) return setErr("Please add your name.");
    if (password.length < 8) return setErr("Password should be at least 8 characters.");
    setBusy(true);
    try {
      const { error } = await authClient.signUp.email({
        email: email.trim(),
        password,
        name: name.trim(),
      });
      if (error) setErr(error.message ?? "Could not create that account.");
      else nav({ to: "/onboarding" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create that account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <p className="kicker">Join the loop</p>
        <h1 className="h1">Create your account</h1>
        <p className="muted">A real account. 3 starter credits after you finish your profile.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="field" style={{ marginTop: 16 }}>
            <label>Name</label>
            <input className="input" value={name} required onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" value={email} required autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              required
              minLength={8}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {err && <p className="start-err">{err}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={busy || !authEnabled}>
            {busy ? "Creating…" : "Continue"}
          </button>
        </form>
        <div className="start-or">
          <span>or</span>
        </div>
        <div className="row">
          {GROK_PROVIDERS.map((p) => (
            <button
              key={p.providerId}
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => {
                void (async () => {
                  setErr(null);
                  setBusy(true);
                  try {
                    if (p.providerId === "grok-google") {
                      await signInWithGoogle({
                        callbackURL: "/onboarding",
                        errorCallbackURL: "/signup",
                      });
                    } else {
                      await signIn(p.providerId, {
                        callbackURL: "/onboarding",
                        errorCallbackURL: "/signup",
                      });
                    }
                  } catch (e) {
                    setErr(e instanceof Error ? e.message : "Sign-in failed.");
                    setBusy(false);
                  }
                })();
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="tiny" style={{ marginTop: 14 }}>
          Already looping? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
