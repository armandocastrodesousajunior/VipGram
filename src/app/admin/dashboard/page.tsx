'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Subscriber {
  id: string;
  status: string;
  created_at: string;
  customer: {
    name: string;
    email: string;
  };
  telegram_username?: string;
  in_group?: boolean;
}

interface DashboardStats {
  total: number;
  active: number;
  cancelled: number;
  products: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ total: 0, active: 0, cancelled: 0, products: 0 });
  const [recent, setRecent] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [subRes, prodRes] = await Promise.all([
          fetch('/api/syncpay/subscribers?per_page=10'),
          fetch('/api/products?admin=true'),
        ]);

        if (subRes.ok) {
          const { data, total } = await subRes.json();
          const active = (data as Subscriber[]).filter((s) => s.status === 'ACTIVE').length;
          const cancelled = (data as Subscriber[]).filter((s) => s.status === 'CANCELLED').length;
          setStats((prev) => ({ ...prev, total: total ?? data.length, active, cancelled }));
          setRecent((data as Subscriber[]).slice(0, 5));
        }

        if (prodRes.ok) {
          const { products } = await prodRes.json();
          setStats((prev) => ({ ...prev, products: products.length }));
        }
      } catch { /* ignora */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: 'badge-success', PENDING: 'badge-warning',
      CANCELLED: 'badge-error', PAUSED: 'badge-info',
    };
    return <span className={`badge ${map[status] ?? 'badge-info'}`}>{status}</span>;
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-sub">Visão geral do seu negócio</p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          <span>+</span> Novo Produto
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats">
        {[
          { label: 'Total Assinantes', value: loading ? '...' : stats.total, icon: '👥', color: 'var(--accent)' },
          { label: 'Assinantes Ativos', value: loading ? '...' : stats.active, icon: '✅', color: 'var(--color-success)' },
          { label: 'Cancelamentos', value: loading ? '...' : stats.cancelled, icon: '❌', color: 'var(--color-error)' },
          { label: 'Produtos Ativos', value: loading ? '...' : stats.products, icon: '📦', color: 'var(--color-info)' },
        ].map((s) => (
          <div className="dashboard-stat-card" key={s.label}>
            <div className="dashboard-stat-icon" style={{ color: s.color }}>{s.icon}</div>
            <div className="dashboard-stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="dashboard-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recentes */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Assinantes Recentes</h2>
          <Link href="/admin/subscribers" className="btn btn-ghost btn-sm">Ver todos →</Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center" style={{ padding: 40, gap: 12 }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : recent.length === 0 ? (
          <div className="dashboard-empty">
            <span style={{ fontSize: 40 }}>📭</span>
            <p>Nenhum assinante ainda.</p>
            <Link href="/admin/products/new" className="btn btn-primary btn-sm mt-3">
              Criar primeiro produto
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Telegram</th>
                  <th>No Grupo</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id} onClick={() => window.location.href = `/admin/subscribers/${s.id}`}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {s.customer?.name ?? '—'}
                    </td>
                    <td>{s.customer?.email ?? '—'}</td>
                    <td>{statusBadge(s.status)}</td>
                    <td>{new Date(s.created_at).toLocaleDateString('pt-BR')}</td>
                    <td>
                      {s.telegram_username ? (
                        <a 
                          href={`https://t.me/${s.telegram_username}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: 'var(--accent)', textDecoration: 'none' }}
                        >
                          @{s.telegram_username}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Não vinculado</span>
                      )}
                    </td>
                    <td>
                      {s.in_group ? (
                        <span className="badge badge-success" style={{ fontSize: 11 }}>Sim</span>
                      ) : (
                        <span className="badge" style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>Não</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .admin-page {
          padding: 32px;
          max-width: 1100px;
        }

        .admin-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          gap: 16px;
        }

        .admin-page-title {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .admin-page-sub {
          color: var(--text-muted);
          font-size: 14px;
        }

        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 8px;
        }

        .dashboard-stat-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: all var(--transition);
        }

        .dashboard-stat-card:hover {
          border-color: var(--color-border-hover);
          transform: translateY(-2px);
        }

        .dashboard-stat-icon { font-size: 28px; }
        .dashboard-stat-value { font-size: 36px; font-weight: 800; font-family: var(--font-display); }
        .dashboard-stat-label { font-size: 13px; color: var(--text-muted); }

        .dashboard-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px 20px;
          gap: 12px;
          color: var(--text-muted);
        }

        @media (max-width: 900px) {
          .dashboard-stats { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 600px) {
          .admin-page { padding: 20px 16px; }
          .dashboard-stats { grid-template-columns: 1fr; }
          .admin-page-header { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}
