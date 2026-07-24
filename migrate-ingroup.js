const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/grupovip',
});

async function migrate() {
  try {
    await pool.query('ALTER TABLE subscribers_meta ADD COLUMN IF NOT EXISTS in_group BOOLEAN DEFAULT FALSE;');
    console.log('Migration successful: added in_group to subscribers_meta');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    pool.end();
  }
}

migrate();
