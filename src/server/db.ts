import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

export const SUPABASE_NOT_CONFIGURED_MSG =
  'Database Supabase belum terhubung. Tambahkan DATABASE_URL (atau SUPABASE_DB_URL / DB_HOST, DB_USER, DB_PASS) di file .env atau Vercel Environment Variables.';

function env(key: string, fallback = ''): string {
  const val = process.env[key];
  return val !== undefined && val !== '' ? val : fallback;
}

function isPlaceholder(val: string): boolean {
  const lower = val.toLowerCase();
  return (
    lower.includes('your-project-id') ||
    lower.includes('your-supabase') ||
    lower.includes('[your-password]')
  );
}

function firstValidConnString(): string {
  const keys = [
    'DATABASE_URL',
    'SUPABASE_DB_URL',
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL',
    'POSTGRES_URL_NON_POOLING',
  ];
  for (const key of keys) {
    const val = env(key);
    if (val !== '' && !isPlaceholder(val)) {
      return val;
    }
  }
  return '';
}

export function hasDatabaseConfig(): boolean {
  if (firstValidConnString() !== '') return true;
  const host = env('DB_HOST') || env('POSTGRES_HOST');
  return host !== '' && !isPlaceholder(host);
}

export function assertSupabaseConfigured(): void {
  if (!hasDatabaseConfig()) {
    throw new Error(SUPABASE_NOT_CONFIGURED_MSG);
  }
}

function buildPoolConfig(): pg.PoolConfig {
  const isVercel = Boolean(process.env.VERCEL);
  const idleTimeoutMillis = isVercel ? 10000 : 15000;
  const databaseUrl = firstValidConnString();

  if (databaseUrl !== '') {
    const isLocal = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
    return {
      connectionString: databaseUrl,
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
      max: isVercel ? 3 : 10,
      idleTimeoutMillis,
      connectionTimeoutMillis: 8000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      allowExitOnIdle: isVercel,
    };
  }

  const rawHost = env('DB_HOST') || env('POSTGRES_HOST');
  const dbHost = rawHost !== '' && !isPlaceholder(rawHost) ? rawHost : 'supabase-unconfigured.invalid';
  const dbPort = Number(env('DB_PORT') || env('POSTGRES_PORT') || '6543');
  const dbName = env('DB_NAME') || env('POSTGRES_DATABASE') || 'postgres';
  const dbUser = env('DB_USER') || env('POSTGRES_USER') || 'postgres';
  const dbPass = env('DB_PASS') || env('POSTGRES_PASSWORD') || '';
  const isLocal = dbHost === 'localhost' || dbHost === '127.0.0.1';

  return {
    host: dbHost,
    port: dbPort,
    database: dbName,
    user: dbUser,
    password: dbPass,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: isVercel ? 3 : 10,
    idleTimeoutMillis,
    connectionTimeoutMillis: 8000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    allowExitOnIdle: isVercel,
  };
}

export const pool = new Pool(buildPoolConfig());

// Wajib ada agar disconnect pada idle client (Supabase PgBouncer / Transaction Pooler)
// tidak memicu Unhandled 'error' event pada BoundPool.
pool.on('error', (err) => {
  console.error('[Supabase Pool] Idle client connection error:', err.message);
});

export async function checkHealth(): Promise<{ totalKamar: number }> {
  assertSupabaseConfigured();
  const res = await pool.query<{ total: string }>('SELECT COUNT(*)::text AS total FROM public.kamar');
  return { totalKamar: Number(res.rows[0]?.total ?? 0) };
}
