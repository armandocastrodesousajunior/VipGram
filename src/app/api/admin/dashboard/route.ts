import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    // Total de assinantes
    const totalRows = await query<any>('SELECT COUNT(*) as count FROM subscribers_meta', []);
    const total = parseInt(totalRows[0]?.count ?? '0');

    // Assinantes ativos (status = ACTIVE ou active ou PAID ou paid)
    const activeRows = await query<any>(
      `SELECT COUNT(*) as count FROM subscribers_meta 
       WHERE LOWER(payment_status) IN ('active', 'paid')`,
      []
    );
    const active = parseInt(activeRows[0]?.count ?? '0');

    // Cancelados
    const cancelledRows = await query<any>(
      `SELECT COUNT(*) as count FROM subscribers_meta 
       WHERE LOWER(payment_status) IN ('cancelled', 'canceled')`,
      []
    );
    const cancelled = parseInt(cancelledRows[0]?.count ?? '0');

    // Produtos ativos
    const productsRows = await query<any>(
      'SELECT COUNT(*) as count FROM products WHERE is_active = TRUE',
      []
    );
    const products = parseInt(productsRows[0]?.count ?? '0');

    // Assinantes recentes (últimos 10)
    const recentRows = await query<any>(
      `SELECT 
        sm.id,
        sm.syncpay_subscription_id,
        sm.customer_name,
        sm.customer_email,
        sm.payment_status AS status,
        sm.telegram_username,
        sm.in_group,
        sm.created_at,
        p.name AS product_name
       FROM subscribers_meta sm
       JOIN products p ON p.id = sm.product_id
       ORDER BY sm.created_at DESC
       LIMIT 10`,
      []
    );

    return NextResponse.json({
      stats: { total, active, cancelled, products },
      recent: recentRows,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
