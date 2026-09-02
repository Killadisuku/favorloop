import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  IconBell,
  IconCompass,
  IconHome,
  IconLoop,
  IconPlus,
  IconUser,
  IconWallet,
} from './icons'
import { useStore } from './store'
import { Avatar } from './ui'

const items = [
  { to: '/app', label: 'Home', icon: IconHome, end: true },
  { to: '/app/discover', label: 'Discover', icon: IconCompass },
  { to: '/app/post', label: 'Post', icon: IconPlus },
  { to: '/app/activity', label: 'Activity', icon: IconBell },
  { to: '/app/profile', label: 'Profile', icon: IconUser },
]

export function Layout() {
  const { me } = useStore()
  const loc = useLocation()
  const unread = useStore().state.activity.filter((a) => a.userId === me?.id && !a.read).length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <IconLoop size={18} />
          </div>
          <div>
            <div className="brand-name">Por Favor</div>
            <div className="brand-tag">Your time is currency.</div>
          </div>
        </div>
        <nav>
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <it.icon size={18} />
              {it.label}
              {it.label === 'Activity' && unread > 0 && (
                <span className="chip gold" style={{ marginLeft: 'auto' }}>
                  {unread}
                </span>
              )}
            </NavLink>
          ))}
          <NavLink
            to="/wallet"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <IconWallet size={18} />
            Wallet
          </NavLink>
        </nav>
        {me && (
          <div className="sidebar-foot">
            <NavLink to="/app/profile" className="nav-link">
              <Avatar user={me} size="sm" />
              <span>
                {me.name}
                <div className="tiny">{me.balance} Favors</div>
              </span>
            </NavLink>
          </div>
        )}
      </aside>
      <main className="main">
        <Outlet />
      </main>
      <nav className="bottom-nav">
        {items.map((it) => {
          const active =
            it.end ? loc.pathname === '/app' : loc.pathname.startsWith(it.to)
          if (it.to === '/app/post') {
            return (
              <NavLink key={it.to} to={it.to} className={active ? 'active' : ''}>
                <span className="post-fab">
                  <IconPlus />
                </span>
              </NavLink>
            )
          }
          return (
            <NavLink key={it.to} to={it.to} end={it.end} className={active ? 'active' : ''}>
              <it.icon size={20} />
              {it.label}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
