import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEffect } from 'react'

const nav = [
  { to: '/admin', label: 'Статистика', icon: '📊' },
  { to: '/admin/users', label: 'Пользователи', icon: '👥' },
  { to: '/admin/payments', label: 'Платежи', icon: '💳' },
  { to: '/admin/tickets', label: 'Тикеты', icon: '💬' },
  { to: '/admin/promo', label: 'Промокоды', icon: '🏷️' },
  { to: '/admin/gifts', label: 'Подарки', icon: '🎁' },
]

export default function AdminLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!user?.isAdmin) navigate('/', { replace: true })
  }, [user])

  if (!user?.isAdmin) return null

  return (
    <div style={{ display: 'flex', minHeight: '100svh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, background: 'rgba(255,255,255,0.02)',
        borderRight: '1px solid var(--border)', padding: '24px 0',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span className="font-display" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '2px', textTransform: 'uppercase' }}>Shebson</span>
          </Link>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Admin Panel</div>
        </div>

        {nav.map(item => {
          const active = item.to === '/admin'
            ? location.pathname === '/admin'
            : location.pathname.startsWith(item.to)
          return (
            <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px', margin: '2px 8px', borderRadius: 8,
                background: active ? 'rgba(220,38,38,0.1)' : 'transparent',
                color: active ? '#f87171' : 'var(--text-secondary)',
                fontSize: '0.875rem', fontWeight: active ? 500 : 400,
                transition: 'all 150ms ease', cursor: 'pointer',
              }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </Link>
          )
        })}

        <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <Link to="/dashboard" style={{ textDecoration: 'none', fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Личный кабинет
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  )
}
