'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        setError('Token inválido. Verifique o valor configurado no seu .env.local');
      }
    } catch {
      setError('Erro de conexão com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-shell">
      {/* Grid Pattern Background */}
      <div className="admin-login-grid-bg" />

      <div className="admin-login-card">
        {/* Header */}
        <div className="admin-login-header">
          <div className="admin-login-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="admin-login-title">Acesso Restrito</h1>
          <p className="admin-login-subtitle">
            Informe a chave de segurança para acessar o painel de gestão
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="input-group">
            <label className="input-label">Token de Administrador</label>
            <div className="input-with-icon">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-2-2l2 2M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"/>
                  <path d="M12 7v5l3 3"/>
                </svg>
              </span>
              <input
                type="password"
                className={`input ${error ? 'error' : ''}`}
                placeholder="Insira a sua senha / token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && (
            <div className="alert-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn-admin-primary"
            disabled={loading || !token}
          >
            {loading ? (
              <span className="flex-center gap-2">
                <div className="admin-spinner" />
                <span>Autenticando...</span>
              </span>
            ) : (
              <span className="flex-center gap-2">
                <span>Entrar no Painel</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </span>
            )}
          </button>
        </form>

        <div className="admin-login-footer">
          <span>Sua chave está configurada no <code>.env.local</code> como <code>ADMIN_TOKEN</code></span>
        </div>
      </div>

      <style>{`
        .admin-login-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #09090b;
          color: #f4f4f5;
          padding: 24px;
          position: relative;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .admin-login-grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .admin-login-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          background-color: #121215;
          border: 1px solid #27272a;
          border-radius: 16px;
          padding: 40px 36px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        }

        .admin-login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .admin-login-badge {
          width: 52px;
          height: 52px;
          background-color: #ffffff;
          color: #000000;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 4px 20px rgba(255, 255, 255, 0.15);
        }

        .admin-login-title {
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
        }

        .admin-login-subtitle {
          font-size: 13.5px;
          color: #a1a1aa;
          margin: 0;
          line-height: 1.5;
        }

        .admin-login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-label {
          font-size: 12.5px;
          font-weight: 600;
          color: #d4d4d8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: #71717a;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .input-with-icon .input {
          padding-left: 44px;
        }

        .input {
          width: 100%;
          height: 46px;
          background-color: #09090b;
          border: 1px solid #27272a;
          border-radius: 10px;
          padding: 0 16px;
          color: #ffffff;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .input:focus {
          border-color: #ffffff;
          box-shadow: 0 0 0 1px #ffffff;
        }

        .input.error {
          border-color: #ef4444;
        }

        .alert-error {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          padding: 12px 14px;
          color: #fca5a5;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-admin-primary {
          width: 100%;
          height: 46px;
          background-color: #ffffff;
          color: #000000;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.2s ease, transform 0.1s ease;
        }

        .btn-admin-primary:hover:not(:disabled) {
          background-color: #e4e4e7;
          transform: translateY(-1px);
        }

        .btn-admin-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .flex-center {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gap-2 { gap: 8px; }

        .admin-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(0, 0, 0, 0.2);
          border-top-color: #000000;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .admin-login-footer {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #27272a;
          text-align: center;
          font-size: 11.5px;
          color: #71717a;
          line-height: 1.5;
        }

        .admin-login-footer code {
          background-color: #09090b;
          color: #e4e4e7;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          border: 1px solid #27272a;
        }
      `}</style>
    </div>
  );
}
