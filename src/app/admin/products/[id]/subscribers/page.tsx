'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface LocalSubscriber {
  id: string;
  syncpay_subscription_id: string;
  customer_name: string;
  customer_email: string;
  customer_cpf: string;
  customer_phone?: string;
  telegram_username?: string;
  in_group: boolean;
  payment_status: string;
  created_at: string;
}

interface ProductInfo {
  id: string;
  name: string;
  slug: string;
}

export default function ProductSubscribersPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [subscribers, setSubscribers] = useState<LocalSubscriber[]>([]);
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca informações do produto
    fetch(`/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Produto não encontrado');
        return res.json();
      })
      .then((data) => setProduct(data))
      .catch(() => router.push('/admin/products'));

    // Busca os assinantes
    fetch(`/api/products/${id}/subscribers`)
      .then((res) => res.json())
      .then((data) => {
        setSubscribers(data.subscribers || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id, router]);

  function statusBadge(status: string) {
    switch (status) {
      case 'ACTIVE':
      case 'PAID':
      case 'active':
      case 'paid':
        return <span className="badge badge-success">Ativo</span>;
      case 'CANCELLED':
      case 'cancelled':
        return <span className="badge badge-danger">Cancelado</span>;
      case 'PENDING':
      case 'pending':
        return <span className="badge badge-warning">Pendente</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Link href="/admin/products" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14 }}>
              ← Voltar para Produtos
            </Link>
          </div>
          <h1 className="admin-page-title">
            Assinantes: {product ? product.name : 'Carregando...'}
          </h1>
          <p className="admin-page-subtitle">
            Mostrando todos os assinantes deste produto. Dados atualizados do banco local.
          </p>
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Carregando assinantes...
          </div>
        ) : subscribers.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>📭</span>
            Nenhum assinante encontrado para este produto.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Status do Pagamento</th>
                  <th>Data da Assinatura</th>
                  <th>Telegram Username</th>
                  <th>No Grupo?</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {s.customer_name || '—'}
                    </td>
                    <td>{s.customer_email || '—'}</td>
                    <td>{statusBadge(s.payment_status)}</td>
                    <td>{new Date(s.created_at).toLocaleString('pt-BR')}</td>
                    <td>
                      {s.telegram_username ? (
                        <a 
                          href={`https://t.me/${s.telegram_username}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
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
          max-width: 1200px;
          margin: 0 auto;
        }

        .admin-page-header {
          margin-bottom: 32px;
        }

        .admin-page-title {
          font-size: 28px;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0 0 8px 0;
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
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }

        th {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background-color: rgba(255, 255, 255, 0.02);
        }

        td {
          font-size: 14px;
          color: var(--text-secondary);
        }

        tr:last-child td {
          border-bottom: none;
        }

        .badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background-color: rgba(255,255,255,0.1);
          color: var(--text-primary);
        }

        .badge-success {
          background-color: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .badge-warning {
          background-color: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .badge-danger {
          background-color: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
      `}</style>
    </div>
  );
}
