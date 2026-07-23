'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const POLL_INTERVAL = 10_000; // 10 segundos
const MAX_WAIT = 10 * 60 * 1000; // 10 minutos

function AguardandoContent({ subscriptionId }: { subscriptionId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pixText = searchParams.get('pix') ?? '';

  const [timeLeft, setTimeLeft] = useState(MAX_WAIT / 1000);
  const [copied, setCopied] = useState(false);
  const [expired, setExpired] = useState(false);
  const [status, setStatus] = useState('PENDING');
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    // Timer regressivo
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      const left = Math.max(0, (MAX_WAIT - elapsed) / 1000);
      setTimeLeft(left);
      if (left === 0) {
        setExpired(true);
        clearInterval(timerRef.current);
        clearInterval(intervalRef.current);
      }
    }, 1000);

    // Polling de status
    async function poll() {
      try {
        const res = await fetch(`/api/syncpay/subscription/${subscriptionId}`);
        if (!res.ok) return;
        const data = await res.json();
        setStatus(data.status);

        const paid = ['ACTIVE', 'PAID', 'active', 'paid'].includes(data.status);
        if (paid) {
          clearInterval(intervalRef.current);
          clearInterval(timerRef.current);
          router.push(`/sucesso/telegram/${subscriptionId}`);
        }
      } catch { /* ignora */ }
    }

    poll(); // imediato
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(timerRef.current);
    };
  }, [subscriptionId, router]);

  async function copyPix() {
    try {
      await navigator.clipboard.writeText(pixText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* ignora */ }
  }

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = Math.floor(timeLeft % 60).toString().padStart(2, '0');

  if (expired) {
    return (
      <div className="wait-page">
        <div className="wait-card">
          <div style={{ fontSize: 64, textAlign: 'center' }}>⏰</div>
          <h1 className="wait-title">Pix expirado</h1>
          <p className="wait-sub">O tempo de pagamento expirou. Gere um novo Pix.</p>
          <button className="btn btn-primary mt-4" onClick={() => history.back()}>
            ← Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wait-page">
      <div className="wait-bg">
      </div>

      <div className="wait-card">
        {/* Header */}
        <div className="wait-header">
          <div className="wait-status-dot" />
          <span className="wait-status-text">Aguardando pagamento</span>
        </div>

        <h1 className="wait-title">Pague com Pix</h1>
        <p className="wait-sub">
          Escaneie o QR Code ou copie o código para pagar
        </p>

        {/* Timer */}
        <div className="wait-timer">
          <span className="wait-timer-label">Expira em</span>
          <span className="wait-timer-value">{minutes}:{seconds}</span>
        </div>

        {/* QR Code area */}
        <div className="wait-qr-area">
          {pixText ? (
            <div className="wait-qr-placeholder">
              <div className="wait-qr-icon">📱</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                QR Code Pix gerado.<br/>Use o botão abaixo para copiar o código.
              </p>
            </div>
          ) : (
            <div className="wait-qr-placeholder">
              <div className="spinner spinner-lg" />
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Carregando QR Code...</p>
            </div>
          )}
        </div>

        {/* Pix code copy */}
        {pixText && (
          <div className="wait-pix-copy">
            <div className="wait-pix-text">{pixText.slice(0, 50)}...</div>
            <button
              className={`btn ${copied ? 'btn-secondary' : 'btn-primary'} btn-sm`}
              onClick={copyPix}
            >
              {copied ? '✓ Copiado!' : '📋 Copiar código'}
            </button>
          </div>
        )}

        {/* Polling indicator */}
        <div className="wait-polling">
          <div className="wait-pulse" />
          <span>Verificando pagamento automaticamente a cada 10 segundos...</span>
        </div>

        {/* Instructions */}
        <div className="wait-instructions">
          <p className="wait-inst-title">Como pagar:</p>
          <div className="wait-inst-steps">
            <span>1. Abra o app do seu banco</span>
            <span>2. Vá em &quot;Pix&quot; → &quot;Pagar com QR Code&quot;</span>
            <span>3. Copie e cole o código ou escaneie a câmera</span>
            <span>4. Confirme o pagamento</span>
          </div>
        </div>
      </div>

      <style>{`
        .wait-page {
          min-height: 100vh;
          background: var(--gradient-hero);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
        }

        .wait-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
        }



        .wait-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 40px 36px;
          width: 100%;
          max-width: 480px;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: var(--shadow-lg);
          animation: slideUp 0.4s ease;
        }

        .wait-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .wait-status-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: var(--color-warning);
          animation: pulse-glow 1.5s ease-in-out infinite;
        }

        .wait-status-text {
          font-size: 13px;
          color: var(--color-warning);
          font-weight: 600;
        }

        .wait-title {
          font-size: 28px;
          font-weight: 800;
          text-align: center;
        }

        .wait-sub {
          font-size: 14px;
          color: var(--text-muted);
          text-align: center;
          margin-top: -8px;
        }

        .wait-timer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .wait-timer-label {
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .wait-timer-value {
          font-size: 40px;
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          background: var(--gradient-accent);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 4px;
        }

        .wait-qr-area {
          display: flex;
          justify-content: center;
          align-items: center;
          background: var(--color-bg-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 32px;
          min-height: 160px;
        }

        .wait-qr-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .wait-qr-icon { font-size: 48px; }

        .wait-pix-copy {
          background: var(--color-bg-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .wait-pix-text {
          font-size: 11px;
          color: var(--text-muted);
          font-family: monospace;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .wait-polling {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 12px;
          color: var(--text-muted);
        }

        .wait-pulse {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--color-success);
          animation: pulse-glow 1s ease-in-out infinite;
          flex-shrink: 0;
        }

        .wait-instructions {
          background: var(--color-bg-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius);
          padding: 16px;
        }

        .wait-inst-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 10px;
        }

        .wait-inst-steps {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

export default function AguardandoPage({ params }: { params: Promise<{ subscriptionId: string }> }) {
  const [id, setId] = useState('');

  useEffect(() => {
    params.then(({ subscriptionId }) => setId(subscriptionId));
  }, [params]);

  if (!id) return null;

  return (
    <Suspense>
      <AguardandoContent subscriptionId={id} />
    </Suspense>
  );
}
