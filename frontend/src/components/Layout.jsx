import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const isActive = (path) => location.pathname === path
  const close = () => setMenuOpen(false)

  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(8,8,15,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <Link to="/" onClick={close} style={{ textDecoration: 'none' }}>
            <span className="font-display" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '2px', textTransform: 'uppercase' }}>Shebson</span>
          </Link>

          {/* Desktop */}
          <div className="nav-desktop">
            {user ? (
              <>
                <NavLink to="/dashboard" active={isActive('/dashboard')}>Личный кабинет</NavLink>
                <NavLink to="/buy" active={isActive('/buy')}>Тарифы</NavLink>
                <NavLink to="/support" active={isActive('/support')}>Поддержка</NavLink>
                {user?.isAdmin && <NavLink to="/admin" active={location.pathname.startsWith('/admin')}>Админ</NavLink>}
                <button onClick={handleLogout} className="btn btn-ghost" style={{ marginLeft: 8, padding: '6px 14px', fontSize: '0.8125rem' }}>
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login"><button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '0.8125rem' }}>Войти</button></Link>
                <Link to="/register"><button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8125rem' }}>Начать</button></Link>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="nav-hamburger btn btn-ghost"
            onClick={() => setMenuOpen(v => !v)}
            style={{ padding: '6px 10px' }}
            aria-label="Меню"
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="16" x2="21" y2="16"/>
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`nav-mobile-menu${menuOpen ? ' open' : ''}`}>
          {user ? (
            <>
              <MobileNavLink to="/dashboard" active={isActive('/dashboard')} onClick={close}>Личный кабинет</MobileNavLink>
              <MobileNavLink to="/buy" active={isActive('/buy')} onClick={close}>Тарифы</MobileNavLink>
              <MobileNavLink to="/support" active={isActive('/support')} onClick={close}>Поддержка</MobileNavLink>
              {user?.isAdmin && <MobileNavLink to="/admin" active={location.pathname.startsWith('/admin')} onClick={close}>Админ</MobileNavLink>}
              <button onClick={handleLogout} className="btn btn-ghost" style={{ marginTop: 8, width: '100%', padding: '10px', fontSize: '0.875rem' }}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <MobileNavLink to="/login" active={isActive('/login')} onClick={close}>Войти</MobileNavLink>
              <Link to="/register" onClick={close}>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 8, padding: '10px', fontSize: '0.875rem' }}>Начать</button>
              </Link>
            </>
          )}
        </div>
      </nav>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0 }}>
          © {new Date().getFullYear()} Shebson. Все права защищены.
        </p>
      </footer>
    </div>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <span style={{
        fontSize: '0.875rem',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        padding: '6px 12px',
        borderRadius: 6,
        transition: 'color 150ms ease',
        display: 'block',
      }}>
        {children}
      </span>
    </Link>
  )
}

function MobileNavLink({ to, active, onClick, children }) {
  return (
    <Link to={to} onClick={onClick} style={{ textDecoration: 'none' }}>
      <div style={{
        padding: '12px 12px',
        borderRadius: 8,
        fontSize: '0.9375rem',
        fontWeight: 500,
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
        borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
      }}>
        {children}
      </div>
    </Link>
  )
}
