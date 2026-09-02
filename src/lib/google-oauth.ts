import { authClient, signIn } from "@/lib/auth/client";

function inLivePreview(): boolean {
  return (
    typeof window !== "undefined" &&
    window.location.hostname.endsWith(".grok-sandbox.com")
  );
}

/** Google: Grok broker in the live preview, native Google OAuth on Vercel. */
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
  if (error) {
    throw new Error(
      error.message === "Social provider google is not configured" ||
        error.message?.toLowerCase().includes("not found")
        ? "Google isn’t connected yet. Use email and password, or add Google OAuth in Vercel."
        : (error.message ?? "Google sign-in failed."),
    );
  }
}
