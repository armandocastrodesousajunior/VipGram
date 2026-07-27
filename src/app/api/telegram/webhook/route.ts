import { NextRequest, NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { query, queryOne } from '@/lib/db';
import { generateUniqueInviteLink } from '@/lib/telegram';
import { getSubscription } from '@/lib/syncpay';

// Avoid initializing bot instance globally on edge or serverless if possible,
// but we only need it to send messages in response to webhooks.
function getBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set');
  }
  return new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
}

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    const bot = getBot();

    // Log apenas em desenvolvimento para debug
    if (process.env.NODE_ENV !== 'production') {
      console.log('--- NOVO EVENTO DO TELEGRAM ---');
      console.log(JSON.stringify(update, null, 2));
      console.log('-------------------------------');
    }

    // 1. Handle incoming /start message or /vincular in channels
    const msg = update.message || update.channel_post;

    if (msg && msg.text) {
      const text = msg.text;
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      const username = msg.from?.username || msg.from?.first_name || '';

      if (text.startsWith('/vincular ')) {
        const token = text.split(' ')[1];
        if (!token) return NextResponse.json({ ok: true });

        const product = await queryOne<any>(
          'SELECT id FROM products WHERE telegram_sync_token = $1',
          [token]
        );

        if (product) {
          await query(
            `UPDATE products 
             SET telegram_chat_id = $1, telegram_chat_name = $2, bot_setup_done = TRUE, telegram_sync_token = NULL 
             WHERE id = $3`,
            [msg.chat.id.toString(), msg.chat.title || 'Grupo VIP', product.id]
          );
          await bot.sendMessage(chatId, '✅ Grupo vinculado com sucesso ao seu painel!');
        }
        return NextResponse.json({ ok: true });
      }

      if (text.startsWith('/start ')) {
        const subscriptionId = text.split(' ')[1];
        
        if (!subscriptionId) {
          await bot.sendMessage(chatId, 'Código de assinatura inválido.');
          return NextResponse.json({ ok: true });
        }

        // Busca metadados do assinante
        const meta = await queryOne<any>(
          'SELECT * FROM subscribers_meta WHERE syncpay_subscription_id = $1',
          [subscriptionId]
        );

        if (!meta) {
          await bot.sendMessage(chatId, 'Assinatura não encontrada.');
          return NextResponse.json({ ok: true });
        }

        // Verifica se já está vinculado a outra conta
        if (meta.telegram_user_id && meta.telegram_user_id !== userId.toString()) {
          await bot.sendMessage(chatId, 'Esta assinatura já foi vinculada a outra conta do Telegram.');
          return NextResponse.json({ ok: true });
        }

        // Verifica se a assinatura está paga no SyncPay
        try {
          const subscription = await getSubscription(subscriptionId);
          const isPaid = ['ACTIVE', 'PAID', 'active', 'paid'].includes(subscription.status);

          if (!isPaid) {
            await bot.sendMessage(chatId, 'O pagamento desta assinatura ainda não foi confirmado.');
            return NextResponse.json({ ok: true });
          }
          
          // Atualiza o status de pagamento no banco
          await query(
            'UPDATE subscribers_meta SET payment_status = $1 WHERE syncpay_subscription_id = $2',
            [subscription.status, subscriptionId]
          );
        } catch (error) {
          console.error('Error fetching subscription from SyncPay:', error);
          await bot.sendMessage(chatId, 'Houve um erro ao verificar sua assinatura. Tente novamente mais tarde.');
          return NextResponse.json({ ok: true });
        }

        // Busca o produto associado
        const product = await queryOne<any>(
          'SELECT telegram_chat_id, bot_setup_done, name FROM products WHERE id = $1',
          [meta.product_id]
        );

        if (!product || !product.telegram_chat_id || !product.bot_setup_done) {
          await bot.sendMessage(chatId, 'O acesso ao grupo ainda não está configurado para este produto.');
          return NextResponse.json({ ok: true });
        }

        // Gera o link de acesso exclusivo
        const invite_link = await generateUniqueInviteLink(
          product.telegram_chat_id,
          `VIP-${subscriptionId.slice(0, 8)}`
        );

        // Atualiza os dados no banco
        await query(
          `UPDATE subscribers_meta 
           SET telegram_user_id = $1, telegram_username = $2, bot_delivered = TRUE, bot_delivered_at = NOW(), invite_link = $3
           WHERE syncpay_subscription_id = $4`,
          [userId.toString(), username, invite_link, subscriptionId]
        );

        // Envia mensagem de sucesso com o botão inline
        await bot.sendMessage(chatId, '🎉 *Assinatura confirmada!*\n\nClique no botão abaixo para acessar seu Grupo VIP. Este link é único e exclusivo para você.', {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Acessar Grupo VIP', url: invite_link }]
            ]
          }
        });

      } else if (text === '/start') {
         await bot.sendMessage(chatId, 'Olá! Para acessar o seu grupo VIP, por favor utilize o botão na sua página de confirmação de pagamento.');
      }
    }

    // 2. Handle chat_member / my_chat_member updates (when someone joins/leaves)
    const memberUpdate = update.chat_member || update.my_chat_member;
    if (memberUpdate) {
      const newChatMember = memberUpdate.new_chat_member;
      const memberId = newChatMember.user.id;
      const status = newChatMember.status;

      if (['member', 'administrator', 'creator'].includes(status)) {
        await query(
          'UPDATE subscribers_meta SET in_group = TRUE WHERE telegram_user_id = $1',
          [memberId.toString()]
        );
        console.log(`[Bot] Usuário ${memberId} entrou no grupo. Status: ${status}`);
      } else if (['left', 'kicked', 'restricted'].includes(status)) {
        await query(
          'UPDATE subscribers_meta SET in_group = FALSE WHERE telegram_user_id = $1',
          [memberId.toString()]
        );
        console.log(`[Bot] Usuário ${memberId} saiu/foi removido. Status: ${status}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
