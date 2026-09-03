import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import type { ProfileMe } from "@/lib/types";
import { Avatar } from "./avatar";
import { SignOutBtn } from "./sign-out-btn";
import { IconBell, IconChat, IconCompass, IconHome, IconPlus, IconShield, IconUser, IconWallet } from "./icons";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { SessionGate } from "./gate";

const items = [
  { to: "/app", label: "Home", icon: IconHome, end: true },
  { to: "/app/discover", label: "Discover", icon: IconCompass },
  { to: "/app/post", label: "Post", icon: IconPlus },
  { to: "/app/activity", label: "Activity", icon: IconBell },
  { to: "/app/profile", label: "Profile", icon: IconUser },
] as const;

function ShellInner({ me }: { me: ProfileMe }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-mark-img" src="/onegai-mark.png" alt="" width={48} height={28} />
          <div>
            <div className="brand-name">{APP_NAME}</div>
            <div className="brand-tag">{APP_TAGLINE}</div>
          </div>
        </div>
        <nav>
          {items.map((it) => {
            const active = it.to === "/app" ? pathname === "/app" : pathname.startsWith(it.to);
            return (
              <Link key={it.to} to={it.to} className={`nav-link ${active ? "active" : ""}`}>
                <it.icon size={18} />
                {it.label}
              </Link>
            );
          })}
          <Link to="/app/help" className={`nav-link ${pathname.startsWith("/app/help") ? "active" : ""}`}>
            <IconCompass size={18} />
            I can help
          </Link>
          <Link to="/app/circles" className={`nav-link ${pathname.startsWith("/app/circles") ? "active" : ""}`}>
            <IconUser size={18} />
            Circles
          </Link>
          <Link to="/app/inbox" className={`nav-link ${pathname.startsWith("/app/inbox") || pathname.startsWith("/app/chat") ? "active" : ""}`}>
            <IconChat size={18} />
            Inbox
          </Link>
          <Link to="/app/wallet" className={`nav-link ${pathname.startsWith("/app/wallet") ? "active" : ""}`}>
            <IconWallet size={18} />
            Wallet
          </Link>
          <Link to="/app/safety" className={`nav-link ${pathname.startsWith("/app/safety") ? "active" : ""}`}>
            <IconShield size={18} />
            Safety
          </Link>
          {me.admin ? (
            <Link to="/app/admin" className={`nav-link ${pathname.startsWith("/app/admin") ? "active" : ""}`}>
              <IconShield size={18} />
              Admin
            </Link>
          ) : null}
        </nav>
        <div className="sidebar-foot">
          <Link to="/app/profile" className="nav-link">
            <Avatar user={me} size="sm" />
            <span>
              {me.name}
              <div className="tiny">{me.available} available</div>
            </span>
          </Link>
          <SignOutBtn className="btn btn-ghost btn-block" />
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
      <nav className="bottom-nav">
        {items.map((it) => {
          const active = it.to === "/app" ? pathname === "/app" : pathname.startsWith(it.to);
          if (it.to === "/app/post") {
            return (
              <Link key={it.to} to={it.to} className={active ? "active" : ""}>
                <span className="post-fab">
                  <IconPlus />
                </span>
              </Link>
            );
          }
          return (
            <Link key={it.to} to={it.to} className={active ? "active" : ""}>
              <it.icon size={20} />
              {it.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function AppShell() {
  return <SessionGate>{(me) => <ShellInner me={me} />}</SessionGate>;
}
