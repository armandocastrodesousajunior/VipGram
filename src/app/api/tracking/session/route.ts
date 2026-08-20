import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { sid, action } = await request.json();

    if (!sid || !action) {
      return NextResponse.json({ ok: false, error: 'Missing sid or action' }, { status: 400 });
    }

    if (action === 'page_view') {
      await query(
        'UPDATE chatbot_sessions SET page_views = page_views + 1 WHERE id = $1',
        [sid]
      );
    } else if (action === 'checkout_view') {
      await query(
        'UPDATE chatbot_sessions SET checkout_views = checkout_views + 1 WHERE id = $1',
        [sid]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Session Tracking Error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
