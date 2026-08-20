'use client';

export default function MetricsDashboardClient({ metrics, chatbotName }: { metrics: any; chatbotName: string }) {
  const conversionRate = metrics.totalLeads > 0 
    ? ((metrics.purchases / metrics.totalLeads) * 100).toFixed(1) 
    : '0.0';

  const cartAbandonmentRate = metrics.checkoutViews > 0 
    ? ((metrics.abandonedCarts / metrics.checkoutViews) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Dashboard de Vendas</h2>
        <div className="conversion-badge">
          Conversão Geral: <strong>{conversionRate}%</strong>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon leads">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Leads Coletados</p>
            <h3 className="kpi-value">{metrics.totalLeads}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon clicks">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M2 12h4l3-9 5 18 3-9h5"></path>
            </svg>
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Acessos à Página</p>
            <h3 className="kpi-value">{metrics.pageViews}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Inícios de Checkout</p>
            <h3 className="kpi-value">{metrics.checkoutViews}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon sales">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Vendas Realizadas</p>
            <h3 className="kpi-value">{metrics.purchases}</h3>
          </div>
        </div>
      </div>

      <div className="funnel-section">
        <h3 className="section-title">Funil de Conversão</h3>
        <p className="section-subtitle">Acompanhe onde você está perdendo seus leads.</p>
        
        <div className="funnel-container">
          <div className="funnel-step">
            <div className="step-info">
              <h4>1. Início do Chatbot</h4>
              <span>Entrou no robô</span>
            </div>
            <div className="step-bar-container">
              <div className="step-bar leads-bg" style={{ width: '100%' }}>
                <span className="step-number">{metrics.totalLeads}</span>
              </div>
            </div>
          </div>

          <div className="funnel-step">
            <div className="step-info">
              <h4>2. Interesse</h4>
              <span>Clicou no Link</span>
            </div>
            <div className="step-bar-container">
              <div 
                className="step-bar clicks-bg" 
                style={{ width: `${metrics.totalLeads > 0 ? Math.max((metrics.pageViews / metrics.totalLeads) * 100, 5) : 0}%` }}
              >
                <span className="step-number">{metrics.pageViews}</span>
              </div>
            </div>
          </div>

          <div className="funnel-step">
            <div className="step-info">
              <h4>3. Intenção de Compra</h4>
              <span>Chegou no Checkout</span>
            </div>
            <div className="step-bar-container">
              <div 
                className="step-bar cart-bg" 
                style={{ width: `${metrics.totalLeads > 0 ? Math.max((metrics.checkoutViews / metrics.totalLeads) * 100, 5) : 0}%` }}
              >
                <span className="step-number">{metrics.checkoutViews}</span>
              </div>
            </div>
            {metrics.abandonedCarts > 0 && (
              <div className="abandonment-warning">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                {metrics.abandonedCarts} abandonaram aqui ({cartAbandonmentRate}%)
              </div>
            )}
          </div>

          <div className="funnel-step">
            <div className="step-info">
              <h4>4. Venda!</h4>
              <span>Pagamento Confirmado</span>
            </div>
            <div className="step-bar-container">
              <div 
                className="step-bar sales-bg" 
                style={{ width: `${metrics.totalLeads > 0 ? Math.max((metrics.purchases / metrics.totalLeads) * 100, 5) : 0}%` }}
              >
                <span className="step-number">{metrics.purchases}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 32px;
          animation: fade-in 0.4s ease-out;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dashboard-header h2 {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .conversion-badge {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          border: 1px solid rgba(16, 185, 129, 0.3);
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.1);
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }

        .kpi-card {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }

        .kpi-card:hover {
          transform: translateY(-4px);
          border-color: #3f3f46;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .kpi-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .kpi-icon.leads { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
        .kpi-icon.clicks { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
        .kpi-icon.cart { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
        .kpi-icon.sales { background: rgba(16, 185, 129, 0.15); color: #10b981; }

        .kpi-content {
          display: flex;
          flex-direction: column;
        }

        .kpi-label {
          color: #a1a1aa;
          font-size: 13px;
          font-weight: 500;
          margin: 0 0 4px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .kpi-value {
          color: #fff;
          font-size: 28px;
          font-weight: 800;
          margin: 0;
          line-height: 1;
        }

        .funnel-section {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 16px;
          padding: 32px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 6px 0;
        }

        .section-subtitle {
          color: #71717a;
          font-size: 14px;
          margin: 0 0 32px 0;
        }

        .funnel-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .funnel-step {
          display: flex;
          align-items: center;
          gap: 24px;
          position: relative;
        }

        .step-info {
          width: 180px;
          flex-shrink: 0;
        }

        .step-info h4 {
          color: #e4e4e7;
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .step-info span {
          color: #71717a;
          font-size: 12.5px;
        }

        .step-bar-container {
          flex-grow: 1;
          height: 44px;
          background: #27272a;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }

        .step-bar {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 0 16px;
          border-radius: 8px;
          transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .leads-bg { background: linear-gradient(90deg, #1d4ed8, #3b82f6); }
        .clicks-bg { background: linear-gradient(90deg, #7e22ce, #a855f7); }
        .cart-bg { background: linear-gradient(90deg, #b45309, #f59e0b); }
        .sales-bg { background: linear-gradient(90deg, #047857, #10b981); }

        .step-number {
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }

        .abandonment-warning {
          position: absolute;
          bottom: -22px;
          left: 204px;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #ef4444;
          font-size: 12px;
          font-weight: 500;
          background: rgba(239, 68, 68, 0.1);
          padding: 4px 10px;
          border-radius: 12px;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .funnel-step {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .step-bar-container {
            width: 100%;
          }
          .abandonment-warning {
            left: 0;
            bottom: -28px;
          }
          .funnel-container {
            gap: 40px;
          }
        }
      `}</style>
    </div>
  );
}
