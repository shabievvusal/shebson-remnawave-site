import { useEffect, useState } from 'react'
import { getGiftCodes } from '../../api/admin'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminGifts() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)

  useEffect(() => { getGiftCodes(page).then(setData).catch(() => {}) }, [page])

  return (
    <div style={{ padding: "32px" }}>
      <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>Подарочные коды</h1>

      {!data ? <div style={{ color: 'var(--text-muted)' }}>Загрузка…</div> : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  {['Код', 'Тариф', 'Куплен', 'Активирован', 'Кем', 'Дата покупки', 'Статус'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.gifts.map(g => (
                  <tr key={g.id} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem' }}>{g.code}</td>
                    <td style={{ padding: '10px 12px' }}>{g.planId}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{g.boughtBy}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{g.redeemedBy || '—'}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmtDate(g.redeemedAt)}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmtDate(g.createdAt)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: g.isUsed ? 'var(--text-muted)' : '#4ade80', fontSize: '0.8rem' }}>
                        {g.isUsed ? 'Использован' : 'Активен'}
                      </span>
                    </td>
                  </tr>
                ))}
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
