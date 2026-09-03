import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GoogleG } from "@/components/google-g";
import { friendlyAuthError, googleCallbackError, validateEmail } from "@/lib/auth-errors";
import { authClient, authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { signInWithGoogle } from "@/lib/google-oauth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { error?: string; mode?: "email" } => ({
    ...(typeof s.error === "string" && s.error ? { error: s.error } : {}),
    ...(s.mode === "email" ? { mode: "email" as const } : {}),
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"choose" | "email">(search.mode === "email" ? "email" : "choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [error, setError] = useState<string | null>(googleCallbackError(search.error));

  if (isPending) {
    return (
      <div className="auth-wrap">
        <div className="skeleton" style={{ width: 280, height: 160 }} />
      </div>
    );
  }
  if (user) return <Navigate to="/app" />;

  const onGoogle = async () => {
    setError(null);
    setBusy("google");
    try {
      await signInWithGoogle({ callbackURL: "/app", errorCallbackURL: "/login?error=google" });
    } catch (e) {
      setError(friendlyAuthError(e));
      setBusy(null);
    }
  };

  const onEmail = async () => {
    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setError(null);
    setBusy("email");
    try {
      const { error: authErr } = await authClient.signIn.email({ email: email.trim(), password });
      if (authErr) throw new Error(authErr.message ?? "Sign-in failed");
      toast.success("Welcome back.");
      nav({ to: "/app" });
    } catch (e) {
      setError(friendlyAuthError(e));
      setBusy(null);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card auth-sheet">
        <Link to="/" className="auth-brand">
          <img src="/onegai-mark.png" alt="" width={72} height={22} />
          <span>{APP_NAME}</span>
        </Link>
        <h1 className="h1">{APP_NAME}</h1>
        <p className="muted">{APP_TAGLINE}</p>

        {!authEnabled ? (
          <p className="note" style={{ marginTop: 16 }}>
            Sign-in isn’t available in this preview yet.
          </p>
        ) : mode === "choose" ? (
          <>
            {error ? <p className="auth-error">{error}</p> : null}
            <button className="btn btn-google btn-block" type="button" disabled={!!busy} onClick={() => void onGoogle()}>
              <GoogleG />
              {busy === "google" ? "Connecting…" : "Continue with Google"}
            </button>
            <div className="auth-or" role="separator">
              <span>or</span>
            </div>
            <button className="btn btn-primary btn-block" type="button" onClick={() => setMode("email")}>
              Continue with Email
            </button>
          </>
        ) : (
          <form
            className="auth-form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void onEmail();
            }}
          >
            {error ? <p className="auth-error">{error}</p> : null}
            <div className="field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={!!busy}>
              {busy === "email" ? "Signing in…" : "Sign in"}
            </button>
            <button className="btn btn-ghost btn-block" type="button" onClick={() => setMode("choose")}>
              Back
            </button>
          </form>
        )}

        <p className="tiny auth-foot">
          <Link to="/forgot">Forgot password?</Link>
        </p>
        <p className="tiny">
          New to {APP_NAME}? <Link to="/signup">Create account</Link>
        </p>
      </div>
    </div>
  );
}
