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
  creator_name      TEXT,
  theme_color       TEXT DEFAULT 'clean_light',
  gallery_images    JSONB DEFAULT '[]'::jsonb,
  preview_size      TEXT DEFAULT '300x300',
  carousel_position TEXT DEFAULT 'before_plan',
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
  telegram_sync_token  TEXT,
  bot_setup_done       BOOLEAN DEFAULT FALSE,

  -- Exibição no checkout/landing
  show_price        BOOLEAN DEFAULT TRUE,
  show_description  BOOLEAN DEFAULT TRUE,
  show_period       BOOLEAN DEFAULT TRUE,
  show_creator      BOOLEAN DEFAULT TRUE,
  show_banner       BOOLEAN DEFAULT TRUE,
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
  in_group                   BOOLEAN DEFAULT FALSE,
  invite_link                TEXT,
  delivery_error             TEXT,

  payment_status             TEXT,
  pix_code                   TEXT,
  pix_expires_at             TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Chatbots (Bots Padrões e Business)
CREATE TABLE IF NOT EXISTS chatbots (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id        TEXT REFERENCES products(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  type              TEXT NOT NULL DEFAULT 'standard' CHECK (type IN ('standard', 'business')),
  bot_token         TEXT,
  business_connection_id TEXT,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Fluxos (Automação Sequencial)
CREATE TABLE IF NOT EXISTS chatbot_flows (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chatbot_id        TEXT NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  steps             JSONB DEFAULT '[]'::jsonb,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Sessões (Rastreamento de estado da conversa)
CREATE TABLE IF NOT EXISTS chatbot_sessions (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chatbot_id        TEXT NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  telegram_user_id  TEXT NOT NULL,
  chat_id           TEXT NOT NULL,
  current_step      INTEGER DEFAULT 0,
  is_paused         BOOLEAN DEFAULT FALSE,
  state_data        JSONB DEFAULT '{}'::jsonb,
  last_interaction  TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chatbot_id, telegram_user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_subscribers_subscription ON subscribers_meta(syncpay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_product ON subscribers_meta(product_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers_meta(customer_email);

-- Migrations (seguras para rodar em banco já existente)
ALTER TABLE products ADD COLUMN IF NOT EXISTS creator_name TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'clean_light';
ALTER TABLE products ADD COLUMN IF NOT EXISTS show_creator BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS show_banner BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS preview_size TEXT DEFAULT '300x300';
ALTER TABLE products ADD COLUMN IF NOT EXISTS carousel_position TEXT DEFAULT 'before_plan';
ALTER TABLE subscribers_meta ADD COLUMN IF NOT EXISTS pix_code TEXT;
ALTER TABLE subscribers_meta ADD COLUMN IF NOT EXISTS pix_expires_at TIMESTAMPTZ;
ALTER TABLE chatbot_sessions ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE;
ALTER TABLE chatbots ALTER COLUMN product_id DROP NOT NULL;

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
