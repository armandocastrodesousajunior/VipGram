import { NextResponse } from 'next/server';
import { getBotInfo } from '@/lib/telegram';

// Esta rota é pública intencionalmente: retorna apenas o @username do bot,
// que é informação pública do Telegram. O TELEGRAM_BOT_TOKEN nunca sai do servidor.
export async function GET() {
  try {
    const info = await getBotInfo();
    return NextResponse.json(info);
  } catch (error: any) {
    console.error('Error fetching bot info:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
