import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useRouterState } from "@tanstack/react-router";
import { getMe } from "@/lib/loop";
import type { ProfileMe } from "@/lib/types";

export function SessionGate({
  children,
}: {
  children: (me: ProfileMe) => ReactNode;
  needOnboarding?: boolean;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [me, setMe] = useState<ProfileMe | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setErr(null);
    getMe()
      .then((res) => {
        if (!live) return;
        if (!res.ok) setErr(res.error);
        else {
          setMe(res.data);
          setErr(null);
        }
      })
      .catch((e: unknown) => {
        if (!live) return;
        setErr(e instanceof Error ? e.message : "Could not load your profile.");
      });
    return () => {
      live = false;
    };
  }, [path]);

  if (err) {
    return (
      <div className="auth-wrap">
        <div className="card auth-card">
          <h1 className="h2">Couldn’t load Onegai</h1>
          <p className="muted">{err}</p>
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
  if (path === "/onboarding") return <Navigate to="/app" />;
  return <>{children(me)}</>;
}
