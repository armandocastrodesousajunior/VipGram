import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const perPage = Math.max(1, Math.min(100, parseInt(searchParams.get('per_page') || '20', 10)));
  const search = (searchParams.get('search') || '').trim().toLowerCase();
  const status = (searchParams.get('status') || '').trim().toLowerCase();
  const productId = (searchParams.get('product_id') || '').trim();

  try {
    const whereConditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(
        LOWER(sm.customer_name) LIKE $${paramIndex} OR
        LOWER(sm.customer_email) LIKE $${paramIndex} OR
        LOWER(sm.customer_cpf) LIKE $${paramIndex} OR
        LOWER(sm.telegram_username) LIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      if (status === 'active' || status === 'paid') {
        whereConditions.push(`LOWER(sm.payment_status) IN ('active', 'paid')`);
      } else if (status === 'cancelled' || status === 'canceled') {
        whereConditions.push(`LOWER(sm.payment_status) IN ('cancelled', 'canceled')`);
      } else if (status === 'pending' || status === 'waiting') {
        whereConditions.push(`LOWER(sm.payment_status) IN ('pending', 'waiting')`);
      } else {
        whereConditions.push(`LOWER(sm.payment_status) = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }
    }

    if (productId) {
      whereConditions.push(`sm.product_id = $${paramIndex}`);
      params.push(productId);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Consulta total para paginação
    const countQuery = `SELECT COUNT(*) as count FROM subscribers_meta sm ${whereClause}`;
    const countRows = await query<{ count: string }>(countQuery, params);
    const total = parseInt(countRows[0]?.count || '0', 10);

    // Consulta os assinantes com JOIN na tabela de produtos
    const offset = (page - 1) * perPage;
    const dataQuery = `
      SELECT 
        sm.id,
        sm.syncpay_subscription_id,
        sm.customer_name,
        sm.customer_email,
        sm.customer_cpf,
        sm.customer_phone,
        sm.telegram_username,
        sm.telegram_user_id,
        sm.in_group,
        sm.payment_status,
        sm.created_at,
        sm.product_id,
        COALESCE(p.name, 'Produto Removido') AS product_name,
        p.slug AS product_slug
      FROM subscribers_meta sm
      LEFT JOIN products p ON p.id = sm.product_id
      ${whereClause}
      ORDER BY sm.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const subscribers = await query(dataQuery, [...params, perPage, offset]);
    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({
      subscribers,
      pagination: {
        total,
        page,
        per_page: perPage,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro em GET /api/admin/subscribers:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
