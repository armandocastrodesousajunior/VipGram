import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { cleanupUnusedUploads } from '@/lib/cleanup-uploads';
import { v4 as uuidv4 } from 'uuid';

// Tipos
interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  banner_url: string | null;
  creator_name: string | null;
  theme_color: string;
  gallery_images: string[];
  preview_size: string;
  carousel_position: string;
  type: string;
  billing_type: string;
  syncpay_plan_id: string;
  telegram_chat_id: string | null;
  telegram_chat_name: string | null;
  telegram_invite_link: string | null;
  bot_setup_done: boolean;
  show_price: boolean;
  show_description: boolean;
  show_period: boolean;
  show_creator: boolean;
  show_banner: boolean;
  show_features: boolean;
  custom_features: string[];
  cta_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Schema de validação
const productSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Slug: apenas letras minúsculas, números e hífens'),
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional().nullable(),
  image_url: z.string().optional().nullable(),
  banner_url: z.string().optional().nullable(),
  creator_name: z.string().optional().nullable(),
  theme_color: z.string().default('clean_light'),
  gallery_images: z.array(z.string()).default([]),
  preview_size: z.enum(['30x30', '50x50', '100x100', '200x200', '300x300', '400x400', '500x500']).default('300x300'),
  carousel_position: z.enum(['before_plan', 'after_plan']).default('before_plan'),
  type: z.enum(['telegram_group', 'external_community']).default('telegram_group'),
  billing_type: z.enum(['subscription']).default('subscription'),
  syncpay_plan_id: z.string().min(1),
  telegram_chat_id: z.string().optional().nullable(),
  telegram_chat_name: z.string().optional().nullable(),
  telegram_invite_link: z.string().optional().nullable(),
  bot_setup_done: z.boolean().default(false),
  show_price: z.boolean().default(true),
  show_description: z.boolean().default(true),
  show_period: z.boolean().default(true),
  show_creator: z.boolean().default(true),
  show_banner: z.boolean().default(true),
  show_features: z.boolean().default(false),
  custom_features: z.array(z.string()).default([]),
  cta_text: z.string().default('CONTINUAR PARA SEUS DADOS'),
  is_active: z.boolean().default(true),
});

// GET /api/products — lista pública (apenas ativos)
export async function GET(request: NextRequest) {

  const { searchParams } = new URL(request.url);
  const adminMode = searchParams.get('admin') === 'true';

  // Admin pode ver todos, público só vê ativos
  const isAdmin = adminMode ? await getAdminSession() : false;
  const whereClause = isAdmin ? '' : 'WHERE is_active = TRUE';

  // Executa varredura de limpeza de uploads
  cleanupUnusedUploads().catch(() => {});

  const products = await query<Product>(
    `SELECT * FROM products ${whereClause} ORDER BY created_at DESC`
  );

  return NextResponse.json({ products });
}

// POST /api/products — cria produto (admin)
export async function POST(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = productSchema.parse(body);

    // Verifica slug único
    const existing = await queryOne(
      'SELECT id FROM products WHERE slug = $1',
      [data.slug]
    );
    if (existing) {
      return NextResponse.json({ error: 'Slug já em uso' }, { status: 409 });
    }

    const id = uuidv4();
    const [product] = await query<Product>(
      `INSERT INTO products (
        id, slug, name, description, image_url, banner_url, creator_name, theme_color,
        gallery_images, preview_size, carousel_position,
        type, billing_type, syncpay_plan_id, telegram_chat_id, telegram_chat_name,
        telegram_invite_link, bot_setup_done, show_price, show_description, show_period,
        show_creator, show_banner, show_features, custom_features, cta_text, is_active
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9::jsonb, $10, $11,
        $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21,
        $22, $23, $24, $25::jsonb, $26, $27
      ) RETURNING *`,
      [
        id, data.slug, data.name, data.description ?? null,
        data.image_url || null, data.banner_url || null,
        data.creator_name || null, data.theme_color || 'clean_light',
        JSON.stringify(data.gallery_images), data.preview_size, data.carousel_position,
        data.type, data.billing_type,
        data.syncpay_plan_id,
        data.telegram_chat_id ?? null, data.telegram_chat_name ?? null,
        data.telegram_invite_link ?? null,
        data.bot_setup_done,
        data.show_price, data.show_description, data.show_period,
        data.show_creator, data.show_banner, data.show_features,
        JSON.stringify(data.custom_features), data.cta_text, data.is_active,
      ]
    );

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.flatten() }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
