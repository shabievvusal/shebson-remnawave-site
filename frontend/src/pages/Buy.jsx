import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getPlans, buy, renew, validatePromo } from '../api/subscriptions'
import { buyGift as apiBuyGift } from '../api/gifts'

function fmtBytes(bytes) {
  if (bytes >= 1024 ** 4) return `${(bytes / 1024 ** 4).toFixed(0)} ТБ`
  return `${(bytes / 1024 ** 3).toFixed(0)} ГБ`
}

export default function Buy() {
  const [plans, setPlans] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [promoResult, setPromoResult] = useState(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [isGift, setIsGift] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const renewSubId = location.state?.subscriptionId ?? null

  useEffect(() => {
    getPlans().then(d => { setPlans(d); setSelected(d[1]?.id ?? d[0]?.id) })
  }, [])

  const applyPromo = async () => {
    if (!promoCode.trim() || !selected) return
    setPromoLoading(true)
    setPromoResult(null)
    try {
      const res = await validatePromo(promoCode.trim(), selected)
      setPromoResult(res)
    } catch {
      setPromoResult({ valid: false, error: 'Ошибка проверки промокода' })
    } finally {
      setPromoLoading(false)
    }
  }

  const handlePay = async () => {
    if (!selected) return
    setLoading(true)
    setError('')
    try {
      let data
      if (isGift) {
        data = await apiBuyGift(selected)
      } else if (renewSubId) {
        data = await renew(renewSubId, selected, promoResult?.valid ? promoCode : null)
      } else {
        data = await buy(selected, promoResult?.valid ? promoCode : null)
      }
      window.location.href = data.paymentUrl
    } catch (err) {
      setError(err.response?.data?.error ?? 'Ошибка при создании платежа')
      setLoading(false)
    }
  }

  const plan = plans.find(p => p.id === selected)
  const finalPrice = promoResult?.valid && promoResult.finalPrice != null ? promoResult.finalPrice : plan?.price

  return (
    <div className="page-pad" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="fade-up" style={{ marginBottom: 36, textAlign: 'center' }}>
        <h1 className="font-display" style={{ fontSize: '1.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          {renewSubId ? 'Продление подписки' : 'Выберите тариф'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          Оплата через ЮКасса — безопасно и быстро
        </p>
      </div>

      {!renewSubId && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[['Себе', false], ['Подарок', true]].map(([label, val]) => (
            <button key={label} onClick={() => setIsGift(val)} style={{
              padding: '7px 18px', borderRadius: 20, fontSize: '0.8125rem', fontWeight: 500,
              border: `1px solid ${isGift === val ? 'rgba(220,38,38,0.5)' : 'var(--border)'}`,
              background: isGift === val ? 'rgba(220,38,38,0.1)' : 'transparent',
              color: isGift === val ? '#a5b4fc' : 'var(--text-secondary)', cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {plans.map((p, i) => (
          <button key={p.id} className="stagger-item" onClick={() => { setSelected(p.id); setPromoResult(null) }}
            style={{
              animationDelay: `${i * 60}ms`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px 24px', borderRadius: 14,
              border: `1px solid ${selected === p.id ? 'rgba(220,38,38,0.5)' : 'var(--border)'}`,
              background: selected === p.id ? 'rgba(220,38,38,0.07)' : 'rgba(255,255,255,0.025)',
              cursor: 'pointer', textAlign: 'left',
              transition: 'border-color 150ms ease, background 150ms ease',
            }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem', marginBottom: 2 }}>{p.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{p.description}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
              {p.id === 'month_3' && (
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#f87171', background: 'rgba(220,38,38,0.1)', padding: '3px 8px', borderRadius: 12 }}>Популярный</span>
              )}
              <span className="font-display" style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.price}₽</span>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: `2px solid ${selected === p.id ? 'var(--accent)' : 'var(--text-muted)'}`,
                background: selected === p.id ? 'var(--accent)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 150ms ease', flexShrink: 0,
              }}>
                {selected === p.id && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'block' }} />}
              </div>
            </div>
          </button>
        ))}
      </div>

      {!isGift && (
        <div className="card" style={{ padding: '18px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 10, fontWeight: 500 }}>Промокод</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input-field"
              style={{ flex: 1, textTransform: 'uppercase' }}
              placeholder="Введите промокод"
              value={promoCode}
              onChange={e => { setPromoCode(e.target.value); setPromoResult(null) }}
              onKeyDown={e => e.key === 'Enter' && applyPromo()}
            />
            <button className="btn btn-ghost" onClick={applyPromo} disabled={promoLoading || !promoCode.trim()} style={{ padding: '0 16px', flexShrink: 0 }}>
              {promoLoading ? '…' : 'Применить'}
            </button>
          </div>
          {promoResult && (
            <div style={{ marginTop: 10, fontSize: '0.8125rem', color: promoResult.valid ? '#4ade80' : '#f87171' }}>
              {promoResult.valid
                ? promoResult.promoType === 'Days'
                  ? `+${promoResult.bonusDays} дней бонусом`
                  : `Скидка ${promoResult.discount}₽ — итого ${promoResult.finalPrice}₽`
                : promoResult.error}
            </div>
          )}
        </div>
      )}

      {error && (
        <p style={{ color: '#f87171', fontSize: '0.875rem', background: 'rgba(248,113,113,0.08)', padding: '12px 16px', borderRadius: 10, marginBottom: 16 }}>
          {error}
        </p>
      )}

      <button
        className="btn btn-primary fade-up-3"
        onClick={handlePay}
        disabled={!selected || loading}
        style={{ width: '100%', padding: '13px', fontSize: '0.9375rem' }}
      >
        {loading ? 'Переходим к оплате…' : isGift ? `Купить подарок ${plan ? plan.price + '₽' : ''}` : `Оплатить ${finalPrice != null ? finalPrice + '₽' : ''}`}
      </button>

      <p style={{ textAlign: 'center', marginTop: 14, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
        Нажимая кнопку, вы соглашаетесь с условиями сервиса
      </p>
    </div>
  )
}
