'use client';

import { useState } from 'react';

export default function SessionsClient({ chatbotId, initialSessions }: { chatbotId: string, initialSessions: any[] }) {
  const [sessions, setSessions] = useState(initialSessions);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Controle do modal de confirmação
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    danger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: '',
    onConfirm: () => {}
  });

  const closeModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  const executeAction = async (sessionId: string, action: string) => {
    setLoadingId(sessionId);
    closeModal();
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
          const updated = await res.json();
          setSessions(sessions.map(s => s.id === sessionId ? { 
            ...s, 
            ...updated.session, 
            status: updated.session.status,
            stageName: updated.session.stageName || s.stageName,
            progressionTag: updated.session.progressionTag || s.progressionTag
          } : s));
        }
      } else {
        alert('Erro ao executar ação');
      }
    } catch (e) {
      alert('Erro de conexão');
    }
    setLoadingId(null);
  };

  const performAction = (sessionId: string, action: 'pause' | 'resume' | 'reset' | 'close' | 'reopen' | 'delete') => {
    if (action === 'delete') {
      setConfirmModal({
        isOpen: true,
        title: 'Excluir Sessão',
        description: 'Tem certeza que deseja apagar permanentemente essa sessão? O cliente iniciará uma nova conversa do absoluto zero caso mande mensagem.',
        confirmText: 'Sim, excluir',
        danger: true,
        onConfirm: () => executeAction(sessionId, action)
      });
      return;
    }
    if (action === 'reset') {
      setConfirmModal({
        isOpen: true,
        title: 'Resetar Funil',
        description: 'Deseja voltar esse usuário para o início do funil? Ao confirmar, ele receberá a mensagem do Passo 1 assim que interagir com o bot.',
        confirmText: 'Resetar Usuário',
        danger: false,
        onConfirm: () => executeAction(sessionId, action)
      });
      return;
    }
    
    // As outras ações executam direto sem modal
    executeAction(sessionId, action);
  };

  const getStatusDisplay = (status: string) => {
    if (status === 'closed') return { label: 'Finalizada', className: 'closed' };
    if (status === 'paused') return { label: 'Pausada', className: 'inactive' };
    return { label: 'Aberta', className: 'active' };
  };

  const kanbanColumns = Array.from(new Set(sessions.map(s => s.current_step)))
    .sort((a, b) => a - b)
    .map(stepNum => ({
      stepNum,
      title: stepNum === -1 ? 'Início do Funil (Passo 1)' : `Passo ${stepNum + 1}`,
      items: sessions.filter(s => s.current_step === stepNum)
    }));

  const renderActions = (s: any) => (
    <div className="card-actions">
      {s.status === 'active' && (
        <button className="action-btn" onClick={() => performAction(s.id, 'pause')} disabled={loadingId === s.id} title="Pausar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
          Pausar
        </button>
      )}
      {s.status === 'paused' && (
        <button className="action-btn" onClick={() => performAction(s.id, 'resume')} disabled={loadingId === s.id} title="Despausar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          Despausar
        </button>
      )}
      
      {s.status !== 'closed' ? (
        <button className="action-btn" onClick={() => performAction(s.id, 'close')} disabled={loadingId === s.id} title="Finalizar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
          Fechar
        </button>
      ) : (
        <button className="action-btn" onClick={() => performAction(s.id, 'reopen')} disabled={loadingId === s.id} title="Reabrir">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          Restaurar
        </button>
      )}

      {s.status !== 'closed' && (
        <button className="action-btn" onClick={() => performAction(s.id, 'reset')} disabled={loadingId === s.id} title="Resetar Passo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
          Reset
        </button>
      )}

      <button className="action-btn danger outline" onClick={() => performAction(s.id, 'delete')} disabled={loadingId === s.id} title="Excluir">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
    </div>
  );

  const renderKanbanCard = (s: any) => {
    const statusInfo = getStatusDisplay(s.status);
    return (
      <div key={s.id} className="session-card kanban-card">
        <div className="card-header">
          <div style={{ fontWeight: 700, color: '#ffffff', fontSize: 13 }}>ID: {s.telegram_user_id}</div>
          <span className={`status-pill ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>
        
        <div style={{ margin: '12px 0', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, color: '#71717a' }}>
            {s.current_step === -1 ? 'Na fila pro Início' : s.stageName}
          </span>
          {s.progressionTag && (
            <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
              {s.progressionTag}
            </span>
          )}
        </div>

        <div style={{ fontSize: 11, color: '#52525b', marginBottom: 12 }}>
          Última interação: {new Date(s.last_interaction).toLocaleString('pt-BR')}
        </div>

        {renderActions(s)}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <div style={{ display: 'flex', background: '#09090b', padding: 4, borderRadius: 8, border: '1px solid #27272a' }}>
          <button 
            onClick={() => setViewMode('list')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: 'none', background: viewMode === 'list' ? '#27272a' : 'transparent', color: viewMode === 'list' ? '#fff' : '#a1a1aa', borderRadius: 6, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, transition: 'all 0.2s' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            Tabela
          </button>
          <button 
            onClick={() => setViewMode('kanban')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: 'none', background: viewMode === 'kanban' ? '#27272a' : 'transparent', color: viewMode === 'kanban' ? '#fff' : '#a1a1aa', borderRadius: 6, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, transition: 'all 0.2s' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
            Kanban
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Nenhuma sessão iniciada ainda.
        </div>
      ) : viewMode === 'list' ? (
        <div className="table-container">
          <table className="sessions-table">
            <thead>
              <tr>
                <th>ID do Usuário</th>
                <th>Status</th>
                <th>Etapa Atual</th>
                <th>Tag de Progressão</th>
                <th>Última Interação</th>
                <th style={{ textAlign: 'right' }}>Ações Rápidas</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => {
                const statusInfo = getStatusDisplay(s.status);
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: '#e4e4e7' }}>{s.telegram_user_id}</td>
                    <td>
                      <span className={`status-pill ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td style={{ color: '#a1a1aa' }}>
                      {s.current_step === -1 ? 'Na fila pro Início' : s.stageName}
                    </td>
                    <td>
                      {s.progressionTag ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                          {s.progressionTag}
                        </span>
                      ) : (
                        <span style={{ color: '#52525b', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ color: '#71717a' }}>{new Date(s.last_interaction).toLocaleString('pt-BR')}</td>
                    <td style={{ textAlign: 'right' }}>
                      {renderActions(s)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="kanban-board">
          {kanbanColumns.map(col => (
            <div key={col.stepNum} className="kanban-column">
              <div className="kanban-column-header">
                {col.title} <span className="kanban-count">{col.items.length}</span>
              </div>
              <div className="kanban-items">
                {col.items.map(s => renderKanbanCard(s))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Confirmação customizado */}
      {confirmModal.isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: 18 }}>{confirmModal.title}</h3>
            <p style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
              {confirmModal.description}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="modal-cancel-btn" onClick={closeModal}>
                Cancelar
              </button>
              <button 
                className={`modal-confirm-btn ${confirmModal.danger ? 'danger' : ''}`}
                onClick={confirmModal.onConfirm}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .table-container {
          background: #09090b;
          border: 1px solid #27272a;
          border-radius: 12px;
          overflow-x: auto;
        }

        .sessions-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .sessions-table th {
          text-align: left;
          padding: 16px;
          color: #71717a;
          font-weight: 500;
          border-bottom: 1px solid #27272a;
          background: #121215;
          white-space: nowrap;
        }

        .sessions-table td {
          padding: 16px;
          border-bottom: 1px solid #18181b;
          vertical-align: middle;
        }

        .sessions-table tbody tr:hover {
          background: #121215;
        }

        .sessions-table tbody tr:last-child td {
          border-bottom: none;
        }

        .session-card {
          background: #09090b;
          border: 1px solid #27272a;
          border-radius: 12px;
          transition: border-color 0.2s;
        }
        
        .session-card:hover {
          border-color: #3f3f46;
        }

        .kanban-card {
          padding: 14px;
          display: flex;
          flex-direction: column;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
        }

        .card-actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .kanban-board {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          padding-bottom: 20px;
          align-items: flex-start;
        }

        .kanban-column {
          min-width: 300px;
          max-width: 300px;
          background: #121215;
          border-radius: 12px;
          border: 1px solid #27272a;
          display: flex;
          flex-direction: column;
          max-height: 70vh;
        }

        .kanban-column-header {
          padding: 16px;
          font-weight: 700;
          color: #ffffff;
          border-bottom: 1px solid #27272a;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .kanban-count {
          background: #27272a;
          color: #a1a1aa;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
        }

        .kanban-items {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
        }

        .kanban-board::-webkit-scrollbar, .kanban-items::-webkit-scrollbar {
          height: 8px;
          width: 6px;
        }
        .kanban-board::-webkit-scrollbar-track, .kanban-items::-webkit-scrollbar-track {
          background: #09090b; 
        }
        .kanban-board::-webkit-scrollbar-thumb, .kanban-items::-webkit-scrollbar-thumb {
          background: #27272a; 
          border-radius: 4px;
        }
        .kanban-board::-webkit-scrollbar-thumb:hover, .kanban-items::-webkit-scrollbar-thumb:hover {
          background: #3f3f46; 
        }

        .status-pill {
          font-size: 10.5px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .status-pill.active {
          background-color: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .status-pill.inactive {
          background-color: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .status-pill.closed {
          background-color: rgba(161, 161, 170, 0.1);
          color: #a1a1aa;
          border: 1px solid rgba(161, 161, 170, 0.2);
        }

        .action-btn {
          background-color: #18181b;
          border: 1px solid #27272a;
          border-radius: 6px;
          color: #a1a1aa;
          padding: 6px 10px;
          font-size: 11.5px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .action-btn:hover {
          background-color: #27272a;
          color: #ffffff;
        }

        .action-btn.danger:hover {
          background-color: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border-color: rgba(239, 68, 68, 0.2);
        }

        .action-btn.danger.outline {
          background-color: transparent;
        }
        
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.2s ease;
        }

        .modal-content {
          background: #09090b;
          border: 1px solid #27272a;
          padding: 24px;
          width: 400px;
          max-width: 90%;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          animation: slideUp 0.2s ease;
        }

        .modal-cancel-btn {
          background: transparent;
          border: 1px solid #3f3f46;
          color: #a1a1aa;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .modal-cancel-btn:hover {
          background: #27272a;
          color: #fff;
        }

        .modal-confirm-btn {
          background: #10b981;
          border: none;
          color: #fff;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .modal-confirm-btn:hover {
          background: #059669;
        }
        .modal-confirm-btn.danger {
          background: #ef4444;
        }
        .modal-confirm-btn.danger:hover {
          background: #dc2626;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
