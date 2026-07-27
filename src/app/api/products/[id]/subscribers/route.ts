import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { query } from '@/lib/db';
import TelegramBot from 'node-telegram-bot-api';

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
    // Busca produto para saber o chat_id do grupo vinculado
    const productRows = await query<any>(
      'SELECT telegram_chat_id, bot_setup_done FROM products WHERE id = $1',
      [id]
    );
    const product = productRows[0];

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

    // Se o produto tem grupo configurado e há bot token, checar membros ao vivo
    if (product?.bot_setup_done && product?.telegram_chat_id && process.env.TELEGRAM_BOT_TOKEN) {
      const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
      const chatId = product.telegram_chat_id;

      for (const sub of subscribers) {
        if (!sub.telegram_user_id) continue;

        try {
          const member = await bot.getChatMember(chatId, parseInt(sub.telegram_user_id));
          const isInGroup = ['member', 'administrator', 'creator'].includes(member.status);

          if (isInGroup !== sub.in_group) {
            await query(
              'UPDATE subscribers_meta SET in_group = $1 WHERE id = $2',
              [isInGroup, sub.id]
            );
            sub.in_group = isInGroup;
          }
        } catch {
          // Usuário não encontrado no grupo = não está mais lá
          if (sub.in_group) {
            await query('UPDATE subscribers_meta SET in_group = FALSE WHERE id = $1', [sub.id]);
            sub.in_group = false;
          }
        }
      }
    }

    return NextResponse.json({ subscribers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
