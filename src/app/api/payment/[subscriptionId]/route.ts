import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  const { subscriptionId } = await params;

  try {
    const rows = await query(`
      SELECT 
        sm.syncpay_subscription_id AS id,
        sm.payment_status AS status,
        sm.pix_code,
        sm.pix_expires_at,
        sm.customer_name,
        p.name AS product_name,
        p.theme_color
      FROM subscribers_meta sm
      JOIN products p ON p.id = sm.product_id
      WHERE sm.syncpay_subscription_id = $1
    `, [subscriptionId]);

    if (!rows[0]) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('[Payment GET Error]:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
