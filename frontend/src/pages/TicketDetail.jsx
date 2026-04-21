import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTicket, replyTicket, closeTicket } from '../api/tickets'

const statusLabel = { Open: 'Открыт', InProgress: 'В работе', Closed: 'Закрыт' }

function fmtTime(iso) {
  return new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const load = () => getTicket(id).then(setTicket).catch(() => navigate('/support')).finally(() => setLoading(false))

  useEffect(() => { load() }, [id])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [ticket?.messages])

  const handleReply = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    try {
      await replyTicket(id, reply.trim())
      setReply('')
      load()
    } finally {
      setSending(false)
    }
  }

  const handleClose = async () => {
    await closeTicket(id)
    load()
  }

  if (loading) return (
    <div className="page-pad" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ height: 300, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }} />
    </div>
  )

  if (!ticket) return null

  const isClosed = ticket.status === 'Closed'

  return (
    <div className="page-pad" style={{ maxWidth: 720, margin: '0 auto' }}>
      <button onClick={() => navigate('/support')} className="btn btn-ghost" style={{ marginBottom: 24, padding: '7px 14px', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Назад
      </button>

      <div className="fade-up" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              {ticket.subject}
            </h1>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              #{ticket.id} · {statusLabel[ticket.status] ?? ticket.status}
            </div>
          </div>
          {!isClosed && (
            <button className="btn btn-ghost" style={{ padding: '7px 16px', fontSize: '0.8125rem' }} onClick={handleClose}>
              Закрыть тикет
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {ticket.messages.map((msg, i) => (
          <div key={msg.id} className="stagger-item" style={{
            animationDelay: `${i * 40}ms`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.isFromSupport ? 'flex-start' : 'flex-end',
          }}>
            <div style={{
              maxWidth: '80%',
              background: msg.isFromSupport ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.12)',
              border: `1px solid ${msg.isFromSupport ? 'var(--border)' : 'rgba(99,102,241,0.25)'}`,
              borderRadius: 12,
              padding: '12px 16px',
            }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                {msg.body}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                {msg.isFromSupport ? 'Поддержка' : 'Вы'} · {fmtTime(msg.createdAt)}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {!isClosed ? (
        <form onSubmit={handleReply} className="fade-up-3">
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              className="input-field"
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="Ваш ответ…"
              rows={3}
              style={{ resize: 'none', flex: 1 }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(e) } }}
            />
            <button className="btn btn-primary" type="submit" disabled={sending || !reply.trim()} style={{ padding: '10px 18px', flexShrink: 0 }}>
              {sending ? '…' : 'Отправить'}
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>Enter для отправки, Shift+Enter для новой строки</p>
        </form>
      ) : (
        <div className="card fade-up" style={{ padding: '16px 20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Тикет закрыт</p>
        </div>
      )}
    </div>
  )
}
