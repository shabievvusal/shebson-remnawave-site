import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const { login } = useAuth()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }
    client.get(`/auth/verify-email?token=${token}`)
      .then(r => {
        login(r.data)
        setStatus('success')
      })
      .catch(() => setStatus('invalid'))
  }, [token])

  return (
    <div style={{ minHeight: 'calc(100svh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 400, padding: '40px 36px', textAlign: 'center' }}>
        {status === 'loading' && <p style={{ color: 'var(--text-secondary)' }}>Проверяем…</p>}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>✅</div>
            <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>Email подтверждён!</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Теперь вы можете покупать подписки.</p>
            <Link to="/dashboard"><button className="btn btn-primary" style={{ padding: '10px 24px' }}>В личный кабинет</button></Link>
          </>
        )}
        {status === 'invalid' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>❌</div>
            <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>Недействительная ссылка</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Ссылка устарела или уже использована.</p>
            <Link to="/dashboard"><button className="btn btn-ghost" style={{ padding: '10px 24px' }}>В личный кабинет</button></Link>
          </>
        )}
      </div>
    </div>
  )
}
