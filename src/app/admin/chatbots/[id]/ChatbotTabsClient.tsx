'use client';

import { useState } from 'react';
import SessionsClient from './sessions/SessionsClient';
import FlowBuilderClient from './builder/FlowBuilderClient';

export default function ChatbotTabsClient({ 
  chatbotId, 
  initialSessions, 
  initialSteps, 
  products 
}: { 
  chatbotId: string, 
  initialSessions: any[], 
  initialSteps: any[], 
  products: any[] 
}) {
  const [activeTab, setActiveTab] = useState<'sessions' | 'flow'>('sessions');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="segmented-control">
        <button 
          className={`segment-btn ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          Sessões Ativas
        </button>
        <button 
          className={`segment-btn ${activeTab === 'flow' ? 'active' : ''}`}
          onClick={() => setActiveTab('flow')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Construtor de Fluxo
        </button>
      </div>

      <div className="tab-content-wrapper">
        {activeTab === 'sessions' ? (
          <SessionsClient chatbotId={chatbotId} initialSessions={initialSessions} />
        ) : (
          <FlowBuilderClient chatbotId={chatbotId} initialSteps={initialSteps} products={products} />
        )}
      </div>

      <style>{`
        .segmented-control {
          display: flex;
          gap: 6px;
          padding: 6px;
          background: #121215;
          border: 1px solid #27272a;
          border-radius: 12px;
          align-self: flex-start;
        }

        .segment-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #71717a;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .segment-btn:hover {
          color: #a1a1aa;
        }

        .segment-btn.active {
          background: #27272a;
          color: #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        .tab-content-wrapper {
          background-color: #121215;
          border: 1px solid #27272a;
          border-radius: 14px;
          padding: 24px;
        }
      `}</style>
    </div>
  );
}
