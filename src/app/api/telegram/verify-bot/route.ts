import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { verifyChatAccess } from '@/lib/telegram';

export async function GET(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const chatId = request.nextUrl.searchParams.get('chatId');
  if (!chatId) {
    return NextResponse.json({ error: 'chatId é obrigatório' }, { status: 400 });
  }

  try {
    const info = await verifyChatAccess(chatId);
    return NextResponse.json(info);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao verificar chat';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
