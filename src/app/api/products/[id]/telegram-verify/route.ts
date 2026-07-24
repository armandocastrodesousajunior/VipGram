import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import TelegramBot from 'node-telegram-bot-api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN missing' }, { status: 500 });

  try {
    const product = await queryOne<any>(
      'SELECT telegram_chat_id, bot_setup_done FROM products WHERE id = $1',
      [id]
    );

    if (!product || !product.bot_setup_done || !product.telegram_chat_id) {
      return NextResponse.json({
        dbLinked: false,
        botInGroup: false,
        botIsAdmin: false,
        error: 'Produto não vinculado no banco de dados'
      });
    }

    const chatId = product.telegram_chat_id;
    const bot = new TelegramBot(token, { polling: false });

    // Verificações
    let botInGroup = false;
    let botIsAdmin = false;
    let apiError = '';

    try {
      const chat = await bot.getChat(chatId);
      botInGroup = true; // Se não lançou erro, o bot tem acesso ao chat (pode ler)

      const botUser = await bot.getMe();
      const chatMember = await bot.getChatMember(chatId, botUser.id);
      
      if (chatMember.status === 'administrator' || chatMember.status === 'creator') {
        botIsAdmin = true;
      }
    } catch (e: any) {
      apiError = e.message;
      if (e.response && e.response.statusCode === 403) {
         botInGroup = false; // Expulso ou saiu
      } else if (e.response && e.response.statusCode === 400) {
         botInGroup = false; // Chat não encontrado
      }
    }

    return NextResponse.json({
      dbLinked: true,
      botInGroup,
      botIsAdmin,
      error: apiError
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
