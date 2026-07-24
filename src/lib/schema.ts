import { pool } from './db';

const SCHEMA = `
-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  description       TEXT,
  image_url         TEXT,
  banner_url        TEXT,
  type              TEXT NOT NULL DEFAULT 'telegram_group'
                    CHECK (type IN ('telegram_group', 'external_community')),
  billing_type      TEXT NOT NULL DEFAULT 'subscription'
                    CHECK (billing_type IN ('subscription')),

  -- SyncPay
  syncpay_plan_id   TEXT NOT NULL DEFAULT '',

  -- Telegram
  telegram_chat_id     TEXT,
  telegram_chat_name   TEXT,
  telegram_invite_link TEXT,
  bot_setup_done       BOOLEAN DEFAULT FALSE,

  -- Exibição no checkout/landing
  show_price        BOOLEAN DEFAULT TRUE,
  show_description  BOOLEAN DEFAULT TRUE,
  show_period       BOOLEAN DEFAULT TRUE,
  show_features     BOOLEAN DEFAULT TRUE,
  custom_features   JSONB DEFAULT '[]',
  cta_text          TEXT DEFAULT 'Quero Acesso VIP',

  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de metadados dos assinantes
CREATE TABLE IF NOT EXISTS subscribers_meta (
  id                         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  syncpay_subscription_id    TEXT UNIQUE NOT NULL,
  product_id                 TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Dados do checkout
  customer_name              TEXT,
  customer_email             TEXT,
  customer_cpf               TEXT,
  customer_phone             TEXT,
  telegram_username          TEXT,

  -- Entrega via bot
  telegram_user_id           BIGINT,
  bot_delivered              BOOLEAN DEFAULT FALSE,
  bot_delivered_at           TIMESTAMPTZ,
  invite_link                TEXT,
  delivery_error             TEXT,

  payment_status             TEXT,
  pix_code                   TEXT,
  pix_expires_at             TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_subscribers_subscription ON subscribers_meta(syncpay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_product ON subscribers_meta(product_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers_meta(customer_email);

-- Migrations (seguras para rodar em banco já existente)
ALTER TABLE subscribers_meta ADD COLUMN IF NOT EXISTS pix_code TEXT;
ALTER TABLE subscribers_meta ADD COLUMN IF NOT EXISTS pix_expires_at TIMESTAMPTZ;

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

export async function setupDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(SCHEMA);
    console.log('✅ Banco de dados configurado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao configurar banco de dados:', error);
    throw error;
  } finally {
    client.release();
  }
}
