'use client';

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
  type: string;
  syncpay_plan_id: string;
  show_price: boolean;
  show_description: boolean;
  show_period: boolean;
  show_creator: boolean;
  show_banner: boolean;
  show_features: boolean;
  custom_features: string[];
  cta_text: string;
  is_active: boolean;
  created_at?: string;
}

interface Plan {
  id: string | number;
  name: string;
  amount: number | string;
  periodicity_days: number;
}

function formatCurrency(value: number | string) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(num);
}

function formatPeriodicity(days: number) {
  if (days === 7) return '1semana';
  if (days === 15) return '1quinzena';
  if (days === 30) return '1mês';
  if (days === 90) return '3meses';
  if (days === 180) return '6meses';
  if (days === 365) return '1ano';
  return `${days} dias`;
}

function getInitials(name: string) {
  if (!name) return 'VIP';
  const clean = name.replace('@', '').trim();
  const parts = clean.split(/[\s_-]+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

export default function LandingClient({
  product,
  plan,
}: {
  product: Product;
  plan: Plan | null;
}) {
  const theme = product.theme_color ?? 'clean_light';
  const creatorHandle = product.creator_name ? product.creator_name : `@${product.slug}`;
  const initials = getInitials(creatorHandle);

  const formattedDate = product.created_at
    ? new Date(product.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : '20/07/26';

  return (
    <div className={`checkout-view theme-${theme}`}>
      {/* Top bar */}
      <div className="top-bar">
        <span>Já é inscrito? <a href={`/checkout/${product.slug}`}>Acesse a <strong>Área de membros</strong>.</a></span>
      </div>

      {/* Main Container */}
      <div className="view-container">
        <div className="view-grid">
          
          {/* COLUNA DA ESQUERDA: Seleção e Ação */}
          <div className="left-card">
            
            {/* Header do Criador */}
            {product.show_creator !== false && (
              <div className="creator-header">
                <div className="creator-avatar">
                  {product.image_url ? (
                    <img src={product.image_url} alt={creatorHandle} />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div className="creator-info">
                  <h2>{product.name}</h2>
                  {product.creator_name && <p>Criado por {product.creator_name}</p>}
                </div>
              </div>
            )}


            {/* Card do Plano Único */}
            {(() => {
              const activePlan = plan ?? { name: 'Plano VIP', amount: 0, periodicity_days: 7 };
              return (
                <div className="single-plan-card">
                  <div className="plan-details">
                    <span className="plan-title">{activePlan.name}</span>
                  </div>
                  {(product.show_price !== false || product.show_period !== false) && (
                    <div className="plan-price-block">
                      {product.show_price !== false && (
                        <span className="plan-price">{formatCurrency(activePlan.amount)}</span>
                      )}
                      {product.show_period !== false && (
                        <span className="plan-period">a cada {formatPeriodicity(activePlan.periodicity_days)}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Lista de Benefícios do Produto */}
            {product.custom_features && product.custom_features.length > 0 && (
              <div className="benefits-container">
                <div className="benefits-list">
                  {product.custom_features.map((feature, idx) => (
                    <div key={idx} className="benefit-item">
                      <span className="benefit-check">✓</span>
                      <span className="benefit-text">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Termos e Condições Checkbox */}
            <div className="terms-row">
              <label className="terms-checkbox">
                <input type="checkbox" defaultChecked />
                <span className="checkmark">✓</span>
                <span>Eu li e concordo com os <strong>Termos de Uso e Prestação de Serviço</strong>.</span>
              </label>
            </div>

            {/* Botão de Ação CTA */}
            <div className="cta-action">
              <Link href={`/checkout/${product.slug}`} className="cta-button">
                <span>{product.cta_text || 'CONTINUAR PARA SEUS DADOS'}</span>
                <span className="cta-arrow">›</span>
              </Link>
            </div>

          </div>

          {/* COLUNA DA DIREITA: Preview do Produto */}
          <div className="right-card">
            <div className="product-preview-card">
              
              {/* Banner / Foto do Produto */}
              {product.show_banner !== false && (
                <div className="product-banner">
                  {product.banner_url ? (
                    <img src={product.banner_url} alt={product.name} />
                  ) : product.image_url ? (
                    <img src={product.image_url} alt={product.name} />
                  ) : (
                    <div className="banner-placeholder">
                      <span>🔥 {product.name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Informações do Produto */}
              <div className="product-card-body">
                <h2 className="product-card-title">{product.name}</h2>
                
                {product.show_description !== false && product.description && (
                  <p className="product-card-desc">{product.description}</p>
                )}


              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ESTILOS DE TEMAS */}
      <style>{`
        .checkout-view *::selection {
          background: var(--accent-blue) !important;
          color: #ffffff !important;
        }
        .theme-dark_vip *::selection {
          background: #e6b800 !important;
          color: #000000 !important;
        }

        /* Tema Clean Light (Default idêntico ao print) */
        .theme-clean_light {
          --bg-main: #edf2f7;
          --card-bg: #ffffff;
          --text-title: #0f172a;
          --text-sub: #475569;
          --accent-blue: #0284c7;
          --plan-bg: #e0f2fe;
          --plan-border: #0284c7;
          --badges-bg: #e6f4ea;
          --badges-text: #166534;
          --cta-bg: #111827;
          --cta-hover: #1f2937;
          --cta-text: #ffffff;
        }

        /* Tema Preto & Dourado VIP */
        .theme-dark_vip {
          --bg-main: #0a0a0c;
          --card-bg: #16161a;
          --text-title: #ffffff;
          --text-sub: #a1a1aa;
          --accent-blue: #e6b800;
          --plan-bg: rgba(230, 184, 0, 0.1);
          --plan-border: #e6b800;
          --badges-bg: rgba(16, 185, 129, 0.1);
          --badges-text: #10b981;
          --cta-bg: #e6b800;
          --cta-hover: #f5cc00;
          --cta-text: #000000;
        }

        /* Tema Hot Red (Vermelho Sedutor) */
        .theme-hot_red {
          --bg-main: #0d0d0f;
          --card-bg: #18181c;
          --text-title: #ffffff;
          --text-sub: #a1a1aa;
          --accent-blue: #e50914;
          --plan-bg: rgba(229, 9, 20, 0.12);
          --plan-border: #e50914;
          --badges-bg: rgba(16, 185, 129, 0.12);
          --badges-text: #10b981;
          --cta-bg: #e50914;
          --cta-hover: #ff1e27;
          --cta-text: #ffffff;
        }

        /* Tema Rosa Neon Hot */
        .theme-neon_pink {
          --bg-main: #100814;
          --card-bg: #1d1024;
          --text-title: #ffffff;
          --text-sub: #d8b4fe;
          --accent-blue: #ff2a85;
          --plan-bg: rgba(255, 42, 133, 0.12);
          --plan-border: #ff2a85;
          --badges-bg: rgba(16, 185, 129, 0.12);
          --badges-text: #10b981;
          --cta-bg: #ff2a85;
          --cta-hover: #ff4d9d;
          --cta-text: #ffffff;
        }

        /* Tema Midnight Purple */
        .theme-midnight_purple {
          --bg-main: #0a0512;
          --card-bg: #170c24;
          --text-title: #ffffff;
          --text-sub: #a78bfa;
          --accent-blue: #9333ea;
          --plan-bg: rgba(147, 51, 234, 0.12);
          --plan-border: #9333ea;
          --badges-bg: rgba(16, 185, 129, 0.12);
          --badges-text: #10b981;
          --cta-bg: #9333ea;
          --cta-hover: #a855f7;
          --cta-text: #ffffff;
        }

        /* Estilos Globais da Tela */
        .checkout-view {
          min-height: 100vh;
          background-color: var(--bg-main);
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: var(--text-title);
          padding-bottom: 60px;
        }

        .top-bar {
          text-align: center;
          padding: 12px 16px;
          font-size: 13.5px;
          color: var(--text-sub);
          background: rgba(0,0,0,0.02);
        }

        .top-bar a {
          color: var(--accent-blue);
          text-decoration: none;
        }

        .top-bar a:hover {
          text-decoration: underline;
        }

        .view-container {
          max-width: 1100px;
          margin: 20px auto 0;
          padding: 0 16px;
        }

        .view-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 28px;
          align-items: start;
        }

        /* COLUNA DA ESQUERDA */
        .left-card {
          background: var(--card-bg);
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .creator-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }

        .creator-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #b59868;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .creator-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .creator-info h2 {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-title);
          margin: 0;
        }

        .creator-info p {
          font-size: 13px;
          color: var(--text-sub);
          margin: 2px 0 0;
        }

        .step-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 4px;
        }

        .step-number {
          width: 24px;
          height: 24px;
          background: #1e293b;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
        }

        .step-title h3 {
          font-size: 17px;
          font-weight: 700;
          margin: 0;
          color: var(--text-title);
        }

        .access-banner {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          color: var(--text-sub);
        }

        .access-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          color: var(--accent-blue);
        }

        .tg-icon {
          width: 20px;
          height: 20px;
          background: var(--accent-blue);
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
        }

        /* CARD DO PLANO ÚNICO (Elegante & Limpo sem Fundo Azul Forte) */
        .single-plan-card {
          background-color: var(--card-bg);
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 12px;
          padding: 22px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: border-color 0.2s ease;
        }

        .theme-dark_vip .single-plan-card,
        .theme-hot_red .single-plan-card,
        .theme-neon_pink .single-plan-card,
        .theme-midnight_purple .single-plan-card {
          border-color: rgba(255, 255, 255, 0.14);
        }

        .single-plan-card .plan-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-title);
        }

        .single-plan-card .plan-price {
          font-size: 22px;
          font-weight: 900;
          color: var(--text-title);
        }

        .single-plan-card .plan-period {
          font-size: 12.5px;
          color: var(--text-sub);
          font-weight: 500;
        }

        /* CONTAINER DE BENEFÍCIOS DO PRODUTO */
        .benefits-container {
          background-color: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 10px;
          padding: 16px 20px;
        }

        .theme-dark_vip .benefits-container,
        .theme-hot_red .benefits-container,
        .theme-neon_pink .benefits-container,
        .theme-midnight_purple .benefits-container {
          background-color: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .benefits-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: var(--text-title);
          font-weight: 500;
        }

        .benefit-check {
          color: #10b981;
          font-weight: 900;
          font-size: 15px;
        }

        /* CARD DO PLANO SELECIONADO */
        .plan-selection-card {
          background: var(--plan-bg);
          border: 2px solid var(--plan-border);
          border-radius: 10px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }

        .plan-radio {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid var(--accent-blue);
          background: var(--accent-blue);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 14px;
          flex-shrink: 0;
        }

        .radio-inner {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ffffff;
        }

        .plan-details {
          flex: 1;
        }

        .plan-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-title);
        }

        .plan-price-block {
          text-align: right;
          display: flex;
          flex-direction: column;
        }

        .plan-price {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-title);
        }

        .plan-period {
          font-size: 12px;
          color: var(--text-sub);
        }

        /* BADGES DE CONFIANÇA */
        .trust-badges-row {
          background: var(--badges-bg);
          border-radius: 8px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-around;
          gap: 10px;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--badges-text);
          flex-wrap: wrap;
        }

        .trust-badge {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* TERMOS */
        .terms-row {
          margin-top: 4px;
        }

        .terms-checkbox {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12.5px;
          color: var(--text-sub);
          cursor: pointer;
          background: #f8fafc;
          padding: 12px 16px;
          border-radius: 6px;
        }

        .terms-checkbox input {
          display: none;
        }

        .checkmark {
          width: 18px;
          height: 18px;
          background: #10b981;
          color: #fff;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
        }

        /* CTA BUTTON */
        .cta-action {
          margin-top: 10px;
        }

        .cta-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          background: var(--cta-bg);
          color: var(--cta-text);
          padding: 16px;
          border-radius: 8px;
          font-size: 14.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          text-decoration: none;
          transition: background 0.2s ease, transform 0.1s ease;
        }

        .cta-button:hover {
          background: var(--cta-hover);
          transform: translateY(-1px);
        }

        .cta-arrow {
          font-size: 18px;
        }

        /* COLUNA DA DIREITA (Product Card) */
        .right-card {
          position: sticky;
          top: 20px;
        }

        .product-preview-card {
          background: var(--card-bg);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        .product-banner {
          width: 100%;
          height: 240px;
          background: #27272a;
          overflow: hidden;
          position: relative;
        }

        .product-banner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .banner-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
        }

        .product-card-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .product-card-title {
          font-size: 19px;
          font-weight: 800;
          color: var(--text-title);
          margin: 0;
        }

        .product-card-desc {
          font-size: 13.5px;
          color: var(--text-sub);
          line-height: 1.5;
          margin: 0;
        }

        .product-card-footer {
          margin-top: 10px;
          padding-top: 14px;
          border-top: 1px solid rgba(0,0,0,0.06);
        }

        .telegram-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: var(--text-sub);
        }

        @media (max-width: 860px) {
          .view-grid {
            grid-template-columns: 1fr;
          }
          .right-card {
            order: -1;
            position: static;
          }
        }
      `}</style>
    </div>
  );
}
