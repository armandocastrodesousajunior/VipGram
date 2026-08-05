import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const { steps } = await req.json();

    const existingFlow = await queryOne('SELECT id FROM chatbot_flows WHERE chatbot_id = $1', [id]);

    if (existingFlow) {
      await query(
        'UPDATE chatbot_flows SET steps = $1, updated_at = NOW() WHERE chatbot_id = $2',
        [JSON.stringify(steps), id]
      );
    } else {
      await query(
        'INSERT INTO chatbot_flows (chatbot_id, steps) VALUES ($1, $2)',
        [id, JSON.stringify(steps)]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Flow POST error]:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
