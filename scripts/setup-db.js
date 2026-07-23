// Script para criar as tabelas do PostgreSQL
// Execute com: node scripts/setup-db.js

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const SCHEMA = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS products (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  description       TEXT,
  image_url         TEXT,
  banner_url        TEXT,
  type              TEXT NOT NULL DEFAULT 'telegram_group',
  billing_type      TEXT NOT NULL DEFAULT 'subscription',
  syncpay_plan_id   TEXT NOT NULL DEFAULT '',
  telegram_chat_id  TEXT,
  telegram_chat_name TEXT,
  telegram_invite_link TEXT,
  bot_setup_done    BOOLEAN DEFAULT FALSE,
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

CREATE TABLE IF NOT EXISTS subscribers_meta (
  id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  syncpay_subscription_id TEXT UNIQUE NOT NULL,
  product_id              TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_name           TEXT,
  customer_email          TEXT,
  customer_cpf            TEXT,
  customer_phone          TEXT,
  telegram_username       TEXT,
  telegram_user_id        BIGINT,
  bot_delivered           BOOLEAN DEFAULT FALSE,
  bot_delivered_at        TIMESTAMPTZ,
  invite_link             TEXT,
  delivery_error          TEXT,
  payment_status          TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_subscribers_subscription ON subscribers_meta(syncpay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_product ON subscribers_meta(product_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers_meta(customer_email);

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

async function main() {
  const client = await pool.connect();
  try {
    console.log('🔄 Conectando ao PostgreSQL...');
    await client.query(SCHEMA);
    console.log('✅ Banco de dados configurado com sucesso!');
    console.log('   Tabelas criadas: products, subscribers_meta');
  } catch (error) {
    console.error('❌ Erro ao configurar banco:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
