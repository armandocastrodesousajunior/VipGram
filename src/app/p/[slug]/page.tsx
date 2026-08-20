import { notFound } from 'next/navigation';
import { queryOne } from '@/lib/db';
import LandingClient from './LandingClient';
import { MetaPixel } from '@/components/MetaPixel';

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  image_url: string | null;
  creator_name: string | null;
  theme_color: string | null;
  gallery_images?: string[];
  preview_size?: string;
  carousel_position?: string;
  type: string;
  syncpay_plan_id: string;
  meta_pixel_id: string | null;
  show_price: boolean;
  show_description: boolean;
  show_period: boolean;
  show_creator: boolean;
  show_banner: boolean;
  show_features: boolean;
  custom_features: string[];
  cta_text: string;
  is_active: boolean;
  created_at?: string;
}

interface Plan {
  id: string | number;
  name: string;
  amount: number | string;
  periodicity_days: number;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await queryOne<Product>(
    'SELECT name, description FROM products WHERE slug = $1 AND is_active = TRUE',
    [slug]
  );
  if (!product) return {};
  return {
    title: `${product.name} — Acesso VIP`,
    description: product.description ?? `Acesse o grupo VIP ${product.name}`,
  };
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await queryOne<Product>(
    'SELECT * FROM products WHERE slug = $1 AND is_active = TRUE',
    [slug]
  );

  if (!product) notFound();

  // Busca detalhes do plano no servidor
  let plan: Plan | null = null;
  if (product.syncpay_plan_id) {
    try {
      const { getPlan } = await import('@/lib/syncpay');
      plan = await getPlan(product.syncpay_plan_id);
    } catch { /* plano pode não estar disponível */ }
  }

  return (
    <>
      <MetaPixel pixelId={product.meta_pixel_id} event="ViewContent" />
      <LandingClient product={product} plan={plan} />
    </>
  );
}
