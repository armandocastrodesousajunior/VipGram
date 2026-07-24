export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const appUrl = process.env.APP_URL;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (appUrl && botToken) {
      try {
        const webhookUrl = `${appUrl.replace(/\/$/, '')}/api/telegram/webhook`;
        
        // Use standard global fetch available in Node.js
        const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`);
        const data = await res.json();
        
        if (data.ok) {
          console.log(`\n✅ [Telegram Bot] Webhook registrado com sucesso em: ${webhookUrl}\n`);
        } else {
          console.error('\n❌ [Telegram Bot] Falha ao registrar webhook:', data, '\n');
        }
      } catch (err) {
        console.error('\n❌ [Telegram Bot] Erro de rede ao registrar webhook:', err, '\n');
      }
    } else {
       console.warn('\n⚠️ [Telegram Bot] APP_URL ou TELEGRAM_BOT_TOKEN ausente. Webhook não registrado automaticamente.\n');
    }
  }
}
