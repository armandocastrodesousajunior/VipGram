import { NextRequest, NextResponse } from 'next/server';
import { getSubscription } from '@/lib/syncpay';
import { query } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const subscription = await getSubscription(id);

    // Atualiza status no banco local
    await query(
      `UPDATE subscribers_meta SET payment_status = $1 
       WHERE syncpay_subscription_id = $2`,
      [subscription.status, id]
    );

    return NextResponse.json({
      id: subscription.id,
      status: subscription.status,
      pix_qr_code: subscription.pix_qr_code,
      pix_qr_code_text: subscription.pix_qr_code_text,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
