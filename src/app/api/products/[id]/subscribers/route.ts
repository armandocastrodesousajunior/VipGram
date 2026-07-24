import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Busca todos os assinantes desse produto direto do banco de dados local
    const subscribers = await query<any>(
      `SELECT 
        id, 
        syncpay_subscription_id, 
        customer_name, 
        customer_email, 
        customer_cpf, 
        customer_phone, 
        telegram_username, 
        telegram_user_id, 
        in_group, 
        payment_status, 
        created_at 
       FROM subscribers_meta 
       WHERE product_id = $1 
       ORDER BY created_at DESC`,
      [id]
    );

    return NextResponse.json({ subscribers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
