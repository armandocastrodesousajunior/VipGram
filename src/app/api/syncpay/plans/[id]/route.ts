import { NextRequest, NextResponse } from 'next/server';
import { getPlan } from '@/lib/syncpay';
import { getAdminSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { id } = await params;
    const plan = await getPlan(id);
    return NextResponse.json(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar plano';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
