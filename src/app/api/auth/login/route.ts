import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateAdminToken, createSessionToken, COOKIE_NAME } from '@/lib/auth';

const loginSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = loginSchema.parse(body);

    if (!validateAdminToken(token)) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const sessionToken = await createSessionToken();

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24h
      path: '/',
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
