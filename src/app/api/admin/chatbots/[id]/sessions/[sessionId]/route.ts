import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, sessionId: string }> }
) {
  const { id, sessionId } = await params;
  try {
    const { action } = await req.json();

    if (action === 'pause') {
      await query("UPDATE chatbot_sessions SET is_paused = TRUE, status = 'paused' WHERE id = $1 AND chatbot_id = $2", [sessionId, id]);
    } else if (action === 'resume' || action === 'reopen') {
      await query("UPDATE chatbot_sessions SET is_paused = FALSE, status = 'active' WHERE id = $1 AND chatbot_id = $2", [sessionId, id]);
    } else if (action === 'reset') {
      await query("UPDATE chatbot_sessions SET current_step = -1, is_paused = FALSE, status = 'active' WHERE id = $1 AND chatbot_id = $2", [sessionId, id]);
    } else if (action === 'close') {
      await query("UPDATE chatbot_sessions SET status = 'closed' WHERE id = $1 AND chatbot_id = $2", [sessionId, id]);
    }

    // Retorna a sessão atualizada para o front
    const updated = await queryOne('SELECT * FROM chatbot_sessions WHERE id = $1', [sessionId]);

    // Recupera a tag do estágio atual
    const flow = await queryOne('SELECT steps FROM chatbot_flows WHERE chatbot_id = $1', [id]);
    const steps = flow && flow.steps ? (typeof flow.steps === 'string' ? JSON.parse(flow.steps) : flow.steps) : [];
    const stepObj = steps[updated.current_step];
    updated.stageName = stepObj?.stageName || `Passo ${updated.current_step + 1}`;

    return NextResponse.json({ ok: true, session: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, sessionId: string }> }
) {
  const { id, sessionId } = await params;
  try {
    await query('DELETE FROM chatbot_sessions WHERE id = $1 AND chatbot_id = $2', [sessionId, id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
