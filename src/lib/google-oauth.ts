import { authClient, signIn } from "@/lib/auth/client";

function inLivePreview(): boolean {
  return (
    typeof window !== "undefined" &&
    window.location.hostname.endsWith(".grok-sandbox.com")
  );
}

function nativeGoogleMissing(message: string | undefined): boolean {
  const m = (message ?? "").toLowerCase();
  return (
    message === "Social provider google is not configured" ||
    m.includes("provider not found") ||
    (m.includes("google") && m.includes("not configured"))
  );
}

/** Google: Grok broker in the live preview, native Google OAuth on Vercel when configured. */
export async function signInWithGoogle(opts: {
  callbackURL: string;
  errorCallbackURL: string;
}): Promise<void> {
  if (inLivePreview()) {
    await signIn("grok-google", opts);
    return;
  }
  const { error } = await authClient.signIn.social({
    provider: "google",
    callbackURL: opts.callbackURL,
    errorCallbackURL: opts.errorCallbackURL,
  });
  if (!error) return;
  if (nativeGoogleMissing(error.message)) {
    try {
      await signIn("grok-google", opts);
      return;
    } catch {
      throw new Error("Google isn’t connected yet. Use email and password, or add Google OAuth in Vercel.");
    }
  }
  throw new Error(error.message ?? "Google sign-in failed.");
}