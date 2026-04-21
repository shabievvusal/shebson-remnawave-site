import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getMine, getTrialStatus, activateTrial, toggleAutoRenew } from '../api/subscriptions'
import { getReferralStats } from '../api/referrals'
import { redeemGift, getMyGifts } from '../api/gifts'
import { resendVerification } from '../api/auth'
import { useAuth } from '../context/AuthContext'

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtBytes(bytes) {
  if (!bytes || bytes === 0) return '0 ГБ'
  if (bytes >= 1024 ** 4) return `${(bytes / 1024 ** 4).toFixed(1)} ТБ`
  return `${(bytes / 1024 ** 3).toFixed(1)} ГБ`
}

function statusLabel(s) {
  if (s === 'Active') return ['badge badge-active', 'Активна']
  if (s === 'Expired') return ['badge badge-expired', 'Истекла']
  return ['badge badge-closed', 'Приостановлена']
}

function daysLeft(iso) {
  const diff = new Date(iso) - Date.now()
  const days = Math.ceil(diff / 86400000)
  return days > 0 ? days : 0
}

function TrafficBar({ used, limit }) {
  if (!limit || limit === 0) return null
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const color = pct >= 90 ? '#f87171' : pct >= 70 ? '#fbbf24' : '#4ade80'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 5 }}>
        <span>Использовано {fmtBytes(used)} из {fmtBytes(limit)}</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: color, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)
  const [trialStatus, setTrialStatus] = useState(null)
  const [trialLoading, setTrialLoading] = useState(false)
  const [referral, setReferral] = useState(null)
  const [refCopied, setRefCopied] = useState(false)
  const [giftCode, setGiftCode] = useState('')
  const [giftLoading, setGiftLoading] = useState(false)
  const [giftMsg, setGiftMsg] = useState(null)
  const [autoRenewLoading, setAutoRenewLoading] = useState(null)
  const [myGifts, setMyGifts] = useState([])
  const [giftCopied, setGiftCopied] = useState(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMsg, setResendMsg] = useState('')

  const loadData = () => {
    setLoading(true)
    getMine().then(setSubs).finally(() => setLoading(false))
    getTrialStatus().then(setTrialStatus).catch(() => {})
    getReferralStats().then(setReferral).catch(() => {})
    getMyGifts().then(setMyGifts).catch(() => {})
  }

  useEffect(() => { loadData() }, [])

  const copyUrl = async (url, id) => {
    await navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const copyRefLink = async () => {
    if (!referral) return
    await navigator.clipboard.writeText(referral.referralLink)
    setRefCopied(true)
    setTimeout(() => setRefCopied(false), 2000)
  }

  const handleTrial = async () => {
    setTrialLoading(true)
    try {
      await activateTrial()
      loadData()
    } catch (e) {
      alert(e.response?.data?.error ?? 'Ошибка активации')
    } finally {
      setTrialLoading(false)
    }
  }

  const handleRedeemGift = async () => {
    if (!giftCode.trim()) return
    setGiftLoading(true)
    setGiftMsg(null)
    try {
      const res = await redeemGift(giftCode.trim())
      setGiftMsg({ ok: true, text: 'Подписка активирована!' })
      setGiftCode('')
      loadData()
    } catch (e) {
      setGiftMsg({ ok: false, text: e.response?.data?.error ?? 'Ошибка активации' })
    } finally {
      setGiftLoading(false)
    }
  }

  const handleAutoRenew = async (subId, enabled) => {
    setAutoRenewLoading(subId)
    try {
      await toggleAutoRenew(enabled)
      setSubs(prev => prev.map(s => s.id === subId ? { ...s, _autoRenew: enabled } : s))
    } catch (e) {
      alert(e.response?.data?.error ?? 'Ошибка')
    } finally {
      setAutoRenewLoading(null)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    try {
      await resendVerification()
      setResendMsg('Письмо отправлено! Проверьте почту.')
    } catch {
      setResendMsg('Ошибка отправки. Попробуйте позже.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="page-pad" style={{ maxWidth: 860, margin: '0 auto' }}>
      {!user?.isEmailVerified && (
        <div style={{
          background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
          borderRadius: 12, padding: '14px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
        }}>
          <div>
            <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.875rem' }}>⚠ Email не подтверждён</span>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', margin: '2px 0 0' }}>
              Подтвердите почту, чтобы покупать подписки. {resendMsg && <span style={{ color: '#4ade80' }}>{resendMsg}</span>}
            </p>
          </div>
          <button className="btn btn-ghost" onClick={handleResend} disabled={resendLoading}
            style={{ padding: '6px 16px', fontSize: '0.8125rem', flexShrink: 0, borderColor: 'rgba(251,191,36,0.3)', color: '#fbbf24' }}>
            {resendLoading ? '…' : 'Отправить письмо'}
          </button>
        </div>
      )}

      <div className="fade-up" style={{ marginBottom: 36 }}>
        <h1 className="font-display" style={{ fontSize: '1.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
          {user?.firstName ? `Привет, ${user.firstName}` : 'Личный кабинет'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          Управление подписками и настройками
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2].map(i => <div key={i} style={{ height: 180, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : subs.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card fade-up-1" style={{ padding: '56px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>📡</div>
            <div className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
              Нет активных подписок
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 24 }}>
              Выберите тариф и начните пользоваться сервисом
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/buy">
                <button className="btn btn-primary" style={{ padding: '10px 24px' }}>Выбрать тариф</button>
              </Link>
              {trialStatus?.available && (
                <button className="btn btn-ghost" onClick={handleTrial} disabled={trialLoading} style={{ padding: '10px 24px' }}>
                  {trialLoading ? '…' : '🎁 Попробовать 7 дней бесплатно'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {subs.map((sub, i) => {
            const [badgeClass, badgeText] = statusLabel(sub.status)
            const days = daysLeft(sub.expiresAt)
            return (
              <div key={sub.id} className="card stagger-item" style={{ padding: '24px 28px', animationDelay: `${i * 60}ms` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span className="font-display" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Подписка #{sub.id}</span>
                      <span className={badgeClass}>{badgeText}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', margin: 0 }}>
                      До {fmtDate(sub.expiresAt)}
                      {days > 0 && <span style={{ color: days <= 7 ? '#fbbf24' : 'var(--text-muted)', marginLeft: 8 }}>· {days} дн.</span>}
                    </p>
                  </div>
                  <Link to="/buy" state={{ subscriptionId: sub.id }}>
                    <button className="btn btn-ghost" style={{ padding: '7px 16px', fontSize: '0.8125rem' }}>Продлить</button>
                  </Link>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <TrafficBar used={sub.usedTrafficBytes ?? 0} limit={sub.trafficLimitBytes} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px', display: 'inline-block' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 3 }}>Лимит</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{fmtBytes(sub.trafficLimitBytes)}</div>
                  </div>
                </div>

                {sub.subscriptionUrl && (
                  <div className="sub-actions" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                    <div style={{
                      flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.03)', borderRadius: 8,
                      padding: '9px 14px', fontSize: '0.8rem', color: 'var(--text-muted)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace',
                    }}>
                      {sub.subscriptionUrl}
                    </div>
                    <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.8125rem', flexShrink: 0 }}
                      onClick={() => copyUrl(sub.subscriptionUrl, sub.id)}>
                      {copied === sub.id ? '✓ Скопировано' : 'Скопировать'}
                    </button>
                    <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8125rem', flexShrink: 0 }}
                      onClick={() => window.open(sub.subscriptionUrl, '_blank')}>
                      Подключиться
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          <div className="fade-up-3" style={{ paddingTop: 4 }}>
            <Link to="/buy">
              <button className="btn btn-primary" style={{ padding: '10px 24px' }}>+ Новая подписка</button>
            </Link>
          </div>
        </div>
      )}

      {/* Referral block */}
      {referral && (
        <div className="card fade-up-2" style={{ padding: '24px 28px', marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div className="font-display" style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Реферальная программа</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', margin: 0 }}>
                За каждого оплатившего друга — +30 дней к подписке
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 16 }}>
            {[
              ['Приглашено', referral.totalReferrals],
              ['Оплатили', referral.paidReferrals],
              ['Бонусных дней', referral.totalBonusDays],
            ].map(([label, val]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)' }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.03)', borderRadius: 8,
              padding: '9px 14px', fontSize: '0.8rem', color: 'var(--text-muted)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace',
            }}>
              {referral.referralLink}
            </div>
            <button className="btn btn-ghost" onClick={copyRefLink} style={{ padding: '8px 16px', fontSize: '0.8125rem', flexShrink: 0 }}>
              {refCopied ? '✓ Скопировано' : 'Скопировать'}
            </button>
          </div>
        </div>
      )}

      {/* My purchased gifts */}
      {myGifts.length > 0 && (
        <div className="card fade-up-3" style={{ padding: '24px 28px', marginTop: 14 }}>
          <div className="font-display" style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Купленные подарки</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: 14 }}>Скопируйте код и отправьте получателю</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myGifts.map(g => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{
                  flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.03)', borderRadius: 8,
                  padding: '9px 14px', fontFamily: 'monospace', fontSize: '0.9rem',
                  color: g.isUsed ? 'var(--text-muted)' : 'var(--text-primary)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontWeight: 600 }}>{g.code}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g.planId}</span>
                  {g.isUsed && <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>Использован</span>}
                </div>
                {!g.isUsed && (
                  <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.8125rem', flexShrink: 0 }}
                    onClick={async () => {
                      await navigator.clipboard.writeText(g.code)
                      setGiftCopied(g.id)
                      setTimeout(() => setGiftCopied(null), 2000)
                    }}>
                    {giftCopied === g.id ? '✓ Скопировано' : 'Скопировать'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Redeem gift */}
      <div className="card fade-up-3" style={{ padding: '24px 28px', marginTop: 14 }}>
        <div className="font-display" style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Активировать подарок</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: 14 }}>Введите подарочный код для активации подписки</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input-field" style={{ flex: 1, textTransform: 'uppercase' }} placeholder="GIFT-XXXX-XXXX"
            value={giftCode} onChange={e => setGiftCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRedeemGift()} />
          <button className="btn btn-primary" onClick={handleRedeemGift} disabled={giftLoading || !giftCode.trim()}
            style={{ padding: '0 20px', flexShrink: 0 }}>
            {giftLoading ? '…' : 'Активировать'}
          </button>
        </div>
        {giftMsg && (
          <p style={{ marginTop: 10, fontSize: '0.8125rem', color: giftMsg.ok ? '#4ade80' : '#f87171' }}>{giftMsg.text}</p>
        )}
      </div>
    </div>
  )
}
