import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSubscriber } from '@/lib/syncpay';
import { query, queryOne } from '@/lib/db';

// Rate limiting simples em memória (por IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (limit.count >= 5) return false;

  limit.count++;
  return true;
}

const subscribeSchema = z.object({
  product_id: z.string().uuid(),
  plan_id: z.union([z.string(), z.number()]).transform((v) => String(v)),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos (sem pontuação)'),
  phone: z.string().optional(),
  telegram_username: z.string().optional(),
  chatbot_session_id: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde 1 minuto.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const input = subscribeSchema.parse(body);

    // Cria assinante na SyncPay
    const subscription = await createSubscriber({
      plan_id: input.plan_id,
      name: input.name,
      email: input.email,
      cpf: input.cpf,
      phone: input.phone,
    });

    const pixCode = subscription.pix_qr_code_text ?? null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pixExpiresAt = (subscription as any).payment?.expires_at ?? null;

    let validSid: string | null = null;
    if (input.chatbot_session_id) {
      const sessionExists = await queryOne('SELECT id FROM chatbot_sessions WHERE id = $1', [input.chatbot_session_id]);
      if (sessionExists) {
        validSid = input.chatbot_session_id;
      }
    }

    // Salva metadados + pix_code no banco
    await query(
      `INSERT INTO subscribers_meta 
        (syncpay_subscription_id, product_id, customer_name, customer_email, 
         customer_cpf, customer_phone, telegram_username, payment_status,
         pix_code, pix_expires_at, chatbot_session_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (syncpay_subscription_id) DO UPDATE SET
         pix_code = EXCLUDED.pix_code,
         pix_expires_at = EXCLUDED.pix_expires_at,
         payment_status = EXCLUDED.payment_status`,
      [
        subscription.id,
        input.product_id,
        input.name,
        input.email,
        input.cpf,
        input.phone ?? null,
        input.telegram_username ?? null,
        subscription.status,
        pixCode,
        pixExpiresAt,
        validSid,
      ]
    );

    // Retorna apenas o ID — o pix fica no banco, não na URL
    return NextResponse.json({
      subscription_id: subscription.id,
      status: subscription.status,
    });
  } catch (error) {
    console.error('[SyncPay Subscribe Error]:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.flatten() },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Erro ao processar';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
