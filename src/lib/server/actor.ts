import { createMiddleware } from "@tanstack/react-start";

const GUEST_COOKIE = "pf_guest";

function newGuestId() {
  return `guest_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

/**
 * Same as auth middleware when a session exists; otherwise a stable guest id
 * in a cookie so the app works while sign-in is paused.
 */
export const actorMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getBearerToken } = await import("@/lib/auth/client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
    const { requireUserId, UnauthorizedError } = await import("@/lib/auth/verify.server");
    const { getCookie, setCookie } = await import("@tanstack/react-start/server");
    assertSameSiteRequest();
    try {
      const userId = await requireUserId(context.bearerToken);
      return next({ context: { userId } });
    } catch (e) {
      if (!(e instanceof UnauthorizedError)) throw e;
      let guest = getCookie(GUEST_COOKIE);
      if (!guest || !guest.startsWith("guest_")) {
        guest = newGuestId();
        setCookie(GUEST_COOKIE, guest, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
        });
      }
      return next({ context: { userId: guest } });
    }
  });
