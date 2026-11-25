import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

function env(key: string, fallback = ''): string {
  const val = process.env[key];
  return val !== undefined && val !== '' ? val : fallback;
}

function firstValidConnString(): string {
  const keys = [
    'DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL',
    'POSTGRES_URL_NON_POOLING',
    'SUPABASE_DB_URL',
  ];
  for (const key of keys) {
    const val = env(key);
    if (val !== '' && !val.includes('your-project-id') && !val.includes('your-supabase')) {
      return val;
    }
  }
  return '';
}

export function hasDatabaseConfig(): boolean {
  if (firstValidConnString() !== '') return true;
  const host = env('DB_HOST') || env('POSTGRES_HOST') || env('SQL_HOST');
  return host !== '' && !host.includes('your-project-id');
}

function buildPoolConfig(): pg.PoolConfig {
  const isVercel = Boolean(process.env.VERCEL);
  const databaseUrl = firstValidConnString();
  if (databaseUrl !== '') {
    const isLocal = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
    return {
      connectionString: databaseUrl,
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
      max: isVercel ? 3 : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
    };
  }

  let dbHost = env('DB_HOST') || env('POSTGRES_HOST');
  let dbPort = Number(env('DB_PORT') || env('POSTGRES_PORT') || '5432');
  let dbName = env('DB_NAME') || env('POSTGRES_DATABASE') || 'postgres';
  let dbUser = env('DB_USER') || env('POSTGRES_USER') || 'postgres';
  let dbPass = env('DB_PASS') || env('POSTGRES_PASSWORD') || '';

  if (dbHost === '' || dbHost.includes('your-project-id')) {
    const sqlHost = env('SQL_HOST');
    const sqlDb = env('SQL_DB_NAME');
    const sqlUser = env('SQL_USER');
    const sqlPass = env('SQL_PASSWORD');

    if (sqlHost !== '' && sqlDb !== '' && sqlUser !== '') {
      dbHost = sqlHost;
      dbPort = 5432;
      dbName = sqlDb;
      dbUser = sqlUser;
      dbPass = sqlPass;
    } else {
      dbHost = '127.0.0.1';
    }
  }

  const isUnixSocket = dbHost.startsWith('/');
  const isLocal = isUnixSocket || dbHost === 'localhost' || dbHost === '127.0.0.1';

  return {
    host: dbHost,
    port: dbPort,
    database: dbName,
    user: dbUser,
    password: dbPass,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: isVercel ? 3 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 8000,
  };
}

export const pool = new Pool(buildPoolConfig());

export async function checkHealth(): Promise<{ totalKamar: number }> {
  if (process.env.VERCEL && !hasDatabaseConfig()) {
    throw new Error(
      'Variabel koneksi PostgreSQL (DATABASE_URL / POSTGRES_URL / DB_HOST) belum diatur di Vercel Environment Variables.'
    );
  }
  const res = await pool.query<{ total: string }>('SELECT COUNT(*)::text AS total FROM public.kamar');
  return { totalKamar: Number(res.rows[0]?.total ?? 0) };
}
