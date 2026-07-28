import { notFound } from 'next/navigation';
import { queryOne } from '@/lib/db';
import RecoveryClient from './RecoveryClient';

export const metadata = {
  title: 'Recuperar Acesso',
};

export default async function RecoveryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Busca as informações básicas do produto para manter a identidade visual (tema, banner, etc)
  const product = await queryOne<{
    name: string;
    theme_color: string | null;
    image_url: string | null;
    banner_url: string | null;
    creator_name: string | null;
  }>(
    'SELECT name, theme_color, image_url, banner_url, creator_name FROM products WHERE slug = $1 AND is_active = TRUE',
    [slug]
  );

  if (!product) notFound();

  return <RecoveryClient product={product} slug={slug} />;
}
