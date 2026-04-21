import { useEffect, useState } from 'react'
import { getUsers, banUser, makeAdmin } from '../../api/admin'

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminUsers() {
  const [data, setData] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const load = (s = search, p = page) => {
    setLoading(true)
    getUsers(s || undefined, p).then(setData).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    load(search, 1)
  }

  const handleBan = async (id) => {
    await banUser(id)
    load()
  }

  const handleAdmin = async (id) => {
    await makeAdmin(id)
    load()
  }

  return (
    <div style={{ padding: "32px" }}>
      <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>Пользователи</h1>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input className="input-field" style={{ maxWidth: 340 }} placeholder="Поиск по email или имени…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn btn-ghost" type="submit">Найти</button>
      </form>

      {loading ? <div style={{ color: 'var(--text-muted)' }}>Загрузка…</div> : data && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  {['ID', 'Email', 'Имя', 'Регистрация', 'Подписки', 'Потрачено', 'Статус', ''].map(h => (
                    <th key={h} style={{ padding: '8px 12px', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', color: u.isBanned ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    <td style={{ padding: '10px 12px' }}>#{u.id}</td>
                    <td style={{ padding: '10px 12px' }}>{u.email}</td>
                    <td style={{ padding: '10px 12px' }}>{u.firstName || '—'}</td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{fmtDate(u.createdAt)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{u.activeSubs}</td>
                    <td style={{ padding: '10px 12px' }}>{u.totalPayments > 0 ? `${u.totalPayments}₽` : '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {u.isAdmin && <span style={{ color: '#f87171', fontSize: '0.75rem', marginRight: 6 }}>Админ</span>}
                      {u.isBanned && <span style={{ color: '#fbbf24', fontSize: '0.75rem' }}>Забанен</span>}
                      {!u.isAdmin && !u.isBanned && <span style={{ color: '#4ade80', fontSize: '0.75rem' }}>Активен</span>}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          onClick={() => handleBan(u.id)}>
                          {u.isBanned ? 'Разбанить' : 'Бан'}
                        </button>
                        <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          onClick={() => handleAdmin(u.id)}>
                          {u.isAdmin ? '−Админ' : '+Админ'}
                        </button>
                      </div>
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
            <button className="btn btn-ghost" style={{ padding: '5px 10px' }} onClick={() => setPage(p => p + 1)} disabled={page * 20 >= data.total}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
