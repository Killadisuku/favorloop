/**
 * Server functions use the real Better Auth session.
 * Guest cookies were a pause while login was off — they must not bypass auth.
 */
export { authMiddleware as actorMiddleware } from "@/lib/auth/middleware";
