require('dotenv').config({ path: '.env.local' });
const token = process.env.TELEGRAM_BOT_TOKEN;

fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)
  .then(res => res.json())
  .then(data => {
    console.log("=== INFORMAÇÕES DO WEBHOOK DO TELEGRAM ===");
    console.log(JSON.stringify(data, null, 2));
    console.log("==========================================");
  })
  .catch(err => console.error("Erro ao checar webhook:", err));
