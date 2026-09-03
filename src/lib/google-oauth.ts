import { authClient, signIn } from "@/lib/auth/client";
import { isSandboxPreviewGuestHost } from "@/lib/preview-embedder-origin";

function hostname(): string {
  if (typeof window === "undefined") return "";
  return window.location.hostname.toLowerCase();
}

function inIframe(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/** Grok live preview — including remint hosts that are not `*.grok-sandbox.com`. */
function inGrokPreview(): boolean {
  const host = hostname();
  if (!host) return false;
  if (isSandboxPreviewGuestHost(host)) return true;
  if (host.includes(".preview.")) return true;
  if (host === "grok.com" || host.endsWith(".grok.com")) return true;
  if (host.includes("grok-sandbox")) return true;
  if (inIframe()) return true;
  return false;
}

function onVercelHost(): boolean {
  return hostname().endsWith(".vercel.app");
}

function isPopupFailure(err: unknown): boolean {
  const m = err instanceof Error ? err.message : String(err ?? "");
  return /popup|pop-up|blocked/i.test(m);
}

function nativeUnusable(message: string | undefined): boolean {
  const m = (message ?? "").toLowerCase();
  if (!m) return true;
  return (
    message === "Social provider google is not configured" ||
    m.includes("provider not found") ||
    m.includes("not configured") ||
    m.includes("invalid_client") ||
    m.includes("unauthorized_client") ||
    m.includes("redirect_uri") ||
    m.includes("oauth") ||
    m.includes("failed to redirect") ||
    m.includes("failed to fetch") ||
    m.includes("network") ||
    m.includes("google sign-in failed")
  );
}

const CONNECT_EMAIL =
  "Google isn’t connected on this site yet. Use email and password, or try again.";

async function redirectWithGrokGoogle(opts: {
  callbackURL: string;
  errorCallbackURL: string;
}): Promise<void> {
  const { data, error } = await authClient.signIn.oauth2({
    providerId: "grok-google",
    callbackURL: opts.callbackURL,
    errorCallbackURL: opts.errorCallbackURL,
  });
  if (error) throw new Error(error.message || CONNECT_EMAIL);
  if (data?.url) {
    window.location.assign(data.url);
    return;
  }
  throw new Error(CONNECT_EMAIL);
}

/**
 * Real Google OAuth via the Grok broker in preview; native Google on Vercel
 * when `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are set. Never fakes success.
 */
export async function signInWithGoogle(opts: {
  callbackURL: string;
  errorCallbackURL: string;
}): Promise<void> {
  // Preview (and anything that isn't Vercel): broker first. Mobile skips the
  // popup path because phone browsers block `window.open` from an iframe.
  if (!onVercelHost() || inGrokPreview()) {
    const usePopup = inGrokPreview() && isSandboxPreviewGuestHost(hostname()) && !isMobile();
    if (usePopup) {
      try {
        await signIn("grok-google", opts);
        return;
      } catch (err) {
        if (!isPopupFailure(err)) throw err;
      }
    }
    await redirectWithGrokGoogle(opts);
    return;
  }

  try {
    const { data, error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: opts.callbackURL,
      errorCallbackURL: opts.errorCallbackURL,
    });
    if (data && typeof data === "object" && "url" in data && typeof data.url === "string" && data.url) {
      window.location.assign(data.url);
      return;
    }
    if (!error) return;
    if (!nativeUnusable(error.message)) {
      throw new Error(error.message);
    }
  } catch (err) {
    if (err instanceof Error && err.message && !nativeUnusable(err.message) && !isPopupFailure(err)) {
      throw err;
    }
  }

  try {
    await redirectWithGrokGoogle(opts);
  } catch {
    throw new Error(CONNECT_EMAIL);
  }
}
