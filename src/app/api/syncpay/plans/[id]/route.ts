import { NextRequest, NextResponse } from 'next/server';
import { getPlan } from '@/lib/syncpay';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const plan = await getPlan(id);
    return NextResponse.json(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar plano';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
