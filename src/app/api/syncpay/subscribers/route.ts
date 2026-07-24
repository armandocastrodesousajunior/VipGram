import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { listSubscribers } from '@/lib/syncpay';

export async function GET(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') ?? '1');
  const per_page = Number(searchParams.get('per_page') ?? '20');
  const status = searchParams.get('status') ?? undefined;

  try {
    const result = await listSubscribers({ page, per_page, status });
    
    // Extrai os IDs das assinaturas retornadas
    const items = result.data || [];
    const ids = items.map((sub: any) => sub.id);
    
    if (ids.length > 0) {
      const { query } = await import('@/lib/db');
      // Busca metadados locais para essas assinaturas
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
      const metas = await query<any>(
        `SELECT syncpay_subscription_id, telegram_username, telegram_user_id, in_group,
                customer_name, customer_email, created_at
         FROM subscribers_meta WHERE syncpay_subscription_id IN (${placeholders})`,
        ids
      );
      
      const metaMap = new Map();
      for (const m of metas) {
        metaMap.set(m.syncpay_subscription_id, m);
      }
      
      // Mescla os dados
      for (const sub of items) {
        const m = metaMap.get(sub.id);
        if (m) {
          sub.telegram_username = m.telegram_username;
          sub.telegram_user_id = m.telegram_user_id;
          sub.in_group = m.in_group;

          // Se a SyncPay não retornar nome ou email, preenche com o nosso banco
          if (!sub.customer) sub.customer = {} as any;
          if (!sub.customer.name || sub.customer.name.trim() === '') {
            sub.customer.name = m.customer_name;
          }
          if (!sub.customer.email || sub.customer.email.trim() === '') {
            sub.customer.email = m.customer_email;
          }

          // Ajustar também a data de criação, caso a SyncPay falhe
          if (!sub.created_at) {
            sub.created_at = m.created_at;
          }
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
