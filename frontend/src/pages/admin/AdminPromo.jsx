import { useEffect, useState } from 'react'
import { getPromoCodes, createPromoCode, togglePromo, deletePromo } from '../../api/admin'

const typeLabel = { 0: 'Процент', 1: 'Фикс. скидка', 2: 'Дни' }
const typeUnit = { 0: '%', 1: '₽', 2: 'дн.' }

export default function AdminPromo() {
  const [codes, setCodes] = useState([])
  const [form, setForm] = useState({ code: '', type: 1, value: '', maxUses: 1, expiresAt: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const load = () => getPromoCodes().then(setCodes).catch(() => {})
  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setCreating(true)
    try {
      await createPromoCode({
        code: form.code,
        type: Number(form.type),
        value: Number(form.value),
        maxUses: Number(form.maxUses),
        expiresAt: form.expiresAt || null,
      })
      setForm({ code: '', type: 1, value: '', maxUses: 1, expiresAt: '' })
      load()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Ошибка')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>Промокоды</h1>

      {/* Create form */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Создать промокод</div>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Код</label>
              <input className="input-field" style={{ textTransform: 'uppercase' }} placeholder="SUMMER25" required
                value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Тип</label>
              <select className="input-field" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value={0}>Процент (%)</option>
                <option value={1}>Скидка (₽)</option>
                <option value={2}>Бонус дней</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Значение</label>
              <input className="input-field" type="number" min="0" placeholder="10" required
                value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Макс. использований</label>
              <input className="input-field" type="number" min="1" placeholder="100"
                value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Истекает (необязательно)</label>
              <input className="input-field" type="date"
                value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
            </div>
          </div>
          {error && <p style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: 10 }}>{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={creating} style={{ padding: '8px 20px' }}>
            {creating ? '…' : 'Создать'}
          </button>
        </form>
      </div>

      {/* List */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
              {['Код', 'Тип', 'Значение', 'Использований', 'Истекает', 'Статус', ''].map(h => (
                <th key={h} style={{ padding: '8px 12px', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {codes.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', color: c.isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 600 }}>{c.code}</td>
                <td style={{ padding: '10px 12px' }}>{typeLabel[c.type]}</td>
                <td style={{ padding: '10px 12px' }}>{c.value}{typeUnit[c.type]}</td>
                <td style={{ padding: '10px 12px' }}>{c.usedCount} / {c.maxUses}</td>
                <td style={{ padding: '10px 12px' }}>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('ru-RU') : '∞'}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ color: c.isActive ? '#4ade80' : '#f87171', fontSize: '0.8rem' }}>
                    {c.isActive ? 'Активен' : 'Выкл.'}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={async () => { await togglePromo(c.id); load() }}>
                      {c.isActive ? 'Выкл.' : 'Вкл.'}
                    </button>
                    <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#f87171' }}
                      onClick={async () => { if (confirm('Удалить?')) { await deletePromo(c.id); load() } }}>
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
