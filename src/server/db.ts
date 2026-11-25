import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

export const SUPABASE_NOT_CONFIGURED_MSG =
  'Database Supabase belum terhubung. Tambahkan DATABASE_URL (atau SUPABASE_DB_URL / DB_HOST, DB_USER, DB_PASS) di file .env atau Vercel Environment Variables.';

export const SUPABASE_PLACEHOLDER_PASSWORD_MSG =
  'Password di DATABASE_URL Supabase masih berupa placeholder [YOUR-DATABASE-PASSWORD]. Ganti bagian tersebut dengan password database Supabase asli Anda (tanpa tanda kurung siku [ ]).';

function env(key: string, fallback = ''): string {
  const val = process.env[key];
  return val !== undefined && val !== '' ? val.trim() : fallback;
}

function hasPlaceholderPassword(val: string): boolean {
  const lower = val.toLowerCase();
  return (
    lower.includes('[your-database-password]') ||
    lower.includes('[your-password]') ||
    lower.includes('your-database-password') ||
    lower.includes('your-supabase-database-password')
  );
}

function isPlaceholder(val: string): boolean {
  const lower = val.toLowerCase();
  return (
    lower.includes('your-project-id') ||
    lower.includes('your-supabase') ||
    hasPlaceholderPassword(lower)
  );
}

const CONN_STRING_KEYS = [
  'DATABASE_URL',
  'SUPABASE_DB_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
] as const;

function rawConnString(): string {
  for (const key of CONN_STRING_KEYS) {
    const val = env(key);
    if (val !== '') return val;
  }
  return '';
}

function firstValidConnString(): string {
  for (const key of CONN_STRING_KEYS) {
    const val = env(key);
    if (val !== '' && !isPlaceholder(val)) {
      return val;
    }
  }
  return '';
}

export interface ParsedSupabaseUrl {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  isLocal: boolean;
}

export function parseSupabaseConnectionString(connStr: string): ParsedSupabaseUrl | null {
  const trimmed = connStr.trim();
  const schemeIdx = trimmed.indexOf('://');
  if (schemeIdx === -1) return null;

  const afterScheme = trimmed.slice(schemeIdx + 3);
  const atIdx = afterScheme.lastIndexOf('@');
  if (atIdx === -1) return null;

  const authPart = afterScheme.slice(0, atIdx);
  const hostAndRest = afterScheme.slice(atIdx + 1);

  const colonIdx = authPart.indexOf(':');
  const rawUser = colonIdx === -1 ? authPart : authPart.slice(0, colonIdx);
  const rawPass = colonIdx === -1 ? '' : authPart.slice(colonIdx + 1);

  const decodeSafe = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };

  const user = decodeSafe(rawUser);
  const password = decodeSafe(rawPass);

  const queryIdx = hostAndRest.indexOf('?');
  const hostPath = queryIdx === -1 ? hostAndRest : hostAndRest.slice(0, queryIdx);
  const slashIdx = hostPath.indexOf('/');
  const hostPort = slashIdx === -1 ? hostPath : hostPath.slice(0, slashIdx);
  const database = slashIdx === -1 ? 'postgres' : decodeSafe(hostPath.slice(slashIdx + 1)) || 'postgres';

  const portColonIdx = hostPort.lastIndexOf(':');
  const host = portColonIdx === -1 ? hostPort : hostPort.slice(0, portColonIdx);
  const portRaw = portColonIdx === -1 ? '6543' : hostPort.slice(portColonIdx + 1);
  const port = Number(portRaw) || 6543;

  if (!host) return null;
  const isLocal = host === 'localhost' || host === '127.0.0.1';

  return { host, port, database, user, password, isLocal };
}

export function hasDatabaseConfig(): boolean {
  if (firstValidConnString() !== '') return true;
  const host = env('DB_HOST') || env('POSTGRES_HOST');
  const pass = env('DB_PASS') || env('POSTGRES_PASSWORD');
  return host !== '' && !isPlaceholder(host) && !hasPlaceholderPassword(pass);
}

export function getSupabaseConfigError(): string | null {
  if (hasDatabaseConfig()) return null;
  const raw = rawConnString();
  const rawPass = env('DB_PASS') || env('POSTGRES_PASSWORD');
  if (hasPlaceholderPassword(raw) || hasPlaceholderPassword(rawPass)) {
    return SUPABASE_PLACEHOLDER_PASSWORD_MSG;
  }
  return SUPABASE_NOT_CONFIGURED_MSG;
}

export function assertSupabaseConfigured(): void {
  const errMsg = getSupabaseConfigError();
  if (errMsg) {
    throw new Error(errMsg);
  }
}

export function buildPoolConfig(): pg.PoolConfig {
  const isVercel = Boolean(process.env.VERCEL);
  const idleTimeoutMillis = isVercel ? 10000 : 15000;
  const databaseUrl = firstValidConnString();

  if (databaseUrl !== '') {
    const parsed = parseSupabaseConnectionString(databaseUrl);
    if (parsed) {
      return {
        host: parsed.host,
        port: parsed.port,
        database: parsed.database,
        user: parsed.user,
        password: parsed.password,
        ssl: parsed.isLocal ? undefined : { rejectUnauthorized: false },
        max: isVercel ? 3 : 10,
        idleTimeoutMillis,
        connectionTimeoutMillis: 8000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
        allowExitOnIdle: isVercel,
      };
    }

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
  await pool.query('SELECT 1');
  try {
    const res = await pool.query<{ total: string }>('SELECT COUNT(*)::text AS total FROM public.kamar');
    return { totalKamar: Number(res.rows[0]?.total ?? 0) };
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? String((err as { code?: unknown }).code) : '';
    if (code === '42P01') {
      throw new Error(
        "Koneksi ke Supabase PostgreSQL berhasil, tetapi tabel 'public.kamar' belum ada. Jalankan seluruh script supabase_schema.sql di Supabase SQL Editor."
      );
    }
    throw err;
  }
}
