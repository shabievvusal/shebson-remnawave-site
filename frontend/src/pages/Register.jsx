import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { register as apiRegister } from '../api/auth'
import { useAuth } from '../context/AuthContext'

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

export default function Register() {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref')

  const submit = async (e) => {
    e.preventDefault()
    if (password.length < 8) { setError('Пароль должен быть минимум 8 символов'); return }
    if (password !== confirm) { setError('Пароли не совпадают'); return }
    setError('')
    setLoading(true)
    try {
      const data = await apiRegister(email, password, firstName, refCode)
      login(data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error ?? 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: 'calc(100svh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 400, padding: '40px 36px' }}>
        <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
          Создать аккаунт
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 28 }}>
          Начните пользоваться сервисом бесплатно
        </p>

        <form onSubmit={submit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Имя (необязательно)</label>
              <input className="input-field" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Ваше имя" autoFocus />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Email</label>
              <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Пароль</label>
              <div style={{ position: 'relative' }}>
                <input className="input-field" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Минимум 8 символов" required style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Повторите пароль</label>
              <div style={{ position: 'relative' }}>
                <input className="input-field" type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            </div>

            {error && (
              <p style={{ color: '#f87171', fontSize: '0.8125rem', background: 'rgba(248,113,113,0.08)', padding: '10px 14px', borderRadius: 8, margin: 0 }}>
                {error}
              </p>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 4, padding: '11px', fontSize: '0.9375rem' }}>
              {loading ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
            </button>
          </div>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Уже есть аккаунт?{' '}
          <Link to="/login" style={{ color: 'var(--accent-hover)', textDecoration: 'none' }}>Войти</Link>
        </p>
      </div>
    </div>
  )
}
