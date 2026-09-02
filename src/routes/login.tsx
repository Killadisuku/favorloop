import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { signInWithGoogle } from "@/lib/google-oauth";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { IconLoop } from "@/components/icons";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPending && user) nav({ to: "/app" });
  }, [isPending, user, nav]);

  const emailSignIn = async () => {
    setErr(null);
    setBusy(true);
    try {
      const { error } = await authClient.signIn.email({ email: email.trim(), password });
      if (error) setErr(error.message ?? "Could not sign in. Check your email and password.");
      else nav({ to: "/app" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  const oauth = async (providerId: string) => {
    setErr(null);
    setBusy(true);
    try {
      if (providerId === "grok-google") {
        await signInWithGoogle({ callbackURL: "/app", errorCallbackURL: "/login" });
      } else {
        await signIn(providerId, { callbackURL: "/app", errorCallbackURL: "/login" });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign-in failed.");
      setBusy(false);
    }
  };

  if (isPending) {
    return (
      <div className="auth-wrap">
        <div className="skeleton" style={{ width: 280, height: 120 }} />
      </div>
    );
  }

  return (
    <div className="start-screen">
      <header className="start-top">
        <div className="start-brand">
          <div className="start-mark">
            <IconLoop size={18} />
          </div>
          <div>
            <div className="start-name">Por Favor</div>
            <div className="start-tag">Your time is currency</div>
          </div>
        </div>
        <Link to="/" className="tiny">
          Home
        </Link>
      </header>

      <h1 className="start-title">Let's get started</h1>
      <p className="start-quiet">Don't have an account?</p>
      <Link className="start-register" to="/signup">
        Register now
      </Link>

      <form
        className="start-form"
        onSubmit={(e) => {
          e.preventDefault();
          void emailSignIn();
        }}
      >
        <label className="start-label">Email</label>
        <input
          className="start-input"
          value={email}
          autoComplete="username"
          type="email"
          required
          placeholder="you@email.com"
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className="start-label">Password</label>
        <div className="start-pass">
          <input
            className="start-input"
            type={show ? "text" : "password"}
            value={password}
            autoComplete="current-password"
            required
            placeholder="Your password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="start-eye" type="button" onClick={() => setShow((s) => !s)} aria-label="Show password">
            {show ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {err && <p className="start-err">{err}</p>}
        <button className="start-signin" type="submit" disabled={busy || !authEnabled}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <Link className="start-forgot" to="/forgot">
        Forgot password?
      </Link>

      <div className="start-or">
        <span>or sign in using</span>
      </div>
      <div className="start-socials">
        {authEnabled ? (
          GROK_PROVIDERS.map((p) => (
            <button
              key={p.providerId}
              type="button"
              className="start-soc"
              aria-label={p.label}
              disabled={busy}
              onClick={() => void oauth(p.providerId)}
            >
              {p.label === "Google" ? <GoogleMark /> : <XMark />}
            </button>
          ))
        ) : (
          <p className="tiny">Sign-in is disabled.</p>
        )}
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.1 0 9.8-2 13.3-5.2l-6.1-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-3.2 5.2-5.9 6.6l6.1 5.2C38.2 37.3 44 32 44 24c0-1.3-.1-2.5-.4-3.5z" />
    </svg>
  );
}

function XMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.2 2H21l-6.5 7.4L22 22h-6.8l-4.7-6.2L5.2 22H2.4l7-8L2 2h7l4.2 5.6L18.2 2zm-1.2 18h1.9L7.1 3.9H5.1L17 20z" />
    </svg>
  );
}
