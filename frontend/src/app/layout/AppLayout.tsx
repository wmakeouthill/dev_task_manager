import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useCurrentUser } from '@/features/dashboard'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: user } = useCurrentUser()

  return (
    <div className="app-layout">
      <aside
        className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}
        aria-label="Navegação"
      >
        {/* User section */}
        <div className="sidebar-user">
          {user?.avatarBase64 ? (
            <img
              src={`data:image/png;base64,${user.avatarBase64}`}
              alt={user.displayName}
              className="sidebar-avatar"
            />
          ) : (
            <div className="sidebar-avatar sidebar-avatar-placeholder">
              {(user?.displayName ?? 'D')[0].toUpperCase()}
            </div>
          )}
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.displayName ?? 'Dev'}</span>
            <span className="sidebar-user-role">Developer</span>
          </div>
        </div>

        <nav className="app-sidebar-nav">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `app-sidebar-link ${isActive ? 'active' : ''}`
            }
            end
            onClick={() => setSidebarOpen(false)}
          >
            🏠 Início
          </NavLink>
          <NavLink
            to="/boards"
            className={({ isActive }) =>
              `app-sidebar-link ${isActive ? 'active' : ''}`
            }
            onClick={() => setSidebarOpen(false)}
          >
            📋 Boards
          </NavLink>
          <NavLink
            to="/reminders"
            className={({ isActive }) =>
              `app-sidebar-link ${isActive ? 'active' : ''}`
            }
            onClick={() => setSidebarOpen(false)}
          >
            🔔 Lembretes
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <span className="sidebar-app-name">Dev Task Manager</span>
          <span className="sidebar-version">v0.1.0</span>
        </div>
      </aside>

      <div className="app-content">
        <header className="app-header">
          <button
            type="button"
            className="btn btn-ghost btn-icon sidebar-toggle"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={sidebarOpen}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="section-title" style={{ margin: 0 }}>
            Dev Task Manager
          </span>
        </header>

        <main className="app-main">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Fechar menu"
        />
      )}
    </div>
  )
}
