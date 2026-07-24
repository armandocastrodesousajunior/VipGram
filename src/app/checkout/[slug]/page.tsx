'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  image_url: string | null;
  creator_name: string | null;
  theme_color: string | null;
  syncpay_plan_id: string;
  show_price: boolean;
  show_period: boolean;
  show_banner: boolean;
  show_creator: boolean;
  cta_text: string;
}

interface Plan {
  id: string | number;
  name: string;
  amount: number | string;
  periodicity_days: number;
}

function maskCPF(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2');
}

function maskPhone(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
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
    name: '',
    email: '',
    cpf: '',
    phone: '',
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
          if (!p) {
            router.push('/404');
            return;
          }
          setProduct(p);
          if (p.syncpay_plan_id) {
            try {
              const planRes = await fetch(`/api/syncpay/plans/${p.syncpay_plan_id}`).catch(() => null);
              if (planRes?.ok) setPlan(await planRes.json());
            } catch {
              /* ignora */
            }
          }
        })
        .finally(() => setLoading(false));
    });
  }, [params, router]);

  function validate() {
    const errs: Partial<typeof form> = {};
    if (!form.name.trim() || form.name.trim().split(' ').length < 2)
      errs.name = 'Informe nome e sobrenome completo';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Informe um e-mail válido';
    if (form.cpf.replace(/\D/g, '').length !== 11)
      errs.cpf = 'Informe um CPF válido (11 dígitos)';
    if (form.phone && form.phone.replace(/\D/g, '').length < 10)
      errs.phone = 'Informe um telefone válido';
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
          plan_id: String(product!.syncpay_plan_id),
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          cpf: form.cpf.replace(/\D/g, ''),
          phone: form.phone.replace(/\D/g, '') || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error + (data.fullError ? ` (${data.fullError})` : ''));
        return;
      }

      router.push(`/payment/${data.subscription_id}`);
    } catch {
      setSubmitError('Erro de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', color: '#fff' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!product) return null;

  const theme = product.theme_color ?? 'clean_light';

  return (
    <div className={`checkout-view theme-${theme}`}>
      {/* Main Container */}
      <div className="view-container">
        
        {/* Card Principal do Checkout Direto */}
        <div className="left-card">
          
          {/* Header Superior com Botão de Voltar */}
          <div className="checkout-top-header">
            <Link href={`/p/${slug}`} className="back-link">
              ‹ Voltar
            </Link>
          </div>

          {/* Título Direto do Produto */}
          <div className="checkout-direct-header">
            <h1 className="checkout-product-title">{product.name}</h1>
          </div>

          {/* Formulário Direto de Dados de Pagamento */}
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="form-section-title">
              <h3>Preencha seus dados para pagamento</h3>
            </div>

            <div className="field-group">
              <label className="field-label">Nome e Sobrenome *</label>
              <input
                type="text"
                className={`field-input ${errors.name ? 'error' : ''}`}
                placeholder="Ex: João da Silva"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoComplete="name"
              />
              {errors.name && <span className="field-error-msg">{errors.name}</span>}
            </div>

            <div className="field-group">
              <label className="field-label">Seu E-mail * <small>(onde receberá o acesso)</small></label>
              <input
                type="email"
                className={`field-input ${errors.email ? 'error' : ''}`}
                placeholder="exemplo@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
              {errors.email && <span className="field-error-msg">{errors.email}</span>}
            </div>

            <div className="grid-2-fields">
              <div className="field-group">
                <label className="field-label">CPF *</label>
                <input
                  type="text"
                  className={`field-input ${errors.cpf ? 'error' : ''}`}
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })}
                  inputMode="numeric"
                />
                {errors.cpf && <span className="field-error-msg">{errors.cpf}</span>}
              </div>

              <div className="field-group">
                <label className="field-label">Telefone / WhatsApp</label>
                <input
                  type="text"
                  className={`field-input ${errors.phone ? 'error' : ''}`}
                  placeholder="(11) 99999-9999"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })}
                  inputMode="tel"
                />
                {errors.phone && <span className="field-error-msg">{errors.phone}</span>}
              </div>
            </div>

            {/* Método de Pagamento Pix */}
            <div className="payment-method-box">
              <div className="payment-header">
                <div className="pix-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  <span>PIX INSTANTÂNEO</span>
                </div>
                <span className="pix-sub">Liberação imediata</span>
              </div>
            </div>

            {submitError && (
              <div className="checkout-alert-error">
                <span>⚠ {submitError}</span>
              </div>
            )}

            {/* Botão CTA Principal */}
            <div className="cta-action">
              <button type="submit" className="cta-button" disabled={submitting}>
                {submitting ? (
                  <span>GERANDO PIX DE PAGAMENTO...</span>
                ) : (
                  <>
                    <span>GERAR PIX PARA PAGAR</span>
                    <span className="cta-arrow">›</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Badges de Segurança */}
          <div className="checkout-security-row">
            <div className="security-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <span>Pagamento Criptografado 256-bit</span>
            </div>
            <div className="security-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              <span>Acesso Imediato</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

