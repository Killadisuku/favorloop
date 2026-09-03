/** User-facing auth copy. Never surface secrets, tokens, or stack traces. */

export function friendlyAuthError(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : typeof err === "object" && err && "message" in err && typeof (err as { message: unknown }).message === "string"
          ? (err as { message: string }).message
          : "";
  const m = raw.toLowerCase();
  if (!raw) return "Something went wrong. Please try again.";
  if (m.includes("popup blocked")) return "Allow pop-ups to continue with Google.";
  if (m.includes("cancel") || m.includes("closed") || m.includes("dismiss")) return "Google sign-in was cancelled.";
  if (m.includes("invalid email or password") || m.includes("invalid password") || m.includes("invalid credentials") || m.includes("invalid email"))
    return "That email or password doesn’t match.";
  if (m.includes("user not found") || m.includes("no user")) return "No Onegai account uses that email. Create an account, or continue with Google.";
  if (m.includes("already exists") || m.includes("user already") || m.includes("email already"))
    return "An account with that email already exists. Sign in, or continue with Google if that’s how you registered.";
  if (m.includes("account_not_linked") || m.includes("not linked"))
    return "This sign-in is already connected to another Onegai account. Use the original method.";
  if (m.includes("already linked")) return "That Google account is already connected to Onegai. Continue with Google instead.";
  if (m.includes("not configured") || m.includes("isn’t connected") || m.includes("provider") && m.includes("not found"))
    return "Google isn’t connected on this deployment yet. Use email, or add Google OAuth in the host environment.";
  if (m.includes("invalid origin") || m.includes("csrf") || m.includes("forbidden"))
    return "This sign-in request didn’t come from Onegai. Open the app and try again.";
  if (m.includes("expired") && (m.includes("session") || m.includes("token"))) return "Your session expired. Please sign in again.";
  if (m.includes("reset password") && (m.includes("isn't enabled") || m.includes("isn’t enabled") || m.includes("disabled")))
    return "Password reset email isn’t set up on this deployment yet. Sign in with Google if that account is linked.";
  if (m.includes("network") || m.includes("failed to fetch") || m.includes("load failed") || m.includes("timeout"))
    return "Couldn’t reach Onegai. Check your connection and try again.";
  if (m.includes("password") && (m.includes("short") || m.includes("least") || m.includes("weak") || m.includes("8")))
    return "Use a stronger password (at least 8 characters, with letters and numbers).";
  if (m.includes("secret") || m.includes("token") || m.includes("stack") || m.includes("sql") || m.includes("postgres") || m.includes("client_secret"))
    return "Sign-in didn’t work. Please try again.";
  return raw.length < 140 ? raw : "Sign-in didn’t work. Please try again.";
}

export function validateEmail(email: string): string | null {
  const v = email.trim();
  if (!v) return "Enter your email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return "Use letters and numbers in your password.";
  return null;
}
