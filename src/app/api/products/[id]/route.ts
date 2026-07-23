import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { cleanupUnusedUploads } from '@/lib/cleanup-uploads';

const updateSchema = z.object({
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/).optional(),
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(2000).optional().nullable(),
  image_url: z.string().optional().nullable(),
  banner_url: z.string().optional().nullable(),
  creator_name: z.string().optional().nullable(),
  theme_color: z.string().optional(),
  syncpay_plan_id: z.string().min(1).optional(),
  telegram_chat_id: z.string().optional().nullable(),
  telegram_chat_name: z.string().optional().nullable(),
  telegram_invite_link: z.string().optional().nullable(),
  bot_setup_done: z.boolean().optional(),
  show_price: z.boolean().optional(),
  show_description: z.boolean().optional(),
  show_period: z.boolean().optional(),
  show_creator: z.boolean().optional(),
  show_banner: z.boolean().optional(),
  show_features: z.boolean().optional(),
  custom_features: z.array(z.string()).optional(),
  cta_text: z.string().optional(),
  is_active: z.boolean().optional(),
});

// GET /api/products/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await queryOne('SELECT * FROM products WHERE id = $1', [id]);
  if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
  return NextResponse.json({ product });
}

// PUT /api/products/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateSchema.parse(body);

    // Constrói query dinâmica apenas com campos fornecidos
    const fields = Object.keys(data) as Array<keyof typeof data>;
    if (fields.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    const setClauses = fields.map((field, i) => {
      if (field === 'custom_features') return `${field} = $${i + 1}::jsonb`;
      return `${field} = $${i + 1}`;
    });
    const values = fields.map((field) => {
      if (field === 'custom_features') return JSON.stringify(data[field]);
      return data[field];
    });

    const [product] = await query(
      `UPDATE products SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${fields.length + 1}
       RETURNING *`,
      [...values, id]
    );

    if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });

    cleanupUnusedUploads().catch(() => {});

    return NextResponse.json({ product });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.flatten() }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/products/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  await query('DELETE FROM products WHERE id = $1', [id]);

  cleanupUnusedUploads().catch(() => {});

  return NextResponse.json({ success: true });
}
