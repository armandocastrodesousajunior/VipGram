'use client';

import { useState } from 'react';

export default function SessionsClient({ chatbotId, initialSessions }: { chatbotId: string, initialSessions: any[] }) {
  const [sessions, setSessions] = useState(initialSessions);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const performAction = async (sessionId: string, action: 'pause' | 'resume' | 'reset' | 'delete') => {
    if (action === 'delete' && !confirm('Tem certeza que deseja apagar essa sessão? O robô iniciará do zero na próxima mensagem.')) return;
    
    setLoadingId(sessionId);
    try {
      const res = await fetch(`/api/admin/chatbots/${chatbotId}/sessions/${sessionId}`, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: action !== 'delete' ? JSON.stringify({ action }) : undefined
      });
      
      if (res.ok) {
        if (action === 'delete') {
          setSessions(sessions.filter(s => s.id !== sessionId));
        } else {
          const updatedSession = await res.json();
          setSessions(sessions.map(s => s.id === sessionId ? { ...s, ...updatedSession.session } : s));
        }
      } else {
        alert('Erro ao executar ação');
      }
    } catch (e) {
      alert('Erro de conexão');
    }
    setLoadingId(null);
  };

  return (
    <div>
      {sessions.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Nenhuma sessão iniciada ainda.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: '#09090b', border: '1px solid #27272a', borderRadius: 12 }}>
              <div>
                <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>ID Telegram: {s.telegram_user_id}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#71717a' }}>Estágio Atual: <strong style={{ color: '#a1a1aa' }}>{s.stageName}</strong></span>
                  <span className={`status-pill ${s.is_paused ? 'inactive' : 'active'}`}>
                    {s.is_paused ? 'Pausado' : 'Em Andamento'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#52525b', marginTop: 4 }}>
                  Última interação: {new Date(s.last_interaction).toLocaleString('pt-BR')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  className="action-btn"
                  onClick={() => performAction(s.id, s.is_paused ? 'resume' : 'pause')}
                  disabled={loadingId === s.id}
                  title={s.is_paused ? "Retomar Automação" : "Pausar Automação"}
                >
                  {s.is_paused ? (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                      <span>Retomar</span>
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="6" y="4" width="4" height="16"></rect>
                        <rect x="14" y="4" width="4" height="16"></rect>
                      </svg>
                      <span>Pausar</span>
                    </>
                  )}
                </button>
                <button 
                  className="action-btn"
                  onClick={() => performAction(s.id, 'reset')}
                  disabled={loadingId === s.id}
                  title="Reiniciar Fluxo"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                  </svg>
                  <span>Resetar</span>
                </button>
                <button 
                  className="action-btn danger"
                  onClick={() => performAction(s.id, 'delete')}
                  disabled={loadingId === s.id}
                  title="Excluir Sessão"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .status-pill {
          font-size: 10.5px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .status-pill.active {
          background-color: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .status-pill.inactive {
          background-color: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .action-btn {
          background-color: #09090b;
          border: 1px solid #27272a;
          border-radius: 6px;
          color: #a1a1aa;
          padding: 6px 12px;
          font-size: 12.5px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .action-btn:hover {
          background-color: #ffffff;
          color: #000000;
          border-color: #ffffff;
        }

        .action-btn.danger:hover {
          background-color: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #f87171;
        }
      `}</style>
    </div>
  );
}
