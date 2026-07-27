'use client';

import { useEffect, useState, useRef } from 'react';

function Confetti() {
  const colors = ['#d946ef', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${2 + Math.random() * 3}s`,
    size: `${6 + Math.random() * 8}px`,
  }));

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: '-20px',
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confetti-fall ${p.duration} ${p.delay} ease-in forwards`,
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  );
}

export default function SucessoTelegramPage({
  params,
}: {
  params: Promise<{ subscriptionId: string }>;
}) {
  const [subscriptionId, setSubscriptionId] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [themeColor, setThemeColor] = useState('clean_dark');
  const calledRef = useRef(false);

  useEffect(() => {
    params.then(({ subscriptionId: id }) => {
      setSubscriptionId(id);
    });
  }, [params]);

  useEffect(() => {
    if (!subscriptionId || calledRef.current) return;
    calledRef.current = true;

    fetchData();
  }, [subscriptionId]);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      // Fetch payment details (which includes theme_color)
      const paymentRes = await fetch(`/api/payment/${subscriptionId}`);
      if (paymentRes.ok) {
        const paymentData = await paymentRes.json();
        if (paymentData.theme_color) {
          setThemeColor(paymentData.theme_color);
        }
      }

      const res = await fetch('/api/telegram/bot-info');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Erro ao obter informações do bot.');
        return;
      }
      // Construir o link para o bot com o start param
      const url = `https://t.me/${data.username}?start=${subscriptionId}`;
      setInviteLink(url);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function retry() {
    setRetrying(true);
    calledRef.current = false;
    await fetchData();
    setRetrying(false);
  }

  if (loading) {
    return (
      <div className={`theme-${themeColor} sucesso-page`}>
        <div className="sucesso-card">
          <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Gerando seu link de acesso exclusivo...
          </p>
        </div>
        <SucessoStyles />
      </div>
    );
  }

  return (
    <div className={`theme-${themeColor} sucesso-page`}>
      <Confetti />

      <div className="sucesso-card">
        {!error ? (
          <>
            {/* Ícone de sucesso */}
            <div className="sucesso-icon animate-float">🎉</div>

            <h1 className="sucesso-title">
              Pagamento confirmado!
            </h1>
            <p className="sucesso-sub">
              Seja bem-vindo ao grupo VIP. Seu acesso exclusivo foi gerado.
            </p>

            {/* Link de acesso */}
            <div className="sucesso-link-card">
              <div className="sucesso-link-header">
                <span>🤖</span>
                <span>Inicie a conversa com o nosso Bot</span>
              </div>
              <p className="sucesso-link-warning">
                ⚠️ Seu acesso será liberado automaticamente pelo bot através deste link.
              </p>
              <a
                href={inviteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="sucesso-cta"
              >
                <span>📱</span>
                <span>Falar com o Bot no Telegram</span>
              </a>
              <div className="sucesso-link-text">
                <span>Link:</span>
                <code>{inviteLink}</code>
              </div>
            </div>

            {/* Instruções */}
            <div className="sucesso-instructions">
              <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
                Como entrar no grupo:
              </p>
              {[
                'Clique no botão acima',
                'O Telegram abrirá na conversa com o nosso Bot',
                'Clique em "Começar" ou "Start"',
                'O bot enviará o seu link de acesso exclusivo ao grupo VIP! 🎊',
              ].map((step, i) => (
                <div key={i} className="sucesso-step">
                  <div className="sucesso-step-num">{i + 1}</div>
                  <span>{step}</span>
                </div>
              ))}
            </div>

            <p className="sucesso-footer">
              Em caso de problemas técnicos, entre em contato com o suporte.
            </p>
          </>
        ) : (
          <>
            <div className="sucesso-icon">⚠️</div>
            <h1 className="sucesso-title">Pagamento confirmado!</h1>
            <p className="sucesso-sub" style={{ color: 'var(--text-muted)' }}>
              Mas houve um problema ao gerar seu link de acesso.
            </p>
            <div className="alert alert-error">
              <span>⚠</span>
              <span>{error}</span>
            </div>
            <button
              className="sucesso-cta"
              onClick={retry}
              disabled={retrying}
              style={{ width: '100%' }}
            >
              {retrying ? <><div className="spinner" /> Tentando...</> : '🔄 Tentar novamente'}
            </button>
            <p className="sucesso-footer">
              Se o problema persistir, entre em contato com o suporte informando o ID:{' '}
              <code style={{ color: 'var(--color-primary)' }}>{subscriptionId}</code>
            </p>
          </>
        )}
      </div>

      <SucessoStyles />
    </div>
  );
}

function SucessoStyles() {
  return (
    <style>{`
      .sucesso-page {
        min-height: 100vh;
        background: var(--bg-main);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        position: relative;
        color: var(--text-title);
      }

      .sucesso-card {
        background: var(--card-bg);
        border: 1px solid var(--input-border);
        border-radius: var(--radius-xl);
        padding: 48px 40px;
        width: 100%;
        max-width: 500px;
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        gap: 20px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        animation: slideUp 0.5s ease;
      }

      .sucesso-icon {
        font-size: 72px;
        text-align: center;
        line-height: 1;
      }

      .sucesso-title {
        font-size: 32px;
        font-weight: 900;
        text-align: center;
        color: var(--text-title);
      }

      .sucesso-sub {
        text-align: center;
        font-size: 15px;
        color: var(--text-sub);
        margin-top: -8px;
        line-height: 1.6;
      }

      .sucesso-link-card {
        background: var(--input-bg);
        border: 1px solid var(--input-border);
        border-radius: var(--radius-lg);
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .sucesso-link-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 700;
        color: var(--text-title);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .sucesso-link-warning {
        font-size: 12px;
        color: #b45309;
        background: rgba(245,158,11,0.15);
        padding: 8px 12px;
        border-radius: var(--radius-sm);
      }

      .sucesso-cta {
        animation: pulse-glow 2s ease-in-out infinite;
        background: var(--cta-bg);
        color: var(--cta-text);
        border: none;
        padding: 16px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        transition: 0.2s ease;
        text-decoration: none;
        cursor: pointer;
      }
      
      .sucesso-cta:hover {
        background: var(--cta-hover);
        transform: translateY(-2px);
      }

      .sucesso-link-text {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        color: var(--text-sub);
        overflow: hidden;
      }

      .sucesso-link-text code {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--text-title);
      }

      .sucesso-instructions {
        background: var(--input-bg);
        border: 1px solid var(--input-border);
        border-radius: var(--radius);
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .sucesso-step {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        color: var(--text-sub);
      }

      .sucesso-step-num {
        width: 24px; height: 24px;
        border-radius: 50%;
        background: var(--badges-bg);
        color: var(--badges-text);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        flex-shrink: 0;
      }

      .sucesso-footer {
        font-size: 12px;
        color: var(--text-sub);
        text-align: center;
        line-height: 1.5;
      }

      @media (max-width: 480px) {
        .sucesso-card { padding: 32px 20px; }
      }
    `}</style>
  );
}
