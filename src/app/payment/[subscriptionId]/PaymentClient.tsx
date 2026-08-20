'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { MetaPixel } from '@/components/MetaPixel';

const POLL_INTERVAL = 5_000;
const MAX_WAIT = 10 * 60 * 1000;

interface PaymentData {
  id: string;
  status: string;
  pix_code: string | null;
  pix_expires_at: string | null;
  customer_name: string;
  product_name: string;
  theme_color: string;
  meta_pixel_id: string | null;
}

export default function PaymentClient({ subscriptionId }: { subscriptionId: string }) {
  const router = useRouter();
  const [data, setData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(MAX_WAIT / 1000);

  // Busca dados do pagamento (pix_code vem do banco, não da URL)
  const fetchPayment = useCallback(async () => {
    try {
      const res = await fetch(`/api/payment/${subscriptionId}`);
      if (!res.ok) { setError('Pagamento não encontrado.'); return; }
      const json = await res.json();
      setData(json);
      setLoading(false);

      // Redireciona se já pago
      if (['ACTIVE', 'PAID', 'active', 'paid'].includes(json.status)) {
        router.push(`/success/telegram/${subscriptionId}`);
      }
    } catch {
      setError('Erro ao carregar dados do pagamento.');
      setLoading(false);
    }
  }, [subscriptionId, router]);

  useEffect(() => {
    fetchPayment();
    const pollInterval = setInterval(fetchPayment, POLL_INTERVAL);

    const startedAt = Date.now();
    const timerInterval = setInterval(() => {
      const left = Math.max(0, (MAX_WAIT - (Date.now() - startedAt)) / 1000);
      setTimeLeft(left);
      if (left === 0) {
        clearInterval(pollInterval);
        clearInterval(timerInterval);
      }
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, [fetchPayment]);

  async function copyPix() {
    if (!data?.pix_code) return;
    try {
      await navigator.clipboard.writeText(data.pix_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* ignora */ }
  }

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = Math.floor(timeLeft % 60).toString().padStart(2, '0');

  if (loading) {
    return (
      <div className="left-card" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Carregando dados do pagamento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="left-card" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--color-danger, #ef4444)', fontSize: 16 }}>⚠ {error}</p>
        <button className="submit-btn" style={{ marginTop: 20, padding: '12px 24px' }} onClick={() => router.back()}>
          ← Voltar
        </button>
      </div>
    );
  }

  if (timeLeft === 0) {
    return (
      <div className="left-card" style={{ textAlign: 'center', gap: 20 }}>
        <div style={{ fontSize: 52 }}>⏰</div>
        <h1 className="checkout-product-title">Pix Expirado</h1>
        <p style={{ color: 'var(--text-muted)' }}>O tempo para pagamento esgotou. Volte e tente novamente.</p>
        <button className="submit-btn" style={{ padding: '12px 24px' }} onClick={() => router.back()}>
          ← Voltar e tentar novamente
        </button>
      </div>
    );
  }

  return (
    <>
      <MetaPixel pixelId={data?.meta_pixel_id ?? null} event="AddPaymentInfo" />
      <div className="left-card" style={{ alignItems: 'center', textAlign: 'center' }}>

        {/* Cabeçalho */}
        <div className="checkout-direct-header" style={{ textAlign: 'center' }}>
          <h1 className="checkout-product-title">{data?.product_name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
            Escaneie o QR Code abaixo com o app do seu banco para pagar via Pix
          </p>
        </div>

        {/* Barra PIX + Timer */}
        <div className="payment-method-box" style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="payment-header">
            <div className="pix-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span>PIX INSTANTÂNEO</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', fontWeight: 700, fontSize: 18, color: 'var(--color-primary)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            {minutes}:{seconds}
          </div>
        </div>

        {/* QR Code */}
        {data?.pix_code ? (
          <div style={{
            background: '#ffffff',
            padding: 20,
            borderRadius: 16,
            boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
            display: 'inline-block',
          }}>
            <QRCodeSVG value={data.pix_code} size={220} level="M" />
          </div>
        ) : (
          <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)' }}>
            <div className="spinner" />
            <span style={{ fontSize: 13 }}>Aguardando QR Code...</span>
          </div>
        )}

        {/* Copia e cola */}
        {data?.pix_code && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
              Ou use o código Pix copia e cola:
            </p>
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <input
                type="text"
                value={data.pix_code}
                readOnly
                className="field-input"
                style={{ flex: 1, fontFamily: 'monospace', fontSize: 11, cursor: 'text' }}
              />
              <button
                onClick={copyPix}
                className="submit-btn"
                style={{
                  padding: '0 18px',
                  minWidth: 'auto',
                  width: 'auto',
                  flexShrink: 0,
                  background: copied ? '#10b981' : undefined,
                  transition: 'background 0.3s',
                }}
              >
                {copied ? '✓ Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
        )}

        {/* Indicador de polling */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: 'var(--color-primary)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          Verificando pagamento automaticamente...
        </div>

        {/* Instruções */}
        <div style={{
          width: '100%',
          borderTop: '1px solid var(--color-border)',
          paddingTop: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          alignItems: 'flex-start',
        }}>
          <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Como pagar:</p>
          {[
            'Abra o app do seu banco',
            'Acesse Pix → Pagar com QR Code ou Pix copia e cola',
            'Cole o código ou escaneie o QR Code',
            'Confirme o pagamento — seu acesso é liberado automaticamente',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--text-muted)', textAlign: 'left' }}>
              <span style={{
                minWidth: 22, height: 22, borderRadius: '50%',
                background: 'var(--color-primary)',
                color: '#fff', fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>{i + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </>
  );
}
