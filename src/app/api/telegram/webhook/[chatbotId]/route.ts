import { NextRequest, NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { query, queryOne } from '@/lib/db';
import { generatePixForBot } from '@/lib/syncpay';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  try {
    const { chatbotId } = await params;
    const update = await request.json();
    
    // Buscar o chatbot no banco
    const chatbot = await queryOne<any>('SELECT * FROM chatbots WHERE id = $1 AND is_active = TRUE', [chatbotId]);
    if (!chatbot) return NextResponse.json({ ok: false, error: 'Chatbot not found or inactive' });

    const bot = new TelegramBot(chatbot.bot_token, { polling: false });

    // 1. Lidar com cliques em botões (Callback Queries)
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat.id;
      const dataParts = cb.data.split(':');
      const action = dataParts[0]; 
      const telegramUserId = cb.from.id;
      
      const session = await queryOne<any>(
        'SELECT is_paused FROM chatbot_sessions WHERE chatbot_id = $1 AND telegram_user_id = $2',
        [chatbotId, telegramUserId.toString()]
      );

      if (session && session.is_paused) {
        return NextResponse.json({ ok: true, reason: 'session_paused' });
      }
      
      await fetch(`https://api.telegram.org/bot${chatbot.bot_token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: cb.id })
      });

      if (action === 'generate_pix') {
        const productId = dataParts[1];
        if (!productId) return NextResponse.json({ ok: true });

        await bot.sendMessage(chatId, '🔄 Gerando seu PIX seguro...', { business_connection_id: cb.message?.business_connection_id });
        
        try {
          const product = await queryOne<any>('SELECT slug, syncpay_plan_id FROM products WHERE id = $1', [productId]);
          if (!product) throw new Error('Produto não encontrado');

          const pixData = await generatePixForBot(product.syncpay_plan_id, telegramUserId, productId);

          await bot.sendMessage(chatId, `✅ *PIX Gerado com sucesso!*\n\nCopie o código abaixo e pague no seu aplicativo do banco. Assim que pago, o link do grupo será liberado automaticamente aqui mesmo.\n\n\`${pixData.pix_code}\``, {
            parse_mode: 'Markdown',
            business_connection_id: cb.message?.business_connection_id
          });
        } catch (e: any) {
          await bot.sendMessage(chatId, '❌ Ocorreu um erro ao gerar o PIX. Tente novamente mais tarde.', { business_connection_id: cb.message?.business_connection_id });
        }
      } else if (action === 'send_link') {
        const productId = dataParts[1];
        if (!productId) return NextResponse.json({ ok: true });

        const product = await queryOne<any>('SELECT slug FROM products WHERE id = $1', [productId]);
        if (product) {
          const url = `https://vip.callme.sbs/p/${product.slug}`;
          await bot.sendMessage(chatId, `🔗 Aqui está a página oficial com todos os detalhes do produto:\n\n${url}`, { business_connection_id: cb.message?.business_connection_id });
        }
      } else if (action === 'copy') {
        const stepIndex = parseInt(dataParts[1], 10);
        const optionIndex = parseInt(dataParts[2], 10);
        
        const flow = await queryOne<any>('SELECT steps FROM chatbot_flows WHERE chatbot_id = $1', [chatbotId]);
        if (flow && flow.steps) {
          const steps = typeof flow.steps === 'string' ? JSON.parse(flow.steps) : flow.steps;
          const copyText = steps[stepIndex]?.options?.[optionIndex]?.copyText;
          if (copyText) {
            // Envia como Markdown block (Monospace) para o usuário poder clicar e copiar nativamente no app
            await bot.sendMessage(chatId, `\`${copyText}\``, { 
              parse_mode: 'Markdown',
              business_connection_id: cb.message?.business_connection_id 
            });
          }
        }
      }

      return NextResponse.json({ ok: true });
    }

    // 2. Lidar com mensagens
    const msg = update.message || update.business_message;
    if (!msg) return NextResponse.json({ ok: true });

    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id;
    const businessConnectionId = update.business_message ? update.business_message.business_connection_id : undefined;

    if (msg.chat.type !== 'private') return NextResponse.json({ ok: true });

    const flow = await queryOne<any>('SELECT steps FROM chatbot_flows WHERE chatbot_id = $1', [chatbotId]);
    if (!flow || !flow.steps) return NextResponse.json({ ok: true });

    const steps = typeof flow.steps === 'string' ? JSON.parse(flow.steps) : flow.steps;
    if (steps.length === 0) return NextResponse.json({ ok: true });

    let session = await queryOne<any>(
      'SELECT * FROM chatbot_sessions WHERE chatbot_id = $1 AND telegram_user_id = $2',
      [chatbotId, telegramUserId.toString()]
    );

    if (session && session.is_paused) {
      return NextResponse.json({ ok: true, reason: 'session_paused' });
    }

    let currentStepIndex = 0;
    if (!session) {
      await query(
        'INSERT INTO chatbot_sessions (chatbot_id, telegram_user_id, chat_id, current_step) VALUES ($1, $2, $3, $4)',
        [chatbotId, telegramUserId.toString(), chatId.toString(), 0]
      );
    } else {
      currentStepIndex = session.current_step + 1;
      if (currentStepIndex >= steps.length) {
        currentStepIndex = 0;
      }
      await query(
        'UPDATE chatbot_sessions SET current_step = $1, last_interaction = NOW() WHERE id = $2',
        [currentStepIndex, session.id]
      );
    }

    const currentStep = steps[currentStepIndex];
    if (!currentStep) return NextResponse.json({ ok: true });

    // ==== LÓGICA DE ENVIO BASEADA NO TIPO DE STEP ====
    const baseOpts: any = { business_connection_id: businessConnectionId };

    if (currentStep.type === 'text') {
      if (currentStep.parseMode === 'HTML') {
        baseOpts.parse_mode = 'HTML';
      }
      if (currentStep.simulateAction) {
        await bot.sendChatAction(chatId, 'typing', { business_connection_id: businessConnectionId });
        await sleep(1500); // 1.5s delay
      }
      await bot.sendMessage(chatId, currentStep.content || '', baseOpts);
    
    } else if (currentStep.type === 'media') {
      if (currentStep.simulateAction) {
        let actionMsg: TelegramBot.ChatAction = 'typing';
        if (currentStep.mediaType === 'image') actionMsg = 'upload_photo';
        else if (currentStep.mediaType === 'video') actionMsg = 'upload_video';
        else if (currentStep.mediaType === 'audio') actionMsg = 'upload_document'; // ou upload_audio
        else if (currentStep.mediaType === 'voice') actionMsg = 'record_voice';
        
        await bot.sendChatAction(chatId, actionMsg, { business_connection_id: businessConnectionId });
        await sleep(2500); // 2.5s delay para mídias
      }

      let mediaUrl = currentStep.mediaUrl;
      if (mediaUrl?.startsWith('/')) {
        // Se for upload local, adicionamos o host
        const host = request.headers.get('host') || 'vip.callme.sbs';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        mediaUrl = `${protocol}://${host}${mediaUrl}`;
      }

      try {
        if (currentStep.mediaType === 'image') {
          await bot.sendPhoto(chatId, mediaUrl, baseOpts);
        } else if (currentStep.mediaType === 'video') {
          await bot.sendVideo(chatId, mediaUrl, baseOpts);
        } else if (currentStep.mediaType === 'voice') {
          await bot.sendVoice(chatId, mediaUrl, baseOpts);
        } else {
          // audio normal (MP3)
          await bot.sendAudio(chatId, mediaUrl, baseOpts);
        }
      } catch (err) {
        console.error('Erro ao enviar mídia:', err);
        await bot.sendMessage(chatId, '[Erro ao carregar mídia]', baseOpts);
      }

    } else if (currentStep.type === 'buttons') {
      const inline_keyboard = [
        currentStep.options.map((opt: any, optIndex: number) => {
          if (opt.action === 'url' && opt.url) {
            return { text: opt.label, url: opt.url };
          }
          if (opt.action === 'copy') {
            return { text: opt.label, callback_data: `copy:${currentStepIndex}:${optIndex}` };
          }
          // Default callback actions (pix or send_link)
          return {
            text: opt.label,
            callback_data: `${opt.action}:${opt.productId || ''}`
          };
        })
      ];
      baseOpts.reply_markup = { inline_keyboard };
      await bot.sendMessage(chatId, currentStep.content || 'Escolha uma opção:', baseOpts);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Chatbot Webhook Error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

