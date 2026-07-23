'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface BotVerification {
  chatTitle: string;
  chatType: string;
  membersCount?: number;
  canInvite: boolean;
  botIsAdmin: boolean;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  type: string;
  bot_setup_done: boolean;
  is_active: boolean;
  syncpay_plan_id: string;
  telegram_chat_id?: string;
  created_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Bot Wizard State
  const [botStep, setBotStep] = useState<1|2|3>(1);
  const [chatId, setChatId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [botInfo, setBotInfo] = useState<BotVerification | null>(null);
  const [botError, setBotError] = useState('');

  useEffect(() => {
    fetch('/api/products?admin=true')
      .then((r) => r.json())
      .then(({ products }) => { setProducts(products ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    });
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !current } : p))
    );
  }

  async function deleteProduct(id: string, name: string) {
    if (!confirm(`Tem certeza que deseja excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function openSyncModal(product: Product) {
    setSelectedProduct(product);
    setBotStep(1);
    setChatId(product.telegram_chat_id ?? '');
    setBotInfo(null);
    setBotError('');
    setSyncModalOpen(true);
  }

  async function verifyBot() {
    if (!chatId.trim() || !selectedProduct) {
      setBotError('Informe o Chat ID primeiro');
      return;
    }
    setVerifying(true);
    setBotError('');

    try {
      const res = await fetch(`/api/telegram/verify-bot?chatId=${chatId.trim()}`);
      const data = await res.json();
      if (!res.ok) {
        setBotError(data.error ?? 'Erro ao verificar bot');
        return;
      }
      if (!data.botIsAdmin) {
        setBotError('O bot não é administrador deste chat. Adicione-o como admin primeiro.');
        return;
      }
      if (!data.canInvite) {
        setBotError('O bot não tem permissão para criar links de convite. Ative essa permissão.');
        return;
      }
      
      setBotInfo(data);
      
      // Salva no produto
      await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_chat_id: chatId.trim(),
          telegram_chat_name: data.chatTitle,
          bot_setup_done: true
        }),
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? { ...p, bot_setup_done: true, telegram_chat_id: chatId.trim() } : p))
      );

      setBotStep(3);
    } catch {
      setBotError('Erro de conexão ao verificar bot');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Produtos</h1>
          <p className="page-subtitle">{products.length} produto(s) cadastrado(s)</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Novo Produto</span>
        </Link>
      </div>

      {loading ? (
        <div className="loading-state flex-center" style={{ padding: 80 }}>
          <div className="spinner-mono" />
          <span>Carregando lista de produtos...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="products-empty-box">
          <div className="empty-icon-box">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <h2>Nenhum produto cadastrado</h2>
          <p>Crie seu primeiro produto e comece a vender acesso aos grupos VIP</p>
          <Link href="/admin/products/new" className="btn-primary mt-4">
            Criar Primeiro Produto
          </Link>
        </div>
      ) : (
        <div className="products-grid-mono">
          {products.map((product) => (
            <div className="product-card-mono" key={product.id}>
              
              <div className="product-card-top">
                <div className="product-type-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  <span>Telegram VIP</span>
                </div>
                <div className="status-badges">
                  <span className={`status-pill ${product.is_active ? 'active' : 'inactive'}`}>
                    {product.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                  <span
                    className={`status-pill ${product.bot_setup_done ? 'bot-ok' : 'bot-warn'}`}
                    title={product.bot_setup_done ? 'Bot Telegram Configurado' : 'Bot Telegram Pendente'}
                  >
                    {product.bot_setup_done ? 'Bot Conectado' : 'Bot Pendente'}
                  </span>
                </div>
              </div>

              <div className="product-card-main">
                <h3 className="product-card-name">{product.name}</h3>
                <span className="product-card-slug">/p/{product.slug}</span>
              </div>

              <div className="product-card-actions">
                <Link
                  href={`/p/${product.slug}`}
                  target="_blank"
                  className="action-btn"
                  title="Ver Página de Venda"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <span>Página</span>
                </Link>

                <Link
                  href={`/admin/products/${product.id}`}
                  className="action-btn"
                  title="Editar Produto"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span>Editar</span>
                </Link>

                {!product.bot_setup_done ? (
                  <button
                    type="button"
                    className="action-btn primary"
                    onClick={() => openSyncModal(product)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    <span>Sincronizar Bot</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="action-btn"
                    onClick={() => openSyncModal(product)}
                    title="Configuração do Bot"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    <span>Gerenciar Bot</span>
                  </button>
                )}

                <button
                  type="button"
                  className="action-btn"
                  onClick={() => toggleActive(product.id, product.is_active)}
                >
                  {product.is_active ? 'Pausar' : 'Ativar'}
                </button>

                <button
                  type="button"
                  className="action-btn danger"
                  onClick={() => deleteProduct(product.id, product.name)}
                  title="Excluir produto"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODAL DE SINCRONIZAÇÃO DO TELEGRAM MONOCROMÁTICO */}
      {syncModalOpen && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Sincronizar Telegram: {selectedProduct.name}</h3>
              <button type="button" className="modal-close" onClick={() => setSyncModalOpen(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              {/* Wizard Steps */}
              <div className="wizard-steps">
                <div className={`step-dot ${botStep >= 1 ? 'active' : ''}`}>1</div>
                <div className={`step-line ${botStep > 1 ? 'active' : ''}`} />
                <div className={`step-dot ${botStep >= 2 ? 'active' : ''}`}>2</div>
                <div className={`step-line ${botStep > 2 ? 'active' : ''}`} />
                <div className={`step-dot ${botStep === 3 ? 'active' : ''}`}>3</div>
              </div>

              {/* Step 1 */}
              {botStep === 1 && (
                <div className="step-content">
                  <div className="instructions-box">
                    <h4>Adicione o Bot como Administrador</h4>
                    <ol className="instructions-list">
                      <li>Abra seu Grupo ou Canal no Telegram</li>
                      <li>Acesse <strong>Membros → Adicionar administrador</strong></li>
                      <li>Busque pelo Bot do sistema no Telegram</li>
                      <li>Ative a permissão <strong>&quot;Convidar usuários via link&quot;</strong></li>
                    </ol>
                  </div>
                  <button type="button" className="btn-primary mt-4" onClick={() => setBotStep(2)}>
                    Já adicionei o bot como Admin →
                  </button>
                </div>
              )}

              {/* Step 2 */}
              {botStep === 2 && (
                <div className="step-content">
                  <div className="instructions-box">
                    <h4>Informe o ID do Grupo ou Canal</h4>
                    <p className="subtext">
                      Adicione o bot <code>@userinfobot</code> no grupo para obter o Chat ID (ex: <code>-1001234567890</code>).
                    </p>
                    <div className="field-group mt-4">
                      <label className="field-label">Chat ID do Telegram</label>
                      <input
                        type="text"
                        className={`field-input ${botError ? 'error' : ''}`}
                        placeholder="-1001234567890 ou @canal"
                        value={chatId}
                        onChange={(e) => {
                          setChatId(e.target.value);
                          setBotError('');
                        }}
                      />
                      {botError && <span className="error-text">{botError}</span>}
                    </div>
                  </div>

                  <div className="flex-between mt-4">
                    <button type="button" className="btn-secondary" onClick={() => setBotStep(1)}>
                      ← Voltar
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={verifyBot}
                      disabled={verifying || !chatId}
                    >
                      {verifying ? 'Verificando Conexão...' : 'Verificar e Conectar'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {botStep === 3 && botInfo && (
                <div className="step-content text-center">
                  <div className="success-box">
                    <div className="success-icon-circle">✓</div>
                    <h4>Bot Conectado com Sucesso!</h4>
                    <div className="info-list">
                      <div className="info-row">
                        <span>Nome:</span>
                        <strong>{botInfo.chatTitle}</strong>
                      </div>
                      <div className="info-row">
                        <span>Tipo:</span>
                        <strong>{botInfo.chatType}</strong>
                      </div>
                    </div>
                  </div>
                  <button type="button" className="btn-primary mt-4" onClick={() => setSyncModalOpen(false)}>
                    Concluir
                  </button>
                </div>
              )}
            </div>
          </div>
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
        }

        .products-empty-box {
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

        .products-empty-box h2 {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .products-empty-box p {
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

        .status-pill.bot-ok {
          background-color: #09090b;
          color: #ffffff;
          border: 1px solid #3f3f46;
        }

        .status-pill.bot-warn {
          background-color: rgba(234, 179, 8, 0.1);
          color: #fde047;
          border: 1px solid rgba(234, 179, 8, 0.2);
        }

        .product-card-main {
          display: flex;
          flex-direction: column;
          gap: 4px;
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
          font-family: monospace;
        }

        .product-card-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding-top: 14px;
          border-top: 1px solid #27272a;
        }

        .action-btn {
          background-color: #09090b;
          border: 1px solid #27272a;
          border-radius: 6px;
          color: #a1a1aa;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .action-btn:hover {
          background-color: #18181b;
          color: #ffffff;
          border-color: #52525b;
        }

        .action-btn.primary {
          background-color: #ffffff;
          color: #000000;
          border-color: #ffffff;
        }

        .action-btn.danger:hover {
          background-color: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #f87171;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 16px;
        }

        .modal-card {
          background-color: #121215;
          border: 1px solid #27272a;
          border-radius: 14px;
          width: 100%;
          max-width: 520px;
          overflow: hidden;
        }

        .modal-header {
          padding: 18px 20px;
          border-bottom: 1px solid #27272a;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-header h3 {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          color: #71717a;
          font-size: 18px;
          cursor: pointer;
        }

        .modal-body {
          padding: 20px;
        }

        .wizard-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
        }

        .step-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: #09090b;
          border: 1px solid #27272a;
          color: #71717a;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .step-dot.active {
          background-color: #ffffff;
          color: #000000;
          border-color: #ffffff;
        }

        .step-line {
          width: 40px;
          height: 2px;
          background-color: #27272a;
        }

        .step-line.active {
          background-color: #ffffff;
        }

        .instructions-box {
          background-color: #09090b;
          border: 1px solid #27272a;
          border-radius: 10px;
          padding: 16px;
        }

        .instructions-box h4 {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 10px 0;
        }

        .instructions-list {
          margin: 0;
          padding-left: 20px;
          font-size: 13px;
          color: #a1a1aa;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .subtext {
          font-size: 12.5px;
          color: #a1a1aa;
        }

        .subtext code {
          background-color: #18181b;
          color: #ffffff;
          padding: 2px 4px;
          border-radius: 4px;
        }

        .success-box {
          background-color: #09090b;
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 10px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .success-icon-circle {
          width: 40px;
          height: 40px;
          background-color: #10b981;
          color: #000;
          border-radius: 50%;
          font-size: 20px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .info-list {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 10px;
          font-size: 13px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          color: #a1a1aa;
        }

        .btn-secondary {
          background-color: transparent;
          color: #a1a1aa;
          border: 1px solid #27272a;
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .error-text {
          font-size: 12px;
          color: #ef4444;
          margin-top: 4px;
        }

        .loading-state {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #71717a;
          font-size: 13px;
        }

        .spinner-mono {
          width: 16px;
          height: 16px;
          border: 2px solid #27272a;
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
