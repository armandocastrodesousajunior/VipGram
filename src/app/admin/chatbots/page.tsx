import { query } from '@/lib/db';
import Link from 'next/link';

export default async function ChatbotsPage() {
  const chatbots = await query(
    `SELECT c.*
     FROM chatbots c
     ORDER BY c.created_at DESC`
  );

  return (
    <div className="admin-page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Chatbots & Automação</h1>
          <p className="page-subtitle">Gerencie bots Padrões e conexões do Telegram Business</p>
        </div>
        <Link href="/admin/chatbots/new" className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Novo Chatbot</span>
        </Link>
      </div>

      {chatbots.length === 0 ? (
        <div className="empty-box-mono">
          <div className="empty-icon-box">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
          </div>
          <h2>Nenhum chatbot configurado</h2>
          <p>Crie robôs para automatizar seu atendimento e gerar links e PIX dinâmicos</p>
          <Link href="/admin/chatbots/new" className="btn-primary mt-4">
            Criar Primeiro Bot
          </Link>
        </div>
      ) : (
        <div className="products-grid-mono">
          {chatbots.map((bot: any) => (
            <div className="product-card-mono" key={bot.id}>
              
              <div className="product-card-top">
                <div className="product-type-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                  <span>{bot.type === 'business' ? 'Telegram Business' : 'Bot Padrão'}</span>
                </div>
                <div className="status-badges">
                  <span className={`status-pill ${bot.is_active ? 'active' : 'inactive'}`}>
                    {bot.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              <div className="product-card-main">
                <h3 className="product-card-name">{bot.name}</h3>
                <span className="product-card-slug">Criado em {new Date(bot.created_at).toLocaleDateString('pt-BR')}</span>
              </div>

              <div className="product-card-actions">
                <Link
                  href={`/admin/chatbots/${bot.id}`}
                  className="action-btn"
                  title="Abrir Painel do Bot"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                  <span>Painel do Robô</span>
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}

      <style>{`
        .admin-page-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
        }

        .page-title {
          font-size: 22px;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 4px 0;
        }

        .page-subtitle {
          font-size: 13.5px;
          color: #71717a;
          margin: 0;
        }

        .btn-primary {
          background-color: #ffffff;
          color: #000000;
          border: none;
          border-radius: 8px;
          padding: 10px 18px;
          font-size: 13.5px;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .btn-primary:hover {
          opacity: 0.9;
        }

        .empty-box-mono {
          background-color: #121215;
          border: 1px dashed #27272a;
          border-radius: 14px;
          padding: 60px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .empty-icon-box {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background-color: #09090b;
          border: 1px solid #27272a;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #71717a;
        }

        .empty-box-mono h2 {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .empty-box-mono p {
          font-size: 13.5px;
          color: #71717a;
          margin: 0;
        }

        /* Products Grid */
        .products-grid-mono {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .product-card-mono {
          background-color: #121215;
          border: 1px solid #27272a;
          border-radius: 14px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: border-color 0.2s ease;
        }

        .product-card-mono:hover {
          border-color: #52525b;
        }

        .product-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .product-type-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: #a1a1aa;
          text-transform: uppercase;
        }

        .status-badges {
          display: flex;
          align-items: center;
          gap: 6px;
        }

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

        .product-card-main {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 12px;
        }

        .product-card-name {
          font-size: 17px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .product-card-slug {
          font-size: 12px;
          color: #71717a;
        }

        .product-card-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding-top: 14px;
          border-top: 1px solid #27272a;
          margin-top: auto;
        }

        .action-btn {
          background-color: #09090b;
          border: 1px solid #27272a;
          border-radius: 6px;
          color: #a1a1aa;
          padding: 6px 12px;
          font-size: 12.5px;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          width: 100%;
          justify-content: center;
        }

        .action-btn:hover {
          background-color: #ffffff;
          color: #000000;
          border-color: #ffffff;
        }
      `}</style>
    </div>
  );
}
