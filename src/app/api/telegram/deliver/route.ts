import { NextRequest, NextResponse } from 'next/server';
import { getSubscription } from '@/lib/syncpay';
import { generateUniqueInviteLink } from '@/lib/telegram';
import { query, queryOne } from '@/lib/db';

interface Product {
  telegram_chat_id: string;
  bot_setup_done: boolean;
  name: string;
}

interface SubscriberMeta {
  id: string;
  product_id: string;
  bot_delivered: boolean;
  invite_link: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const { subscription_id } = await request.json();

    if (!subscription_id) {
      return NextResponse.json({ error: 'subscription_id é obrigatório' }, { status: 400 });
    }

    // Verifica se assinatura existe e está paga
    const subscription = await getSubscription(subscription_id);
    const isPaid = ['ACTIVE', 'PAID', 'active', 'paid'].includes(subscription.status);

    if (!isPaid) {
      return NextResponse.json(
        { error: 'Pagamento ainda não confirmado', status: subscription.status },
        { status: 402 }
      );
    }

    // Busca metadados do assinante
    const meta = await queryOne<SubscriberMeta>(
      'SELECT * FROM subscribers_meta WHERE syncpay_subscription_id = $1',
      [subscription_id]
    );

    if (!meta) {
      return NextResponse.json({ error: 'Assinante não encontrado' }, { status: 404 });
    }

    // Se já entregou, retorna o link existente
    if (meta.bot_delivered && meta.invite_link) {
      return NextResponse.json({ invite_link: meta.invite_link, already_delivered: true });
    }

    // Busca produto e valida bot configurado
    const product = await queryOne<Product>(
      'SELECT telegram_chat_id, bot_setup_done, name FROM products WHERE id = $1',
      [meta.product_id]
    );

    if (!product?.telegram_chat_id || !product.bot_setup_done) {
      return NextResponse.json(
        { error: 'Bot Telegram não configurado para este produto' },
        { status: 500 }
      );
    }

    // Gera link de convite único
    const invite_link = await generateUniqueInviteLink(
      product.telegram_chat_id,
      `VIP-${subscription_id.slice(0, 8)}`
    );

    // Salva no banco
    await query(
      `UPDATE subscribers_meta 
       SET bot_delivered = TRUE, bot_delivered_at = NOW(), 
           invite_link = $1, payment_status = $2
       WHERE syncpay_subscription_id = $3`,
      [invite_link, subscription.status, subscription_id]
    );

    return NextResponse.json({ invite_link, already_delivered: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao entregar acesso';

    // Salva o erro no banco para debugging
    try {
      const body = await request.clone().json().catch(() => ({}));
      if (body.subscription_id) {
        await query(
          `UPDATE subscribers_meta SET delivery_error = $1 
           WHERE syncpay_subscription_id = $2`,
          [message, body.subscription_id]
        );
      }
    } catch { /* ignora erro no log */ }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
