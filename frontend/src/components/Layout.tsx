import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'
import Logo from './Logo'
import s from './Layout.module.css'

const navItems = [
  { to: '/',          label: 'Timer',       icon: '⏱' },
  { to: '/dashboard', label: 'Dashboard',   icon: '▦' },
  { to: '/sessions',  label: 'Sessions',    icon: '≡' },
  { to: '/insights',  label: 'Insights IA', icon: '✦' },
  { to: '/group',     label: 'Groupe',      icon: '👥' },
  { to: '/search',    label: 'Rechercher',  icon: '🔍' },
  { to: '/profile',   label: 'Profil',      icon: '👤' },
  { to: '/about',     label: 'À propos',    icon: 'ℹ' },
]

// Only the 5 most-used pages live in the bottom tab bar on mobile
const bottomItems = [
  { to: '/',          label: 'Timer',    icon: '⏱' },
  { to: '/dashboard', label: 'Stats',    icon: '▦' },
  { to: '/group',     label: 'Groupe',   icon: '👥' },
  { to: '/search',    label: 'Chercher', icon: '🔍' },
  { to: '/profile',   label: 'Profil',   icon: '👤' },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const { theme, toggle } = useThemeStore()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const closeDrawer = () => setDrawerOpen(false)

  return (
    <div className={s.shell}>

      {/* Mobile overlay — tap to close drawer */}
      {drawerOpen && (
        <div className={s.overlay} onClick={closeDrawer} />
      )}

      {/* Sidebar — desktop always visible, mobile slides in as drawer */}
      <aside className={`${s.sidebar} ${drawerOpen ? s.sidebarOpen : ''}`}>
        <div className={s.brand}>
          <Logo size={36} />
          <span className={s.brandName}>StudyFlow</span>
          {/* Close button visible only on mobile */}
          <button className={s.drawerClose} onClick={closeDrawer} aria-label="Fermer">✕</button>
        </div>

        <nav className={s.nav}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={closeDrawer}
              className={({ isActive }) => `${s.navItem} ${isActive ? s.navActive : ''}`}
            >
              <span className={s.navIcon}>{item.icon}</span>
              <span className={s.navLabel}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={s.footer}>
          <button className={s.themeToggle} onClick={toggle} title="Changer le thème">
            <span className={s.themeIcon}>{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span className={s.themeLabel}>{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>
          </button>
          <div className={s.userInfo}>
            <div className={s.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div className={s.userName}>{user?.name}</div>
              <div className={s.userEmail}>{user?.email}</div>
            </div>
          </div>
          <button className={s.logoutBtn} onClick={logout}>Déconnexion</button>
        </div>
      </aside>

      {/* Right side: mobile top bar + main content */}
      <div className={s.content}>
        {/* Mobile-only top bar */}
        <header className={s.mobileHeader}>
          <button className={s.hamburger} onClick={() => setDrawerOpen(true)} aria-label="Menu">
            <span /><span /><span />
          </button>
          <div className={s.mobileBrand}>
            <Logo size={26} />
            <span className={s.mobileBrandName}>StudyFlow</span>
          </div>
          <button className={s.mobileTheme} onClick={toggle} aria-label="Thème">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </header>

        <main className={s.main}>
          <Outlet />
        </main>
      </div>

      {/* Bottom tab bar — mobile only */}
      <nav className={s.bottomNav}>
        {bottomItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `${s.bottomNavItem} ${isActive ? s.bottomNavActive : ''}`}
          >
            <span className={s.bottomNavIcon}>{item.icon}</span>
            <span className={s.bottomNavLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  )
}
