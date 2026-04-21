import { useEffect, useState } from 'react'
import { getStats } from '../../api/admin'

function StatCard({ label, value, sub }) {
  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>{label}</div>
      <div className="font-display" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

export default function AdminStats() {
  const [stats, setStats] = useState(null)

  useEffect(() => { getStats().then(setStats).catch(() => {}) }, [])

  if (!stats) return <div style={{ color: 'var(--text-muted)' }}>Загрузка…</div>

  return (
    <div style={{ padding: "32px" }}>
      <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>Статистика</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <StatCard label="Всего пользователей" value={stats.totalUsers} sub={`+${stats.newUsersMonth} за 30 дней`} />
        <StatCard label="Новых сегодня" value={stats.newUsersToday} />
        <StatCard label="Активных подписок" value={stats.activeSubs} />
        <StatCard label="Выручка за 30 дней" value={`${stats.revenueMonth.toLocaleString()}₽`} sub={`Всего: ${stats.totalRevenue.toLocaleString()}₽`} />
        <StatCard label="Ожидают оплаты" value={stats.pendingPayments} />
      </div>
    </div>
  )
}
