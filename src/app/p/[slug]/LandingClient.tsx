'use client';

import { useState, useEffect } from 'react';
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
  gallery_images?: string[];
  preview_size?: string;
  carousel_position?: string;
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
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('sid');
    if (sid) {
      localStorage.setItem('chatbot_sid', sid);
      fetch('/api/tracking/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sid, action: 'page_view' })
      }).catch(console.error);
    }
  }, []);

  const theme = product.theme_color ?? 'clean_light';
  const creatorHandle = product.creator_name ? product.creator_name : `@${product.slug}`;
  const initials = getInitials(creatorHandle);

  const formattedDate = product.created_at
    ? new Date(product.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : '20/07/26';

  return (
    <div className={`checkout-view theme-${theme}`}>
      {/* Main Container */}
      <div className="view-container">
        
        {/* Banner Horizontal do Produto no Topo da Tela */}
        {product.show_banner !== false && product.banner_url && (
          <div className="top-banner-wrapper">
            <img
              src={product.banner_url}
              alt={product.name}
              className="top-banner-img"
              decoding="async"
              fetchPriority="high"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        )}

        {/* Card Principal do Checkout */}
        <div className="left-card">
          
          {/* Header do Criador */}
          {product.show_creator !== false && (
            <div className="creator-header">
              <div className="creator-avatar">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={creatorHandle}
                    decoding="async"
                    fetchPriority="high"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />
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

          {/* Helper de Renderização do Carrossel */}
          {(() => {
            const showBefore = product.carousel_position !== 'after_plan';
            const renderCarousel = () => {
              if (!product.gallery_images || product.gallery_images.length === 0) return null;
              return (
                <div className={`preview-carousel-wrapper size-${product.preview_size || '300x300'}`}>
                  <div className="preview-carousel-track">
                    {[...product.gallery_images, ...product.gallery_images].map((imgUrl, idx) => (
                      <div key={idx} className="preview-carousel-item">
                        <img
                          src={imgUrl}
                          alt={`Prévia ${idx + 1}`}
                          decoding="async"
                          draggable={false}
                          onContextMenu={(e) => e.preventDefault()}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            };

            return (
              <>
                {showBefore && renderCarousel()}

                {/* 1. Plano Único (Texto/Preço Solto sem Container) */}
                {(() => {
                  const activePlan = plan ?? { name: 'Plano VIP', amount: 0, periodicity_days: 7 };
                  return (
                    <div className="single-plan-clean">
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

                {/* 2. Descrição do Produto (Texto Solto sem Caixa/Container) */}
                {product.show_description !== false && product.description && (
                  <div className="product-description-loose">
                    <p className="product-description-text">{product.description}</p>
                  </div>
                )}

                {/* 3. Lista de Benefícios do Produto (Card de Benefícios) */}
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

                {!showBefore && renderCarousel()}
              </>
            );
          })()}

          {/* Termos e Condições Checkbox Reais com Modal */}
          <div className="terms-row">
            <label className="terms-checkbox-custom">
              <input
                type="checkbox"
                className="terms-native-checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <span className="custom-box">
                {acceptedTerms && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <span className="terms-text-label">
                Eu li e concordo com os{' '}
                <button
                  type="button"
                  className="terms-link-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowTermsModal(true);
                  }}
                >
                  Termos de Uso e Prestação de Serviço
                </button>
              </span>
            </label>
          </div>

          {/* Botão de Ação CTA */}
          <div className="cta-action">
            {acceptedTerms ? (
              <Link href={`/checkout/${product.slug}`} className="cta-button">
                <span>{product.cta_text || 'CONTINUAR PARA SEUS DADOS'}</span>
                <span className="cta-arrow">›</span>
              </Link>
            ) : (
              <button
                type="button"
                className="cta-button disabled"
                onClick={() => alert('Por favor, marque a caixa de aceite dos Termos de Uso para continuar.')}
              >
                <span>{product.cta_text || 'CONTINUAR PARA SEUS DADOS'}</span>
                <span className="cta-arrow">›</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Modal de Termos de Uso */}
      {showTermsModal && (
        <div className="terms-modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div className="terms-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="terms-modal-header">
              <h3>Termos de Uso e Prestação de Serviço</h3>
              <button type="button" className="terms-modal-close" onClick={() => setShowTermsModal(false)}>
                ✕
              </button>
            </div>

            <div className="terms-modal-body">
              <h4>1. Aceitação dos Termos</h4>
              <p>Ao assinar o produto <strong>{product.name}</strong>, você declara ter lido, compreendido e concordado integralmente com todos os termos e condições descritos neste documento.</p>

              <h4>2. Acesso ao Conteúdo Exclusivo</h4>
              <p>A assinatura concede acesso individual e intransferível à comunidade VIP e aos conteúdos disponibilizados pelo criador durante o período de vigência da sua assinatura.</p>

              <h4>3. Direitos Autorais e Proteção de Conteúdo</h4>
              <p>Todo o material disponibilizado (vídeos, fotos, áudios, textos) é protegido por direitos autorais. É estritamente proibido gravar, copiar, compartilhar ou redistribuir qualquer conteúdo sob pena de cancelamento imediato sem reembolso e medidas judiciais cabíveis.</p>

              <h4>4. Renovação e Cobrança Recorrente</h4>
              <p>A assinatura é cobrada de forma recorrente de acordo com o plano selecionado. O cancelamento pode ser efetuado a qualquer momento através do suporte ou da plataforma de pagamento.</p>

              <h4>5. Política de Cancelamento e Reembolso</h4>
              <p>Em conformidade com o Código de Defesa do Consumidor, o assinante tem o direito de solicitar o reembolso integral em até 7 (sete) dias corridos a contar da confirmação do pagamento inicial.</p>
            </div>

            <div className="terms-modal-footer">
              <button
                type="button"
                className="terms-modal-accept-btn"
                onClick={() => {
                  setAcceptedTerms(true);
                  setShowTermsModal(false);
                }}
              >
                Entendi e Concordo
              </button>
            </div>
          </div>
        </div>
      )}

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
          max-width: 760px;
          margin: 0 auto;
          padding: 32px 16px 0;
        }

        /* Banner Horizontal no Topo da Tela (Sem Bordas Arredondadas) */
        .top-banner-wrapper {
          width: 100%;
          height: 220px;
          border-radius: 0;
          overflow: hidden;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          position: relative;
          background-color: #18181b;
          pointer-events: none;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }

        .top-banner-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 0;
          pointer-events: none;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          -webkit-user-drag: none;
        }

        @media (max-width: 640px) {
          .view-container {
            padding: 16px 12px 0;
          }
          .left-card {
            padding: 22px 18px;
            gap: 16px;
          }
          .top-banner-wrapper {
            height: 160px;
            border-radius: 0;
            margin-bottom: 16px;
          }
        }

        /* CARD PRINCIPAL DO CHECKOUT */
        .left-card {
          background: var(--card-bg);
          border-radius: 14px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
          box-sizing: border-box;
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
          pointer-events: none;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }

        .creator-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          pointer-events: none;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          -webkit-user-drag: none;
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

        /* CARROSSEL DE PRÉVIAS INFINITO (PROPORÇÃO 1:1) */
        .preview-carousel-wrapper {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          overflow: hidden;
          position: relative;
          border-radius: 14px;
          margin-bottom: 16px;
          box-sizing: border-box;
          mask-image: linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%);
          pointer-events: none;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }

        .preview-carousel-track {
          display: flex;
          gap: 12px;
          width: max-content;
          animation: marqueeRight 24s linear infinite;
        }

        @keyframes marqueeRight {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0%);
          }
        }

        .preview-carousel-item {
          flex-shrink: 0;
          aspect-ratio: 1 / 1;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background-color: #000000;
          pointer-events: none;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }

        .theme-dark_vip .preview-carousel-item,
        .theme-hot_red .preview-carousel-item,
        .theme-neon_pink .preview-carousel-item,
        .theme-midnight_purple .preview-carousel-item {
          border-color: rgba(255, 255, 255, 0.12);
        }

        .preview-carousel-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          pointer-events: none;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          -webkit-user-drag: none;
        }

        /* Resoluções Configuráveis das Prévias (1:1) */
        .size-30x30 .preview-carousel-item { width: 30px; height: 30px; border-radius: 6px; }
        .size-50x50 .preview-carousel-item { width: 50px; height: 50px; border-radius: 8px; }
        .size-100x100 .preview-carousel-item { width: 100px; height: 100px; border-radius: 10px; }
        .size-200x200 .preview-carousel-item { width: 160px; height: 160px; border-radius: 12px; }
        .size-300x300 .preview-carousel-item { width: 240px; height: 240px; border-radius: 12px; }
        .size-400x400 .preview-carousel-item { width: 320px; height: 320px; border-radius: 14px; }
        .size-500x500 .preview-carousel-item { width: 400px; height: 400px; border-radius: 16px; }

        @media (max-width: 768px) {
          .preview-carousel-wrapper {
            mask-image: linear-gradient(to right, transparent 0%, black 0.5%, black 99.5%, transparent 100%);
            -webkit-mask-image: linear-gradient(to right, transparent 0%, black 0.5%, black 99.5%, transparent 100%);
          }
          .size-30x30 .preview-carousel-item { width: 28px; height: 28px; }
          .size-50x50 .preview-carousel-item { width: 44px; height: 44px; }
          .size-100x100 .preview-carousel-item { width: 85px; height: 85px; }
          .size-200x200 .preview-carousel-item { width: 140px; height: 140px; }
          .size-300x300 .preview-carousel-item { width: 200px; height: 200px; }
          .size-400x400 .preview-carousel-item { width: 260px; height: 260px; }
          .size-500x500 .preview-carousel-item { width: 300px; height: 300px; }
        }

        /* PLANO ÚNICO (Elegante & Limpo sem Container/Borda) */
        .single-plan-clean {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .theme-dark_vip .single-plan-clean,
        .theme-hot_red .single-plan-clean,
        .theme-neon_pink .single-plan-clean,
        .theme-midnight_purple .single-plan-clean {
          border-bottom-color: rgba(255, 255, 255, 0.08);
        }

        .single-plan-clean .plan-title {
          font-size: 19px;
          font-weight: 800;
          color: var(--text-title);
        }

        .single-plan-clean .plan-price {
          font-size: 22px;
          font-weight: 900;
          color: var(--text-title);
        }

        .single-plan-clean .plan-period {
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

        /* DESCRIÇÃO DO PRODUTO (TEXTO SOLTO SEM CONTAINER / CAIXA CINZA) */
        .product-description-loose {
          padding: 2px 0;
        }

        .product-description-text {
          font-size: 14.5px;
          color: var(--text-sub);
          line-height: 1.6;
          margin: 0;
          white-space: pre-wrap;
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

        /* TERMOS E CHECKBOX REAL INTERATIVO */
        .terms-row {
          margin-top: 4px;
        }

        .terms-checkbox-custom {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          user-select: none;
          padding: 4px 0;
        }

        .terms-checkbox-custom input,
        .terms-native-checkbox {
          display: none !important;
          opacity: 0 !important;
          width: 0 !important;
          height: 0 !important;
          position: absolute !important;
          pointer-events: none !important;
        }

        .custom-box {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 2px solid #71717a;
          background-color: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          flex-shrink: 0;
          margin-top: 2px;
          transition: all 0.15s ease;
        }

        .terms-checkbox-custom input[type="checkbox"]:checked + .custom-box {
          background-color: #10b981;
          border-color: #10b981;
        }

        .terms-text-label {
          font-size: 13px;
          color: var(--text-sub);
          line-height: 1.45;
        }

        .terms-link-btn {
          background: none;
          border: none;
          padding: 0;
          color: var(--text-title);
          font-weight: 700;
          text-decoration: underline;
          cursor: pointer;
          font-size: 13px;
          font-family: inherit;
          display: inline;
        }

        .terms-link-btn:hover {
          color: var(--accent-blue);
        }

        /* MODAL DE TERMOS DE USO */
        .terms-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .terms-modal-card {
          background-color: var(--card-bg);
          color: var(--text-title);
          width: 100%;
          max-width: 580px;
          max-height: 85vh;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .terms-modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .theme-dark_vip .terms-modal-header,
        .theme-hot_red .terms-modal-header,
        .theme-neon_pink .terms-modal-header,
        .theme-midnight_purple .terms-modal-header {
          border-bottom-color: rgba(255, 255, 255, 0.08);
        }

        .terms-modal-header h3 {
          font-size: 17px;
          font-weight: 800;
          margin: 0;
          color: var(--text-title);
        }

        .terms-modal-close {
          background: none;
          border: none;
          color: var(--text-sub);
          font-size: 18px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: color 0.15s ease;
        }

        .terms-modal-close:hover {
          color: var(--text-title);
        }

        .terms-modal-body {
          padding: 24px;
          overflow-y: auto;
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-sub);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .terms-modal-body h4 {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-title);
          margin: 8px 0 2px 0;
        }

        .terms-modal-body p {
          margin: 0;
        }

        .terms-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          background-color: rgba(0, 0, 0, 0.02);
          display: flex;
          justify-content: flex-end;
        }

        .theme-dark_vip .terms-modal-footer,
        .theme-hot_red .terms-modal-footer,
        .theme-neon_pink .terms-modal-footer,
        .theme-midnight_purple .terms-modal-footer {
          border-top-color: rgba(255, 255, 255, 0.08);
          background-color: rgba(255, 255, 255, 0.02);
        }

        .terms-modal-accept-btn {
          background-color: #10b981;
          color: #ffffff;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .terms-modal-accept-btn:hover {
          opacity: 0.9;
        }

        .cta-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
            grid-template-columns: minmax(0, 1fr);
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
