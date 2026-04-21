import { useEffect, useState } from 'react'
import { getPayments } from '../../api/admin'

const statusLabel = { Succeeded: ['#4ade80', 'Оплачен'], Pending: ['#fbbf24', 'Ожидает'], Canceled: ['#f87171', 'Отменён'], Refunded: ['#818cf8', 'Возврат'] }
const purposeLabel = { Subscription: 'Подписка', Gift: 'Подарок', Trial: 'Триал', AutoRenew: 'Авто' }

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminPayments() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    getPayments(page).then(setData).catch(() => {})
  }, [page])

  return (
    <div style={{ padding: "32px" }}>
      <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>Платежи</h1>

      {!data ? <div style={{ color: 'var(--text-muted)' }}>Загрузка…</div> : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  {['ID', 'Пользователь', 'Сумма', 'Тип', 'Промокод', 'Статус', 'Дата'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.payments.map(p => {
                  const [color, label] = statusLabel[p.status] ?? ['var(--text-muted)', p.status]
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                      <td style={{ padding: '10px 12px' }}>#{p.id}</td>
                      <td style={{ padding: '10px 12px' }}>{p.userEmail}</td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        {p.amount}₽
                        {p.originalAmount !== p.amount && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 4 }}>({p.originalAmount}₽)</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px' }}>{purposeLabel[p.purpose] ?? p.purpose}</td>
                      <td style={{ padding: '10px 12px' }}>{p.promoCode || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ color, fontSize: '0.8rem' }}>{label}</span>
                      </td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                        {fmtDate(p.paidAt || p.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <button className="btn btn-ghost" style={{ padding: '5px 10px' }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span>Стр. {page} · Всего {data.total}</span>
            <button className="btn btn-ghost" style={{ padding: '5px 10px' }} onClick={() => setPage(p => p + 1)} disabled={page * 30 >= data.total}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
