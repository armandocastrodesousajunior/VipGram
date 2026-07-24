import { query } from '@/lib/db';
import { Suspense } from 'react';
import PaymentClient from './PaymentClient';

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ subscriptionId: string }>;
}) {
  const { subscriptionId } = await params;

  // Busca o theme do produto para aplicar paleta de cor correta
  let theme = 'clean_light';
  try {
    const rows = await query(`
      SELECT p.theme_color
      FROM products p
      JOIN subscribers_meta sm ON p.id = sm.product_id
      WHERE sm.syncpay_subscription_id = $1
    `, [subscriptionId]);
    theme = (rows[0]?.theme_color as string) ?? 'clean_light';
  } catch { /* fallback seguro */ }

  return (
    <div className={`checkout-view theme-${theme}`}>
      <div className="view-container">
        <Suspense fallback={null}>
          <PaymentClient subscriptionId={subscriptionId} />
        </Suspense>
      </div>
    </div>
  );
}
