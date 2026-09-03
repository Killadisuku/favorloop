import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GoogleG } from "@/components/google-g";
import { friendlyAuthError, googleCallbackError, validateEmail, validatePassword } from "@/lib/auth-errors";
import { authClient } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { signInWithGoogle } from "@/lib/google-oauth";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>): { error?: string } => ({
    ...(typeof s.error === "string" && s.error ? { error: s.error } : {}),
  }),
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const { user, isPending } = useCurrentUserState();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
      await signInWithGoogle({ callbackURL: "/app", errorCallbackURL: "/signup?error=google" });
    } catch (e) {
      setError(friendlyAuthError(e));
      setBusy(null);
    }
  };

  const onEmail = async () => {
    if (name.trim().length < 2) {
      setError("Please add your name.");
      return;
    }
    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
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
    setBusy("email");
    try {
      const { error: authErr } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      if (authErr) throw new Error(authErr.message ?? "Could not create account");
      toast.success(`Welcome to ${APP_NAME}.`);
      nav({ to: "/onboarding" });
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
        <h1 className="h1">Create account</h1>
        <p className="muted">{APP_TAGLINE}</p>
        {error ? <p className="auth-error">{error}</p> : null}

        <button className="btn btn-google btn-block" type="button" disabled={!!busy} onClick={() => void onGoogle()}>
          <GoogleG />
          {busy === "google" ? "Connecting…" : "Continue with Google"}
        </button>
        <div className="auth-or" role="separator">
          <span>or</span>
        </div>

        <form
          className="auth-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void onEmail();
          }}
        >
          <div className="field">
            <label htmlFor="su-name">Name</label>
            <input id="su-name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="su-email">Email</label>
            <input id="su-email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="su-password">Password</label>
            <input
              id="su-password"
              className="input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="su-confirm">Confirm password</label>
            <input
              id="su-confirm"
              className="input"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={!!busy}>
            {busy === "email" ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="tiny auth-foot">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
