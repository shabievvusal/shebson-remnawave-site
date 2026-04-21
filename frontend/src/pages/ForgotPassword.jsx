import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../api/client'

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

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await client.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      console.error('forgot-password error:', err?.response?.status, err?.response?.data, err?.message)
      const msg = err?.response?.data?.error || err?.response?.data?.message
      setError(msg ? `Ошибка: ${msg}` : 'Ошибка отправки. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: 'calc(100svh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 400, padding: '40px 36px' }}>
        {sent ? (
          <>
            <div style={{ fontSize: '2rem', marginBottom: 16 }}>📬</div>
            <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>Письмо отправлено</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>
              Если аккаунт с таким email существует — письмо со ссылкой уже в пути. Проверьте папку «Спам».
            </p>
            <BackButton to="/login">Вернуться к входу</BackButton>
          </>
        ) : (
          <>
            <BackButton to="/login">Назад</BackButton>
            <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>Забыли пароль?</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 28 }}>
              Введите email — пришлём ссылку для сброса
            </p>
            <form onSubmit={submit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input className="input-field" type="email" required placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} autoFocus />
                {error && <p style={{ color: '#f87171', fontSize: '0.8125rem', background: 'rgba(248,113,113,0.08)', padding: '10px 14px', borderRadius: 8, margin: 0 }}>{error}</p>}
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ padding: '11px' }}>
                  {loading ? 'Отправляем…' : 'Отправить ссылку'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
