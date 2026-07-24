import { NextRequest, NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const host = searchParams.get('url') || request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    
    // Construct the webhook URL
    // Can pass full url via ?url=https://xyz.ngrok.app
    let webhookUrl = searchParams.get('url');
    if (!webhookUrl && host) {
      webhookUrl = `${protocol}://${host}`;
    }

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Could not determine host url' }, { status: 400 });
    }

    // Ensure it ends with /api/telegram/webhook
    if (!webhookUrl.endsWith('/api/telegram/webhook')) {
      webhookUrl = webhookUrl.replace(/\/$/, '') + '/api/telegram/webhook';
    }

    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN is not set' }, { status: 500 });
    }

    const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
    await bot.setWebHook(webhookUrl);

    return NextResponse.json({
      success: true,
      message: `Webhook successfully set to ${webhookUrl}`,
    });
  } catch (error: any) {
    console.error('Error setting webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
