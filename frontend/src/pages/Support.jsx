import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTickets, createTicket } from '../api/tickets'

const statusMeta = {
  Open:       ['badge badge-open', 'Открыт'],
  InProgress: ['badge badge-in-progress', 'В работе'],
  Closed:     ['badge badge-closed', 'Закрыт'],
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export default function Support() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const load = () => getTickets().then(setTickets).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await createTicket(subject.trim(), message.trim())
      setSubject(''); setMessage(''); setShowForm(false)
      load()
    } catch {
      setError('Не удалось создать обращение')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-pad" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            Поддержка
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', margin: 0 }}>
            Мы ответим в течение нескольких часов
          </p>
        </div>
        <button className="btn btn-primary" style={{ padding: '9px 20px' }} onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Отмена' : '+ Новое обращение'}
        </button>
      </div>

      {showForm && (
        <div className="card fade-up" style={{ padding: '28px', marginBottom: 24 }}>
          <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 18px', fontSize: '1rem' }}>
            Новое обращение
          </h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Тема</label>
                <input className="input-field" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Кратко опишите проблему" required autoFocus />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Сообщение</label>
                <textarea
                  className="input-field"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Подробно опишите вашу проблему"
                  required
                  rows={4}
                  style={{ resize: 'vertical', minHeight: 100 }}
                />
              </div>
              {error && <p style={{ color: '#f87171', fontSize: '0.8125rem', margin: 0 }}>{error}</p>}
              <button className="btn btn-primary" type="submit" disabled={submitting} style={{ alignSelf: 'flex-start', padding: '9px 22px' }}>
                {submitting ? 'Отправляем…' : 'Отправить'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 68, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }} />)}
        </div>
      ) : tickets.length === 0 ? (
        <div className="card fade-up-1" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>💬</div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Обращений пока нет</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Создайте первое обращение, если у вас возникли вопросы</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tickets.map((t, i) => {
            const [badgeClass, badgeText] = statusMeta[t.status] ?? statusMeta.Open
            return (
              <Link key={t.id} to={`/support/${t.id}`} style={{ textDecoration: 'none' }}>
                <div className="card stagger-item" style={{ padding: '16px 20px', animationDelay: `${i * 50}ms`, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9375rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.subject}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        #{t.id} · Обновлён {fmtDate(t.updatedAt)}
                      </div>
                    </div>
                    <span className={badgeClass} style={{ flexShrink: 0 }}>{badgeText}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
