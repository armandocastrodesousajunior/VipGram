'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function getInitials(name: string) {
  if (!name) return 'VIP';
  const clean = name.replace('@', '').trim();
  const parts = clean.split(/[\s_-]+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

interface ProductInfo {
  name: string;
  theme_color: string | null;
  image_url: string | null;
  banner_url: string | null;
  creator_name: string | null;
}

export default function RecoveryClient({ product, slug }: { product: ProductInfo; slug: string }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const theme = product.theme_color ?? 'clean_light';
  const creatorHandle = product.creator_name ? product.creator_name : `@${slug}`;
  const initials = getInitials(creatorHandle);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setError('Por favor, digite seu E-mail, CPF ou Telefone.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/products/${slug}/recovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search_term: searchTerm }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao localizar compra.');
        setLoading(false);
        return;
      }

      // Se pago ou ativo, vai pra tela de sucesso do telegram.
      // Se pendente, vai pra tela de pagamento (Pix Copia e Cola / QR Code).
      const status = data.status?.toLowerCase();
      if (['active', 'paid'].includes(status)) {
        router.push(`/success/telegram/${data.subscriptionId}`);
      } else if (['pending', 'waiting', 'pending_first_payment', 'waiting_payment'].includes(status)) {
        router.push(`/payment/${data.subscriptionId}`);
      } else {
        // Se cancelado, estornado etc.
        setError(`Sua compra encontra-se no status: ${status}. Não é possível recuperar o acesso.`);
        setLoading(false);
      }
    } catch (err) {
      setError('Ocorreu um erro interno. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  return (
    <div className={`checkout-view theme-${theme}`}>
      <div className="view-container">
        
        <div className="left-card" style={{ maxWidth: 500, margin: '0 auto', width: '100%' }}>
          
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <div style={{
              display: 'inline-block',
              background: 'var(--color-surface-2)',
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginBottom: 16,
              fontWeight: 600,
              border: '1px solid var(--color-border)'
            }}>
              {product.name}
            </div>
            
            <h1 className="checkout-product-title" style={{ fontSize: 24 }}>Recuperar Acesso</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
              Fechou a página sem querer? Informe o dado utilizado na compra para localizarmos sua assinatura e liberar seu acesso ao grupo.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field-group">
              <label className="field-label">E-mail, CPF ou Telefone</label>
              <input
                type="text"
                className="field-input"
                placeholder="Digite o dado informado na compra"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div style={{ padding: 12, background: 'var(--color-error-bg)', color: 'var(--color-error)', borderRadius: 8, fontSize: 14 }}>
                {error}
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <div className="spinner" /> : 'Localizar Minha Compra'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
