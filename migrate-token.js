const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/grupovip',
});

async function migrate() {
  try {
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS telegram_sync_token TEXT;');
    console.log('Migration successful: added telegram_sync_token to products');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    pool.end();
  }
}

migrate();
