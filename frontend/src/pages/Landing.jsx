import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getPlans } from '../api/subscriptions'
import { useAuth } from '../context/AuthContext'

const features = [
  { icon: '⚡', title: 'Мгновенное подключение', desc: 'Настройка за 2 минуты на любом устройстве' },
  { icon: '🔒', title: 'Приватность', desc: 'Без логов, без слежки, без компромиссов' },
  { icon: '🌐', title: 'Глобальная сеть', desc: 'Стабильный доступ к любым ресурсам' },
  { icon: '📱', title: 'Все устройства', desc: 'Windows, Mac, Linux, iOS, Android — одна подписка' },
]

const faqs = [
  { q: 'Что такое Shebson?', a: 'Shebson — сервис стабильного интернет-доступа. Мы обеспечиваем надёжное подключение без ограничений.' },
  { q: 'Как настроить подключение?', a: 'После оплаты в личном кабинете появится ссылка для подключения. Импортируйте её в приложение — всё готово.' },
  { q: 'Какие устройства поддерживаются?', a: 'Windows, macOS, iOS, Android, Linux — работает на всех платформах.' },
  { q: 'Можно ли вернуть деньги?', a: 'Да, если у вас возникли проблемы — обратитесь в поддержку в первые 3 дня после оплаты.' },
]

export default function Landing() {
  const [plans, setPlans] = useState([])
  const [openFaq, setOpenFaq] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    getPlans().then(setPlans).catch(() => {})
  }, [])

  return (
    <div>
      {/* Hero */}
      <section style={{ padding: '60px 24px 60px', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-flex" style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Left: text */}
          <div style={{ flex: '1 1 0', minWidth: 0 }}>
            <div className="fade-up" style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: 20,
              border: '1px solid rgba(220,38,38,0.35)', background: 'rgba(220,38,38,0.08)',
              color: '#f87171', fontSize: '0.8125rem', marginBottom: 28, fontWeight: 500,
            }}>
              Стабильное подключение · Без ограничений
            </div>

            <h1 className="font-display fade-up-1" style={{
              fontSize: 'clamp(2.25rem, 4.5vw, 3.75rem)', fontWeight: 700, lineHeight: 1.1,
              color: 'var(--text-primary)', marginBottom: 24, letterSpacing: '0.5px',
            }}>
              Интернет без границ.<br />
              <span style={{ color: '#ef4444' }}>Всегда и везде.</span>
            </h1>

            <p className="fade-up-2" style={{ fontSize: '1.0625rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 40, maxWidth: 460 }}>
              Надёжный сервис для стабильного доступа к любым ресурсам. Подключайтесь за 2 минуты, без технических знаний.
            </p>

            <div className="fade-up-3" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to={user ? '/dashboard' : '/register'}>
                <button className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '0.9375rem' }}>
                  {user ? 'Личный кабинет' : 'Начать бесплатно'}
                </button>
              </Link>
              <a href="#plans">
                <button className="btn btn-ghost" style={{ padding: '12px 28px', fontSize: '0.9375rem' }}>Тарифы</button>
              </a>
            </div>
          </div>

          {/* Right: logo */}
          <div className="fade-up-2" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Shebson" className="hero-logo" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '64px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {features.map((f, i) => (
            <div key={i} className="card stagger-item" style={{ padding: '28px 24px', animationDelay: `${i * 60}ms` }}>
              <div style={{ fontSize: '1.75rem', marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{f.title}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section id="plans" style={{ padding: '64px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 className="font-display fade-up" style={{ fontSize: '2rem', fontWeight: 600, textAlign: 'center', marginBottom: 8, color: 'var(--text-primary)' }}>
          Тарифы
        </h2>
        <p className="fade-up-1" style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 40, fontSize: '0.9375rem' }}>
          Выберите подходящий план. Без скрытых платежей.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {plans.map((p, i) => (
            <div key={p.id} className="card stagger-item" style={{
              padding: '32px 28px',
              animationDelay: `${i * 80}ms`,
              ...(p.id === 'month_3' ? { border: '1px solid rgba(220,38,38,0.4)', background: 'rgba(220,38,38,0.05)' } : {})
            }}>
              {p.id === 'month_3' && (
                <div style={{ display: 'inline-block', background: 'var(--accent)', color: '#fff', fontSize: '0.6875rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, marginBottom: 16, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Популярный
                </div>
              )}
              <div className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>{p.name}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 20 }}>{p.description}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Playfair Display, serif' }}>{p.price}₽</span>
              </div>
              <Link to={user ? '/buy' : '/register'}>
                <button className={`btn ${p.id === 'month_3' ? 'btn-primary' : 'btn-ghost'}`} style={{ width: '100%', padding: '10px' }}>
                  {user ? 'Купить' : 'Выбрать план'}
                </button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '64px 24px', maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
        <h2 className="font-display fade-up" style={{ fontSize: '2rem', fontWeight: 600, marginBottom: 40, color: 'var(--text-primary)' }}>
          Как это работает
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
          {['Создайте аккаунт', 'Выберите тариф', 'Получите ссылку', 'Подключайтесь'].map((step, i) => (
            <div key={i} className="stagger-item" style={{ animationDelay: `${i * 80}ms` }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '1px solid rgba(220,38,38,0.4)',
                background: 'rgba(220,38,38,0.08)',
                color: '#f87171', fontWeight: 600, fontSize: '0.9375rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>{i + 1}</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)' }}>{step}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '64px 24px 100px', maxWidth: 680, margin: '0 auto' }}>
        <h2 className="font-display fade-up" style={{ fontSize: '2rem', fontWeight: 600, textAlign: 'center', marginBottom: 32, color: 'var(--text-primary)' }}>
          Вопросы и ответы
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {faqs.map((faq, i) => (
            <div key={i} className="card" style={{ overflow: 'hidden' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none',
                  padding: '20px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', fontWeight: 500,
                  transition: 'transform 160ms var(--ease-out)',
                }}
              >
                {faq.q}
                <span style={{
                  color: 'var(--text-muted)', fontSize: '1.25rem', lineHeight: 1,
                  transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)',
                  transition: 'transform 200ms var(--ease-out)',
                  flexShrink: 0,
                }}>+</span>
              </button>
              <div style={{
                maxHeight: openFaq === i ? 200 : 0,
                overflow: 'hidden',
                transition: 'max-height 250ms var(--ease-out)',
              }}>
                <p style={{ padding: '0 24px 20px', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
