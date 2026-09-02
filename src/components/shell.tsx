import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import type { ProfileMe } from "@/lib/types";
import { Avatar } from "./avatar";
import { IconBell, IconChat, IconCompass, IconHome, IconLoop, IconPlus, IconUser, IconWallet } from "./icons";
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
          <div className="brand-mark">
            <IconLoop size={18} />
          </div>
          <div>
            <div className="brand-name">Onegai</div>
            <div className="brand-tag">Small favors. Real connections.</div>
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
          <Link to="/app/inbox" className={`nav-link ${pathname.startsWith("/app/inbox") || pathname.startsWith("/app/chat") ? "active" : ""}`}>
            <IconChat size={18} />
            Inbox
          </Link>
          <Link to="/app/wallet" className={`nav-link ${pathname.startsWith("/app/wallet") ? "active" : ""}`}>
            <IconWallet size={18} />
            Wallet
          </Link>
        </nav>
        <div className="sidebar-foot">
          <Link to="/app/profile" className="nav-link">
            <Avatar user={me} size="sm" />
            <span>
              {me.name}
              <div className="tiny">{me.available} available</div>
            </span>
          </Link>
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
