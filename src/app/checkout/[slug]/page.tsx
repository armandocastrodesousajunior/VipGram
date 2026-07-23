'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  slug: string;
  name: string;
  syncpay_plan_id: string;
  show_price: boolean;
  show_period: boolean;
  cta_text: string;
}

interface Plan {
  id: string | number;
  name: string;
  amount: number | string;
  periodicity_days: number;
}

const INTERVAL_LABELS: Record<string, string> = {
  monthly: 'mês', quarterly: 'trimestre', yearly: 'ano',
  weekly: 'semana', daily: 'dia',
};

function formatCurrency(value: number | string) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(num);
}

function maskCPF(value: string) {
  return value.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2');
}

function maskPhone(value: string) {
  return value.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export default function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: '', email: '', cpf: '', phone: '', telegram_username: '',
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    params.then(({ slug: s }) => {
      setSlug(s);
      fetch(`/api/products?slug=${s}`)
        .then((r) => r.json())
        .then(async ({ products }) => {
          const p = (products as Product[]).find((x) => x.slug === s);
          if (!p) { router.push('/404'); return; }
          setProduct(p);
          // Busca plano
          if (p.syncpay_plan_id) {
            try {
              const planRes = await fetch(`/api/syncpay/plans/${p.syncpay_plan_id}`).catch(() => null);
              if (planRes?.ok) setPlan(await planRes.json());
            } catch { /* ignora */ }
          }
        })
        .finally(() => setLoading(false));
    });
  }, [params, router]);

  function validate() {
    const errs: Partial<typeof form> = {};
    if (!form.name.trim() || form.name.trim().split(' ').length < 2)
      errs.name = 'Informe nome e sobrenome';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'E-mail inválido';
    if (form.cpf.replace(/\D/g, '').length !== 11)
      errs.cpf = 'CPF inválido';
    if (form.phone && form.phone.replace(/\D/g, '').length < 10)
      errs.phone = 'Telefone inválido';
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/syncpay/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product!.id,
          plan_id: product!.syncpay_plan_id,
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          cpf: form.cpf.replace(/\D/g, ''),
          phone: form.phone.replace(/\D/g, '') || undefined,
          telegram_username: form.telegram_username.replace('@', '').trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? 'Erro ao processar pagamento');
        return;
      }

      router.push(`/aguardando/${data.subscription_id}?pix=${encodeURIComponent(data.pix_qr_code_text ?? '')}`);
    } catch {
      setSubmitError('Erro de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  if (!product) return null;

  return (
    <div className="checkout-page">
      <div className="checkout-bg">
      </div>

      <div className="checkout-container">
        {/* Header */}
        <div className="checkout-header">
          <a href={`/p/${slug}`} className="checkout-back">
            ← Voltar
          </a>
          <div className="checkout-logo">💎 {product.name}</div>
        </div>

        <div className="checkout-grid">
          {/* Formulário */}
          <div className="checkout-form-card">
            <h1 className="checkout-title">Finalizar assinatura</h1>
            <p className="checkout-subtitle">Preencha seus dados para gerar o Pix</p>

            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="input-group">
                <label className="input-label">Nome completo *</label>
                <input
                  type="text"
                  className={`input ${errors.name ? 'error' : ''}`}
                  placeholder="João Silva"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoComplete="name"
                />
                {errors.name && <span className="input-error-msg">{errors.name}</span>}
              </div>

              <div className="input-group">
                <label className="input-label">E-mail *</label>
                <input
                  type="email"
                  className={`input ${errors.email ? 'error' : ''}`}
                  placeholder="joao@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                />
                {errors.email && <span className="input-error-msg">{errors.email}</span>}
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">CPF *</label>
                  <input
                    type="text"
                    className={`input ${errors.cpf ? 'error' : ''}`}
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })}
                    inputMode="numeric"
                  />
                  {errors.cpf && <span className="input-error-msg">{errors.cpf}</span>}
                </div>
                <div className="input-group">
                  <label className="input-label">Telefone</label>
                  <input
                    type="text"
                    className={`input ${errors.phone ? 'error' : ''}`}
                    placeholder="(11) 99999-9999"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })}
                    inputMode="tel"
                  />
                  {errors.phone && <span className="input-error-msg">{errors.phone}</span>}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">
                  @ do Telegram
                  <span className="input-optional"> (opcional — para identificação)</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="@seuusername"
                  value={form.telegram_username}
                  onChange={(e) => setForm({ ...form, telegram_username: e.target.value })}
                />
              </div>

              {submitError && (
                <div className="alert alert-error">
                  <span>⚠</span>
                  <span>{submitError}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={submitting}
              >
                {submitting ? (
                  <><div className="spinner" /> Gerando Pix...</>
                ) : (
                  <>🔐 Gerar PIX para pagar</>
                )}
              </button>

              <p className="checkout-terms">
                Ao continuar você concorda com nossos termos de uso e política de privacidade
              </p>
            </form>
          </div>

          {/* Resumo */}
          <div className="checkout-summary">
            <div className="checkout-summary-card">
              <h3 className="summary-title">Resumo do pedido</h3>
              <div className="summary-product">
                <div className="summary-product-icon">💎</div>
                <div>
                  <p className="summary-product-name">{product.name}</p>
                  <p className="summary-product-type">Acesso VIP Telegram</p>
                </div>
              </div>
              <div className="divider" />
              {plan && product.show_price && (
                <div className="summary-price-row">
                  <span>Total</span>
                  <div className="summary-price">
                    <strong>{formatCurrency(plan.amount)}</strong>
                    {product.show_period && plan.periodicity_days && (
                      <small>/a cada {plan.periodicity_days === 7 ? '1semana' : `${plan.periodicity_days} dias`}</small>
                    )}
                  </div>
                </div>
              )}
              <div className="summary-trust">
                <div className="trust-item">🔒 Pagamento criptografado</div>
                <div className="trust-item">⚡ Acesso imediato</div>
                <div className="trust-item">💬 Suporte disponível</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .checkout-page {
          min-height: 100vh;
          background: var(--gradient-hero);
          position: relative;
          overflow-x: hidden;
          padding: 0 0 60px;
        }

        .checkout-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }



        .checkout-container {
          position: relative;
          z-index: 1;
          max-width: 900px;
          margin: 0 auto;
          padding: 32px 20px;
        }

        .checkout-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .checkout-back {
          color: var(--text-muted);
          font-size: 14px;
          transition: color var(--transition);
        }

        .checkout-back:hover { color: var(--text-primary); }

        .checkout-logo {
          font-weight: 700;
          font-size: 16px;
          color: var(--text-primary);
        }

        .checkout-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: start;
        }

        .checkout-form-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 36px;
        }

        .checkout-title {
          font-size: 26px;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .checkout-subtitle {
          font-size: 14px;
          color: var(--text-muted);
          margin-bottom: 28px;
        }

        .checkout-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .input-optional {
          font-weight: 400;
          color: var(--text-muted);
          font-size: 12px;
          margin-left: 6px;
        }

        .checkout-terms {
          font-size: 11px;
          color: var(--text-muted);
          text-align: center;
          line-height: 1.5;
        }

        /* Summary */
        .checkout-summary-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 24px;
          position: sticky;
          top: 24px;
        }

        .summary-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .summary-product {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }

        .summary-product-icon {
          width: 48px; height: 48px;
          background: var(--accent-glow-soft);
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .summary-product-name {
          font-weight: 600;
          font-size: 15px;
          color: var(--text-primary);
        }

        .summary-product-type {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .summary-price-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          font-size: 14px;
          color: var(--text-secondary);
        }

        .summary-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .summary-price strong {
          font-size: 22px;
          color: var(--text-primary);
        }

        .summary-price small {
          font-size: 12px;
          color: var(--text-muted);
        }

        .summary-trust {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 16px;
        }

        .trust-item {
          font-size: 13px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        @media (max-width: 768px) {
          .checkout-grid { grid-template-columns: 1fr; }
          .checkout-summary { order: -1; }
          .checkout-form-card { padding: 24px; }
        }
      `}</style>
    </div>
  );
}
