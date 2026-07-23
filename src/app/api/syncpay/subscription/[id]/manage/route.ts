import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import {
  getSubscription,
  cancelSubscription,
  pauseSubscription,
  reactivateSubscription,
  resendCharge,
} from '@/lib/syncpay';
import { queryOne } from '@/lib/db';

type Action = 'cancel' | 'pause' | 'reactivate' | 'resend';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  try {
    const [subscription, meta] = await Promise.all([
      getSubscription(id),
      queryOne('SELECT * FROM subscribers_meta WHERE syncpay_subscription_id = $1', [id]),
    ]);
    return NextResponse.json({ subscription, meta });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const { action } = (await request.json()) as { action: Action };

  try {
    switch (action) {
      case 'cancel': await cancelSubscription(id); break;
      case 'pause': await pauseSubscription(id); break;
      case 'reactivate': await reactivateSubscription(id); break;
      case 'resend': await resendCharge(id); break;
      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
