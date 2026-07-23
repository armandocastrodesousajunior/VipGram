'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin');
    router.refresh();
  }

  // Se estiver na página de login (/admin), renderiza direto sem a barra lateral
  if (pathname === '/admin') {
    return <>{children}</>;
  }

  const navItems = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1"/>
          <rect x="14" y="3" width="7" height="5" rx="1"/>
          <rect x="14" y="12" width="7" height="9" rx="1"/>
          <rect x="3" y="16" width="7" height="5" rx="1"/>
        </svg>
      ),
    },
    {
      href: '/admin/products',
      label: 'Produtos',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="admin-shell">
      {/* Sidebar Lateral Monocromática */}
      <aside className="admin-sidebar">
        {/* Logo / Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
          </div>
          <div className="brand-info">
            <span className="brand-title">VIP CHECKOUT</span>
            <span className="brand-badge">Super Admin</span>
          </div>
        </div>

        {/* Menu de Navegação */}
        <nav className="sidebar-nav">
          <span className="nav-section-title">Menu Principal</span>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="btn-logout"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <div className="spinner-sm" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            )}
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <div className="admin-wrapper">
        {/* Top Header */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <span className="topbar-breadcrumb">Admin</span>
            <span className="topbar-slash">/</span>
            <span className="topbar-current">
              {pathname.includes('products/new') ? 'Novo Produto' : pathname.includes('products/') ? 'Editar Produto' : pathname.includes('products') ? 'Produtos' : 'Dashboard'}
            </span>
          </div>
          <div className="topbar-right">
            <div className="system-status">
              <span className="status-dot" />
              <span>Sistema Ativo</span>
            </div>
          </div>
        </header>

        {/* Conteúdo da Página */}
        <main className="admin-content">
          {children}
        </main>
      </div>

      <style>{`
        .admin-shell {
          display: flex;
          min-height: 100vh;
          background-color: #09090b;
          color: #f4f4f5;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* Sidebar Lateral */
        .admin-sidebar {
          width: 250px;
          flex-shrink: 0;
          background-color: #121215;
          border-right: 1px solid #27272a;
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          height: 100vh;
          position: sticky;
          top: 0;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 24px;
          margin-bottom: 24px;
          border-bottom: 1px solid #27272a;
        }

        .brand-logo {
          width: 38px;
          height: 38px;
          background-color: #ffffff;
          color: #000000;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .brand-info {
          display: flex;
          flex-direction: column;
        }

        .brand-title {
          font-size: 13.5px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.05em;
        }

        .brand-badge {
          font-size: 11px;
          color: #71717a;
          font-weight: 500;
        }

        /* Nav */
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .nav-section-title {
          font-size: 11px;
          font-weight: 700;
          color: #52525b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 0 12px 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #a1a1aa;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .nav-item:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: #ffffff;
        }

        .nav-item.active {
          background-color: #ffffff;
          color: #000000;
          font-weight: 700;
        }

        .nav-item.active .nav-icon {
          color: #000000;
        }

        .nav-icon {
          display: flex;
          align-items: center;
          color: inherit;
        }

        .sidebar-footer {
          padding-top: 16px;
          border-top: 1px solid #27272a;
        }

        .btn-logout {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: transparent;
          border: 1px solid #27272a;
          border-radius: 8px;
          color: #a1a1aa;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-logout:hover {
          background-color: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        .spinner-sm {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        /* Topbar & Content */
        .admin-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .admin-topbar {
          height: 60px;
          border-bottom: 1px solid #27272a;
          background-color: #121215;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
        }

        .topbar-breadcrumb {
          color: #71717a;
        }

        .topbar-slash {
          color: #3f3f46;
        }

        .topbar-current {
          color: #ffffff;
          font-weight: 600;
        }

        .system-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #a1a1aa;
          background-color: #09090b;
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid #27272a;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
        }

        .admin-content {
          flex: 1;
          padding: 32px;
          overflow-y: auto;
        }

        @media (max-width: 768px) {
          .admin-sidebar { display: none; }
          .admin-topbar { padding: 0 16px; }
          .admin-content { padding: 16px; }
        }
      `}</style>
    </div>
  );
}
