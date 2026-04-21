import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import client from '../api/client'

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function BackButton({ to, children }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className="btn btn-ghost"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: '0.8125rem', marginBottom: 24 }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      {children}
    </button>
  )
}

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  if (!token) return (
    <div style={{ minHeight: 'calc(100svh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ padding: '40px 36px', maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <p style={{ color: '#f87171', marginBottom: 16 }}>Недействительная ссылка</p>
        <BackButton to="/login">На страницу входа</BackButton>
      </div>
    </div>
  )

  const submit = async (e) => {
    e.preventDefault()
    if (password.length < 8) { setError('Минимум 8 символов'); return }
    setLoading(true)
    setError('')
    try {
      await client.post('/auth/reset-password', { token, newPassword: password })
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.error ?? 'Ссылка недействительна или истекла')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: 'calc(100svh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 400, padding: '40px 36px' }}>
        {done ? (
          <>
            <div style={{ fontSize: '2rem', marginBottom: 16 }}>✅</div>
            <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>Пароль изменён</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Перенаправляем на страницу входа…</p>
          </>
        ) : (
          <>
            <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>Новый пароль</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 28 }}>Придумайте новый пароль для входа</p>
            <form onSubmit={submit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ position: 'relative' }}>
                  <input className="input-field" type={showPassword ? 'text' : 'password'} required placeholder="Минимум 8 символов"
                    value={password} onChange={e => setPassword(e.target.value)} autoFocus style={{ paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                {error && <p style={{ color: '#f87171', fontSize: '0.8125rem', background: 'rgba(248,113,113,0.08)', padding: '10px 14px', borderRadius: 8, margin: 0 }}>{error}</p>}
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ padding: '11px' }}>
                  {loading ? 'Сохраняем…' : 'Сохранить пароль'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
