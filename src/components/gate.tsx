import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useRouterState } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { APP_NAME } from "@/lib/constants";
import { adoptSession, getMe } from "@/lib/loop";
import type { ProfileMe } from "@/lib/types";

export function SessionGate({
  children,
}: {
  children: (me: ProfileMe) => ReactNode;
  needOnboarding?: boolean;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, isPending } = useCurrentUserState();
  const [me, setMe] = useState<ProfileMe | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setMe(null);
      setErr(null);
      return;
    }
    let live = true;
    setErr(null);
    void (async () => {
      const adopted = await adoptSession({
        data: {
          userId: user.id,
          name: user.displayName,
          email: user.primaryEmail,
          photoUrl: user.profileImageUrl,
        },
      });
      if (!live) return;
      if (!adopted.ok) {
        setErr(adopted.error);
        return;
      }
      const res = await getMe();
      if (!live) return;
      if (!res.ok) setErr(res.error);
      else setMe(res.data);
    })().catch((e: unknown) => {
      if (!live) return;
      setErr(e instanceof Error ? e.message : "Could not load your profile.");
    });
    return () => {
      live = false;
    };
  }, [user?.id, isPending, path]);

  if (isPending) {
    return (
      <div className="auth-wrap">
        <div className="skeleton" style={{ width: 280, height: 120 }} />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (err) {
    return (
      <div className="auth-wrap">
        <div className="card auth-card">
          <h1 className="h2">Couldn’t load {APP_NAME}</h1>
          <p className="muted">{err}</p>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (!me) {
    return (
      <div className="auth-wrap">
        <div className="skeleton" style={{ width: 280, height: 120 }} />
      </div>
    );
  }
  if (!me.onboardingComplete && path !== "/onboarding") return <Navigate to="/onboarding" />;
  if (me.onboardingComplete && path === "/onboarding") return <Navigate to="/app" />;
  return <>{children(me)}</>;
}
