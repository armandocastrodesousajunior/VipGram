'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Subscriber {
  id: string;
  syncpay_subscription_id: string;
  customer_name: string;
  customer_email: string;
  customer_cpf?: string;
  customer_phone?: string;
  telegram_username?: string;
  in_group: boolean;
  payment_status: string;
  created_at: string;
  product_id: string;
  product_name: string;
  product_slug?: string;
}

interface ProductInfo {
  id: string;
  name: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export default function GlobalSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    per_page: 20,
    total_pages: 1,
  });

  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Busca lista de produtos para o filtro
  useEffect(() => {
    fetch('/api/products?admin=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.products) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.error('Erro ao buscar produtos:', err));
  }, []);

  // Busca assinantes com filtros
  const fetchSubscribers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', currentPage.toString());
    params.set('per_page', '20');
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (productFilter) params.set('product_id', productFilter);

    fetch(`/api/admin/subscribers?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar assinantes');
        return res.json();
      })
      .then((data) => {
        setSubscribers(data.subscribers || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [currentPage, search, statusFilter, productFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubscribers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchSubscribers]);

  function statusBadge(status: string) {
    switch (status) {
      case 'ACTIVE':
      case 'PAID':
      case 'active':
      case 'paid':
        return <span className="badge badge-success">Ativo</span>;
      case 'CANCELLED':
      case 'cancelled':
      case 'canceled':
        return <span className="badge badge-danger">Cancelado</span>;
      case 'PENDING':
      case 'pending':
      case 'waiting':
        return <span className="badge badge-warning">Pendente</span>;
      default:
        return <span className="badge">{status || 'Desconhecido'}</span>;
    }
  }

  function handleFilterChange(type: 'status' | 'product', value: string) {
    setCurrentPage(1);
    if (type === 'status') setStatusFilter(value);
    if (type === 'product') setProductFilter(value);
  }

  function handleSearchChange(val: string) {
    setCurrentPage(1);
    setSearch(val);
  }

  function clearFilters() {
    setSearch('');
    setStatusFilter('');
    setProductFilter('');
    setCurrentPage(1);
  }

  const hasActiveFilters = Boolean(search || statusFilter || productFilter);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Link href="/admin/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14 }}>
            ← Voltar para o Dashboard
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="admin-page-title">Todos os Assinantes</h1>
            <p className="admin-page-subtitle">
              Gerencie e visualize todos os seus clientes e assinaturas em tempo real em um só lugar.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              🔄 Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="admin-card mb-6" style={{ padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Buscar Cliente
            </label>
            <input
              type="text"
              placeholder="Nome, e-mail, CPF ou @telegram..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Status da Assinatura
            </label>
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              <option value="" style={{ background: '#18181b' }}>Todos os Status</option>
              <option value="active" style={{ background: '#18181b' }}>✅ Ativo / Pago</option>
              <option value="pending" style={{ background: '#18181b' }}>⏳ Pendente</option>
              <option value="cancelled" style={{ background: '#18181b' }}>❌ Cancelado</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Filtrar por Produto
            </label>
            <select
              value={productFilter}
              onChange={(e) => handleFilterChange('product', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              <option value="" style={{ background: '#18181b' }}>Todos os Produtos</option>
              {products.map((p) => (
                <option key={p.id} value={p.id} style={{ background: '#18181b' }}>
                  📦 {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Assinantes */}
      <div className="admin-card">
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="spinner spinner-lg mx-auto mb-4" />
            <p>Carregando assinantes...</p>
          </div>
        ) : subscribers.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>📭</span>
            {hasActiveFilters
              ? 'Nenhum assinante encontrado para os filtros selecionados.'
              : 'Nenhum assinante cadastrado ainda.'}
            {hasActiveFilters && (
              <div style={{ marginTop: '16px' }}>
                <button
                  onClick={clearFilters}
                  style={{
                    background: 'var(--accent)',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Cliente</th>
                    <th>Status Pagamento</th>
                    <th>Telegram Username</th>
                    <th>No Grupo?</th>
                    <th>Data da Assinatura</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <Link
                          href={`/admin/products/${s.product_id}`}
                          style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <span style={{ fontSize: 16 }}>📦</span>
                          <span>{s.product_name}</span>
                        </Link>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {s.customer_name || '—'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {s.customer_email || '—'}
                        </div>
                        {s.customer_cpf && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            CPF: {s.customer_cpf}
                          </div>
                        )}
                      </td>
                      <td>{statusBadge(s.payment_status)}</td>
                      <td>
                        {s.telegram_username ? (
                          <a
                            href={`https://t.me/${s.telegram_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
                          >
                            @{s.telegram_username}
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Não vinculado</span>
                        )}
                      </td>
                      <td>
                        {s.in_group ? (
                          <span className="badge badge-success" style={{ fontSize: 11 }}>Sim</span>
                        ) : (
                          <span className="badge" style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>Não</span>
                        )}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {new Date(s.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Mostrando <strong style={{ color: 'var(--text-primary)' }}>{subscribers.length}</strong> de <strong style={{ color: 'var(--text-primary)' }}>{pagination.total}</strong> assinantes
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: currentPage <= 1 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)',
                    border: '1px solid var(--border)',
                    color: currentPage <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  ← Anterior
                </button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Página <strong style={{ color: 'var(--text-primary)', margin: '0 4px' }}>{currentPage}</strong> de {pagination.total_pages || 1}
                </span>
                <button
                  disabled={currentPage >= pagination.total_pages}
                  onClick={() => setCurrentPage((prev) => Math.min(pagination.total_pages, prev + 1))}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: currentPage >= pagination.total_pages ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)',
                    border: '1px solid var(--border)',
                    color: currentPage >= pagination.total_pages ? 'var(--text-muted)' : 'var(--text-primary)',
                    cursor: currentPage >= pagination.total_pages ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  Próxima →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .admin-page {
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .admin-page-header {
          margin-bottom: 24px;
        }

        .admin-page-title {
          font-size: 28px;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0 0 6px 0;
        }

        .admin-page-subtitle {
          font-size: 15px;
          color: var(--text-muted);
          margin: 0;
        }

        .admin-card {
          background-color: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        th, td {
          padding: 14px 20px;
          border-bottom: 1px solid var(--border);
        }

        th {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: rgba(255,255,255,0.02);
        }

        td {
          font-size: 14px;
          color: var(--text-primary);
        }

        tr:last-child td {
          border-bottom: none;
        }

        tr:hover td {
          background-color: rgba(255, 255, 255, 0.02);
        }

        .mb-6 {
          margin-bottom: 24px;
        }

        .mx-auto {
          margin-left: auto;
          margin-right: auto;
        }

        .mb-4 {
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
}
