import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query(`
      SELECT 
        c.*, 
        p.name as product_name
      FROM chatbots c
      JOIN products p ON p.id = c.product_id
      ORDER BY c.created_at DESC
    `);
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('[Chatbots GET error]:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, type, bot_token, business_connection_id } = await request.json();

    if (!name || !type) {
      return NextResponse.json({ error: 'Preencha os campos obrigatórios' }, { status: 400 });
    }

    if (type === 'standard' && !bot_token) {
      return NextResponse.json({ error: 'Token do bot é obrigatório para tipo standard' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO chatbots (name, type, bot_token, business_connection_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, type, bot_token || null, business_connection_id || null]
    );

    const chatbot = result[0];

    // Registrar webhook na API do Telegram se houver token (mesmo sendo business precisa do webhook)
    if (bot_token) {
      const appUrl = process.env.APP_URL || 'https://vip.callme.sbs';
      const webhookUrl = `${appUrl.replace(/\/$/, '')}/api/telegram/webhook/${chatbot.id}`;
      const tgRes = await fetch(`https://api.telegram.org/bot${bot_token}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'callback_query', 'business_message', 'business_connection']
        })
      });
      const tgData = await tgRes.json();
      if (!tgData.ok) {
        console.error('Erro ao registrar webhook no Telegram:', tgData);
      } else {
        console.log('[WEBHOOK SET SUCCESS]', tgData);
      }
    }

    return NextResponse.json(chatbot);
  } catch (error) {
    console.error('[Chatbots POST error]:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
