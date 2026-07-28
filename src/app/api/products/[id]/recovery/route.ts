import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSubscription } from '@/lib/syncpay';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: slug } = await params;

  try {
    const { search_term } = await req.json();

    if (!search_term || typeof search_term !== 'string') {
      return NextResponse.json({ error: 'Termo de busca inválido' }, { status: 400 });
    }

    // Limpa o termo para comparação flexível (remove espaços extras)
    const cleanTerm = search_term.trim();

    // Primeiro encontra o produto
    const product = await queryOne<{ id: string }>('SELECT id FROM products WHERE slug = $1', [slug]);
    
    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Busca a assinatura
    // Compara o termo com email, cpf ou telefone.
    const rows = await query(`
      SELECT syncpay_subscription_id, payment_status
      FROM subscribers_meta
      WHERE product_id = $1
        AND (
          customer_email ILIKE $2 OR
          REPLACE(REPLACE(REPLACE(customer_cpf, '.', ''), '-', ''), ' ', '') = REPLACE(REPLACE(REPLACE($2, '.', ''), '-', ''), ' ', '') OR
          REPLACE(REPLACE(REPLACE(REPLACE(customer_phone, ' ', ''), '(', ''), ')', ''), '-', '') = REPLACE(REPLACE(REPLACE(REPLACE($2, ' ', ''), '(', ''), ')', ''), '-', '')
        )
      ORDER BY created_at DESC
      LIMIT 1
    `, [product.id, cleanTerm]);

    if (!rows[0]) {
      return NextResponse.json({ error: 'Nenhuma compra localizada com esses dados.' }, { status: 404 });
    }

    const sub = rows[0] as { payment_status: string; syncpay_subscription_id: string };
    let currentStatus = sub.payment_status;

    // Se estiver pendente, consulta a API do gateway para ver se já foi pago (como solicitado pelo usuário)
    const pendingStatuses = ['pending', 'waiting', 'pending_first_payment', 'waiting_payment'];
    if (pendingStatuses.includes(currentStatus.toLowerCase())) {
      try {
        const syncpayData = await getSubscription(sub.syncpay_subscription_id);
        const newStatus = syncpayData.status || currentStatus;

        if (newStatus !== currentStatus) {
          // Atualiza no banco local
          await query(
            'UPDATE subscribers_meta SET payment_status = $1 WHERE syncpay_subscription_id = $2',
            [newStatus, sub.syncpay_subscription_id]
          );
          currentStatus = newStatus;
        }
      } catch (apiError) {
        console.error('[Recovery Sync Error]:', apiError);
        // Continua com o status local em caso de erro na API
      }
    }

    return NextResponse.json({
      subscriptionId: sub.syncpay_subscription_id,
      status: currentStatus
    });
  } catch (error) {
    console.error('[Recovery POST Error]:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
