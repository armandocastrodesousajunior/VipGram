import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { listPlans } from '@/lib/syncpay';

export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const plans = await listPlans();
    return NextResponse.json({ plans });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
