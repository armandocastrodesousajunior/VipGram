import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import TelegramBot from 'node-telegram-bot-api';
import { generateUniqueInviteLink } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Supondo que o SyncPay envia { subscription_id, status }
    const { subscription_id, status } = data;

    if (!subscription_id || !status) {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
    }

    // Atualiza status local
    await query(
      'UPDATE subscribers_meta SET payment_status = $1, updated_at = NOW() WHERE syncpay_subscription_id = $2',
      [status.toLowerCase(), subscription_id]
    );

    // Se o pagamento for confirmado e foi gerado no Chatbot
    // Se o pagamento for confirmado
    if (['active', 'paid'].includes(status.toLowerCase())) {
      const meta = await queryOne<any>(
        'SELECT product_id, telegram_user_id, bot_delivered, chatbot_session_id FROM subscribers_meta WHERE syncpay_subscription_id = $1',
        [subscription_id]
      );

      // Atualiza as métricas da sessão se existir vínculo
      if (meta && meta.chatbot_session_id) {
        // Incrementamos purchases (e, de quebra, evitamos duplicar caso a webhook seja chamada duas vezes usando um check simples se for necessário)
        // Aqui fazemos um incremento cego para simplificar, mas seria bom garantir idempotência futuramente
        await query('UPDATE chatbot_sessions SET purchases = purchases + 1 WHERE id = $1', [meta.chatbot_session_id]).catch(() => {});
      }

      // Se o PIX foi gerado in-chat (tem telegram_user_id) e ainda não entregue
      if (meta && meta.telegram_user_id && !meta.bot_delivered) {
        
        // Verifica qual chatbot o usuário interagiu por último para enviar a mensagem pelo bot correto
        const session = await queryOne<any>(
          'SELECT chatbot_id FROM chatbot_sessions WHERE telegram_user_id = $1 ORDER BY last_interaction DESC LIMIT 1',
          [meta.telegram_user_id]
        );
        
        let chatbot = null;
        if (session) {
          chatbot = await queryOne<any>('SELECT bot_token, type FROM chatbots WHERE id = $1 AND is_active = TRUE', [session.chatbot_id]);
        }
        
        if (chatbot && chatbot.bot_token) {
          const product = await queryOne<any>('SELECT telegram_chat_id FROM products WHERE id = $1', [meta.product_id]);
          
          if (product && product.telegram_chat_id) {
            const invite_link = await generateUniqueInviteLink(product.telegram_chat_id, `VIP-${subscription_id.slice(0, 8)}`);
            
            // Marca como entregue
            await query(
              'UPDATE subscribers_meta SET bot_delivered = TRUE, bot_delivered_at = NOW(), invite_link = $1 WHERE syncpay_subscription_id = $2',
              [invite_link, subscription_id]
            );

            // Dispara mensagem no Telegram
            const bot = new TelegramBot(chatbot.bot_token, { polling: false });
            // Se for standard a API aceita enviar direto para o chat ID sendo o próprio telegram_user_id
            await bot.sendMessage(meta.telegram_user_id, `🎉 *Pagamento Aprovado!*\n\nSeu acesso VIP foi liberado. Clique no botão abaixo para entrar no grupo:`, {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: 'Entrar no Grupo VIP', url: invite_link }]
                ]
              }
            });
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook SyncPay Error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
