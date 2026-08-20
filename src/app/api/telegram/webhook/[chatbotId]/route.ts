import { NextRequest, NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { query, queryOne } from '@/lib/db';
import { generatePixForBot } from '@/lib/syncpay';

// Helper de sleep para delay nas ações do bot
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const simulateActionLoop = async (
  bot: TelegramBot,
  chatId: number | string,
  actionMsg: TelegramBot.ChatAction,
  durationMs: number,
  businessConnectionId?: string
) => {
  const interval = 4500; // API requires renew every ~5s
  let elapsed = 0;
  while (elapsed < durationMs) {
    try {
      await bot.sendChatAction(chatId, actionMsg, { business_connection_id: businessConnectionId });
    } catch (e) {
      // ignore
    }
    const toWait = Math.min(interval, durationMs - elapsed);
    await sleep(toWait);
    elapsed += toWait;
  }
};

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
        'SELECT is_paused, status FROM chatbot_sessions WHERE chatbot_id = $1 AND telegram_user_id = $2',
        [chatbotId, telegramUserId.toString()]
      );

      if (session && (session.is_paused || session.status === 'paused')) {
        return NextResponse.json({ ok: true, reason: 'session_paused' });
      }
      if (session && session.status === 'closed') {
        return NextResponse.json({ ok: true, reason: 'session_closed_ignoring_callback' });
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

          // Armazenar o código PIX na sessão temporariamente para o botão de copiar funcionar
          if (session) {
            await query("UPDATE chatbot_sessions SET state_data = jsonb_set(state_data, '{last_pix_code}', $1::jsonb) WHERE id = $2", [JSON.stringify(pixData.pix_code), session.id]);
          }

          await bot.sendMessage(chatId, `✅ *PIX Gerado com sucesso!*\n\nCopie o código abaixo clicando nele ou use os botões. Pague no seu aplicativo do banco para liberar o acesso:\n\n\`${pixData.pix_code}\``, {
            parse_mode: 'Markdown',
            business_connection_id: cb.message?.business_connection_id,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📋 Copiar PIX', callback_data: `copy_pix` },
                  { text: '🔄 Gerar outro', callback_data: `generate_pix:${productId}` }
                ]
              ]
            }
          });
        } catch (e: any) {
          console.error('[ERRO AO GERAR PIX NO BOT]:', e);
          await bot.sendMessage(chatId, '❌ Ocorreu um erro ao gerar o PIX. O servidor de pagamento pode estar indisponível no momento.', { 
            business_connection_id: cb.message?.business_connection_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔄 Tentar Novamente', callback_data: `generate_pix:${productId}` }]
              ]
            }
          });
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
      } else if (action === 'copy_pix') {
        if (session && session.state_data && session.state_data.last_pix_code) {
          await bot.sendMessage(chatId, `\`${session.state_data.last_pix_code}\``, { 
            parse_mode: 'Markdown',
            business_connection_id: cb.message?.business_connection_id 
          });
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

    if (session && (session.is_paused || session.status === 'paused')) {
      return NextResponse.json({ ok: true, reason: 'session_paused' });
    }

    // Ignora a mensagem se a sessão já foi finalizada
    if (session && session.status === 'closed') {
      return NextResponse.json({ ok: true, reason: 'session_closed' });
    }

    // Ignora a mensagem se a sessão estiver atualmente processando o fluxo
    if (session && session.status === 'processing') {
      return NextResponse.json({ ok: true, reason: 'currently_processing' });
    }

    let startStepIndex = 0;
    if (!session) {
      try {
        session = await queryOne<any>(
          "INSERT INTO chatbot_sessions (chatbot_id, telegram_user_id, chat_id, current_step, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [chatbotId, telegramUserId.toString(), chatId.toString(), 0, 'processing']
        );
        startStepIndex = 0;
      } catch (err) {
        // Falhou por constraint UNIQUE (outro webhook inseriu no mesmo milissegundo)
        return NextResponse.json({ ok: true, reason: 'concurrent_insert' });
      }
    } else {
      // Tenta adquirir o "lock" atômico mudando de active para processing
      const updatedSession = await queryOne<any>(
        "UPDATE chatbot_sessions SET status = 'processing', last_interaction = NOW() WHERE id = $1 AND status = 'active' RETURNING *",
        [session.id]
      );

      if (!updatedSession) {
        // Se não retornou, outro request já alterou para processing no mesmo milissegundo
        return NextResponse.json({ ok: true, reason: 'concurrent_processing' });
      }

      session = updatedSession;
      startStepIndex = session.current_step + 1;
      if (startStepIndex >= steps.length) {
        startStepIndex = 0; // fallback safe
      }
    }

    let currentStepIndex = startStepIndex;

    const simConfig = typeof chatbot.simulation_config === 'string' 
      ? JSON.parse(chatbot.simulation_config) 
      : (chatbot.simulation_config || { textMode: 'normal', textMsPerChar: 180, videoMode: 'normal', audioMode: 'normal' });

    const processFlow = async () => {
      try {
        while (currentStepIndex < steps.length) {
          const currentStep = steps[currentStepIndex];
          
          await query(
            'UPDATE chatbot_sessions SET current_step = $1, last_interaction = NOW() WHERE id = $2',
            [currentStepIndex, session.id]
          );

          if (currentStep.type === 'wait_reply') {
            await query("UPDATE chatbot_sessions SET status = 'active' WHERE id = $1", [session.id]);
            break;
          }

          if (currentStep.type === 'delay') {
            const delayMs = (currentStep.delaySeconds || 5) * 1000;
            await sleep(delayMs);
            currentStepIndex++;
            continue;
          }

          // ==== LÓGICA DE ENVIO BASEADA NO TIPO DE STEP ====
          const baseOpts: any = { business_connection_id: businessConnectionId };

          if (currentStep.type === 'text') {
            if (currentStep.parseMode === 'HTML') {
              baseOpts.parse_mode = 'HTML';
            }
            if (currentStep.simulateAction !== false) {
              if (simConfig.textMode === 'real') {
                const duration = (currentStep.content || '').length * (simConfig.textMsPerChar || 180);
                await simulateActionLoop(bot, chatId, 'typing', duration, businessConnectionId);
              } else {
                await bot.sendChatAction(chatId, 'typing', { business_connection_id: businessConnectionId }).catch(() => {});
                await sleep(1500); // 1.5s delay
              }
            }
            let textContent = currentStep.content || '';
            textContent = textContent.replace(/\{sid\}/g, session.id);
            await bot.sendMessage(chatId, textContent, baseOpts);
          
          } else if (currentStep.type === 'media') {
            if (currentStep.simulateAction !== false) {
              let actionMsg: TelegramBot.ChatAction = 'typing';
              if (currentStep.mediaType === 'image') actionMsg = 'upload_photo';
              else if (currentStep.mediaType === 'video') actionMsg = 'upload_video';
              else if (currentStep.mediaType === 'audio') actionMsg = 'upload_document';
              else if (currentStep.mediaType === 'voice') actionMsg = 'record_voice';
              
              const isVideo = currentStep.mediaType === 'video';
              const isAudio = currentStep.mediaType === 'audio' || currentStep.mediaType === 'voice';

              if (isVideo && simConfig.videoMode === 'real' && currentStep.mediaDuration) {
                await simulateActionLoop(bot, chatId, actionMsg, currentStep.mediaDuration * 1000, businessConnectionId);
              } else if (isAudio && simConfig.audioMode === 'real' && currentStep.mediaDuration) {
                await simulateActionLoop(bot, chatId, actionMsg, currentStep.mediaDuration * 1000, businessConnectionId);
              } else {
                await bot.sendChatAction(chatId, actionMsg, { business_connection_id: businessConnectionId }).catch(() => {});
                await sleep(2500); // 2.5s delay para mídias
              }
            }

            let mediaData: any = currentStep.mediaUrl;
            if (currentStep.mediaUrl?.startsWith('/')) {
              const fs = require('fs');
              const path = require('path');
              const filePath = path.join(process.cwd(), 'public', currentStep.mediaUrl);
              
              if (fs.existsSync(filePath)) {
                mediaData = fs.createReadStream(filePath);
              } else {
                const appUrl = process.env.APP_URL;
                if (appUrl) {
                  mediaData = `${appUrl}${currentStep.mediaUrl}`;
                } else {
                  const host = request.headers.get('host') || 'vip.callme.sbs';
                  const protocol = host.includes('localhost') ? 'http' : 'https';
                  mediaData = `${protocol}://${host}${currentStep.mediaUrl}`;
                }
              }
            }

            try {
              if (currentStep.mediaCaption) {
                baseOpts.caption = currentStep.mediaCaption.replace(/\{sid\}/g, session.id);
                if (currentStep.parseMode === 'HTML') baseOpts.parse_mode = 'HTML';
              }

              if (currentStep.mediaType === 'image') {
                await bot.sendPhoto(chatId, mediaData, baseOpts);
              } else if (currentStep.mediaType === 'video') {
                await bot.sendVideo(chatId, mediaData, baseOpts);
              } else if (currentStep.mediaType === 'voice') {
                await bot.sendVoice(chatId, mediaData, baseOpts);
              } else {
                await bot.sendAudio(chatId, mediaData, baseOpts);
              }
            } catch (err) {
              console.error('Erro ao enviar mídia:', err);
              await bot.sendMessage(chatId, '[Erro ao carregar mídia]', baseOpts);
            }

          } else if (currentStep.type === 'buttons') {
            const inline_keyboard = [
              currentStep.options.map((opt: any, optIndex: number) => {
                if (opt.action === 'url' && opt.url) {
                  // Substitui manualmente se o usuário digitou {sid}
                  let finalUrl = opt.url.replace(/\{sid\}/g, session.id);
                  
                  // Injeta o sid automaticamente nas URLs do sistema SE não tiver sido injetado
                  if (!finalUrl.includes(`sid=${session.id}`) && (finalUrl.includes('vip.callme.sbs') || finalUrl.includes('localhost') || finalUrl.includes(process.env.APP_URL || 'vip.callme.sbs'))) {
                    const separator = finalUrl.includes('?') ? '&' : '?';
                    finalUrl = `${finalUrl}${separator}sid=${session.id}`;
                  }
                  return { text: opt.label, url: finalUrl };
                }
                if (opt.action === 'copy') {
                  return { text: opt.label, callback_data: `copy:${currentStepIndex}:${optIndex}` };
                }
                return {
                  text: opt.label,
                  callback_data: `${opt.action}:${opt.productId || ''}`
                };
              })
            ];
            baseOpts.reply_markup = { inline_keyboard };
            let buttonsContent = currentStep.content || 'Escolha uma opção:';
            buttonsContent = buttonsContent.replace(/\{sid\}/g, session.id);
            await bot.sendMessage(chatId, buttonsContent, baseOpts);
          }

          currentStepIndex++;
        }

        // Se finalizou todos os passos, fechamos a sessão
        if (currentStepIndex >= steps.length) {
          await query("UPDATE chatbot_sessions SET status = 'closed' WHERE id = $1", [session.id]);
        }
      } catch (e) {
        console.error('Erro no processamento contínuo do fluxo:', e);
        // Em caso de erro crítico, retorna para active para não travar a sessão para sempre
        await query("UPDATE chatbot_sessions SET status = 'active' WHERE id = $1", [session.id]);
      }
    };

    // Inicia o loop em background para que o Telegram receba o 200 OK imediatamente (evitando timeout)
    processFlow();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Chatbot Webhook Error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

