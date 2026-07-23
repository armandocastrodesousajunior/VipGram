// ATENÇÃO: Este arquivo é SERVER-ONLY.
// O TELEGRAM_BOT_TOKEN NUNCA deve chegar ao browser.

import TelegramBot from 'node-telegram-bot-api';

declare global {
  // eslint-disable-next-line no-var
  var _telegramBot: TelegramBot | undefined;
}

function getBot(): TelegramBot {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN não configurado no .env.local');
  }

  if (global._telegramBot) return global._telegramBot;

  const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
    polling: false,
  });

  if (process.env.NODE_ENV !== 'production') {
    global._telegramBot = bot;
  }

  return bot;
}

export interface ChatVerification {
  chatTitle: string;
  chatType: string;
  membersCount?: number;
  canInvite: boolean;
  botIsAdmin: boolean;
}

/**
 * Verifica se o bot tem acesso ao chat e permissão para convidar usuários.
 */
export async function verifyChatAccess(
  chatId: string
): Promise<ChatVerification> {
  const bot = getBot();
  const me = await bot.getMe();

  const [chat, botMember] = await Promise.all([
    bot.getChat(chatId),
    bot.getChatMember(chatId, me.id),
  ]);

  const isAdmin = ['administrator', 'creator'].includes(botMember.status);
  // A propriedade can_invite_users existe em ChatMemberAdministrator
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canInvite = isAdmin && (botMember as any).can_invite_users !== false;

  return {
    chatTitle: (chat as { title?: string }).title ?? 'Canal/Grupo',
    chatType: chat.type,
    membersCount: (chat as { member_count?: number }).member_count,
    canInvite,
    botIsAdmin: isAdmin,
  };
}

/**
 * Gera um link de convite exclusivo (uso único, expira em 24h).
 * Este é o mecanismo principal de entrega do acesso ao Telegram.
 */
export async function generateUniqueInviteLink(
  chatId: string,
  label?: string
): Promise<string> {
  const bot = getBot();
  const expireDate = Math.floor(Date.now() / 1000) + 86_400; // +24h

  const link = await bot.createChatInviteLink(chatId, {
    member_limit: 1,
    expire_date: expireDate,
    name: label ?? `VIP-${Date.now()}`,
  });

  return link.invite_link;
}

/**
 * Revoga um link de convite (útil para cancelamentos).
 */
export async function revokeInviteLink(
  chatId: string,
  inviteLink: string
): Promise<void> {
  const bot = getBot();
  await bot.revokeChatInviteLink(chatId, inviteLink);
}

/**
 * Retorna informações básicas do bot para exibição no admin.
 */
export async function getBotInfo(): Promise<{
  id: number;
  username: string;
  firstName: string;
}> {
  const bot = getBot();
  const me = await bot.getMe();
  return {
    id: me.id,
    username: me.username ?? '',
    firstName: me.first_name,
  };
}
