import { useEffect, useState } from 'react'
import client from '../../api/client'

const STATUS_LABELS = { Open: 'Открыт', InProgress: 'В работе', Closed: 'Закрыт' }
const STATUS_COLORS = {
  Open: { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  InProgress: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  Closed: { color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' },
}

function fmtTime(iso) {
  return new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function AdminTickets() {
  const [tickets, setTickets] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadList = () => {
    setLoading(true)
    const params = new URLSearchParams({ page, pageSize: 30 })
    if (filter) params.set('status', filter)
    client.get(`/admin/tickets?${params}`)
      .then(r => { setTickets(r.data.tickets); setTotal(r.data.total) })
      .finally(() => setLoading(false))
  }

  const loadTicket = (id) => {
    client.get(`/admin/tickets/${id}`).then(r => setSelected(r.data))
  }

  useEffect(() => { loadList() }, [page, filter])

  const handleReply = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    try {
      await client.post(`/admin/tickets/${selected.id}/reply`, { message: reply.trim() })
      setReply('')
      loadTicket(selected.id)
      loadList()
    } finally {
      setSending(false)
    }
  }

  const handleClose = async () => {
    await client.post(`/admin/tickets/${selected.id}/close`)
    loadTicket(selected.id)
    loadList()
  }

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0 }}>
      {/* List */}
      <div style={{ width: 340, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-display" style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Тикеты</h2>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['', 'Все'], ['Open', 'Открытые'], ['InProgress', 'В работе'], ['Closed', 'Закрытые']].map(([val, label]) => (
              <button key={val} onClick={() => { setFilter(val); setPage(1) }} style={{
                padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                border: `1px solid ${filter === val ? 'rgba(220,38,38,0.5)' : 'var(--border)'}`,
                background: filter === val ? 'rgba(220,38,38,0.1)' : 'transparent',
                color: filter === val ? '#f87171' : 'var(--text-secondary)',
              }}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Загрузка…</div>
          ) : tickets.length === 0 ? (
            <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Нет тикетов</div>
          ) : tickets.map(t => {
            const sc = STATUS_COLORS[t.status] ?? STATUS_COLORS.Closed
            const isActive = selected?.id === t.id
            return (
              <button key={t.id} onClick={() => loadTicket(t.id)} style={{
                width: '100%', textAlign: 'left', background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                border: 'none', borderBottom: '1px solid var(--border)', padding: '14px 20px', cursor: 'pointer',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    #{t.id} {t.subject}
                  </span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: sc.bg, color: sc.color, flexShrink: 0 }}>
                    {STATUS_LABELS[t.status] ?? t.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.userEmail} · {fmtTime(t.updatedAt)}</div>
              </button>
            )
          })}
        </div>

        {total > 30 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span>Стр. {page}</span>
            <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setPage(p => p + 1)} disabled={page * 30 >= total}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        )}
      </div>

      {/* Detail */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
            Выберите тикет слева
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>#{selected.id} {selected.subject}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{selected.userEmail} · {STATUS_LABELS[selected.status] ?? selected.status}</div>
              </div>
              {selected.status !== 'Closed' && (
                <button className="btn btn-ghost" onClick={handleClose} style={{ padding: '6px 14px', fontSize: '0.8125rem', flexShrink: 0 }}>
                  Закрыть тикет
                </button>
              )}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selected.messages?.map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isFromSupport ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '75%',
                    background: msg.isFromSupport ? 'rgba(220,38,38,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${msg.isFromSupport ? 'rgba(220,38,38,0.25)' : 'var(--border)'}`,
                    borderRadius: 12, padding: '10px 14px',
                  }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{msg.body}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 5 }}>
                      {msg.isFromSupport ? 'Поддержка' : selected.userEmail} · {fmtTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply */}
            {selected.status !== 'Closed' ? (
              <form onSubmit={handleReply} style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0 }}>
                <textarea
                  className="input-field"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Ответ поддержки…"
                  rows={3}
                  style={{ resize: 'none', flex: 1 }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(e) } }}
                />
                <button className="btn btn-primary" type="submit" disabled={sending || !reply.trim()} style={{ padding: '10px 20px', flexShrink: 0 }}>
                  {sending ? '…' : 'Отправить'}
                </button>
              </form>
            ) : (
              <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', flexShrink: 0 }}>
                Тикет закрыт
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
