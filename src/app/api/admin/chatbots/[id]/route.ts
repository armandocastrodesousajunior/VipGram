import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const rows = await query('SELECT * FROM chatbots WHERE id = $1', [id]);
    if (!rows[0]) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await query('DELETE FROM chatbots WHERE id = $1', [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { name, type, bot_token, business_connection_id, simulation_config } = await req.json();

    if (!name || !type) {
      return NextResponse.json({ error: 'Preencha os campos obrigatórios' }, { status: 400 });
    }

    if (type === 'standard' && !bot_token) {
      return NextResponse.json({ error: 'Token do bot é obrigatório para tipo standard' }, { status: 400 });
    }

    const simConfigStr = simulation_config ? JSON.stringify(simulation_config) : '{"textMode":"normal","textMsPerChar":180,"videoMode":"normal","audioMode":"normal"}';

    const result = await query(
      `UPDATE chatbots 
       SET name = $1, type = $2, bot_token = $3, business_connection_id = $4, simulation_config = $5::jsonb, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [name, type, bot_token || null, business_connection_id || null, simConfigStr, id]
    );

    if (!result[0]) {
      return NextResponse.json({ error: 'Chatbot não encontrado' }, { status: 404 });
    }

    // Registrar webhook na API do Telegram
    if (bot_token) {
      const appUrl = process.env.APP_URL || 'https://vip.callme.sbs';
      const webhookUrl = `${appUrl.replace(/\/$/, '')}/api/telegram/webhook/${id}`;
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

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('[Chatbots PUT error]:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
