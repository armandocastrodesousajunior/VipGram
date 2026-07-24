import { NextResponse } from 'next/server';
import { getBotInfo } from '@/lib/telegram';

export async function GET() {
  try {
    const info = await getBotInfo();
    return NextResponse.json(info);
  } catch (error: any) {
    console.error('Error fetching bot info:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
