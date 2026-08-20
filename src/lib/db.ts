import { unstable_noStore as noStore } from 'next/cache';
import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

const pool =
  global._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') {
  global._pgPool = pool;
}

export { pool };

let dbInitPromise: Promise<void> | null = null;

export async function ensureDbInitialized(): Promise<void> {
  if (!dbInitPromise) {
    const { setupDatabase } = await import('./schema');
    dbInitPromise = setupDatabase().catch((err) => {
      dbInitPromise = null; // Permite tentar novamente em caso de erro transiente
      console.error('Falha ao inicializar o banco de dados:', err);
      throw err;
    });
  }
  return dbInitPromise;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  noStore();
  await ensureDbInitialized();
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  noStore();
  await ensureDbInitialized();
  const result = await pool.query(text, params);
  return (result.rows[0] as T) ?? null;
}
