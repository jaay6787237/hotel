import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

function env(key: string, fallback = ''): string {
  const val = process.env[key];
  return val !== undefined && val !== '' ? val : fallback;
}

function buildPoolConfig(): pg.PoolConfig {
  const databaseUrl = env('DATABASE_URL');
  if (databaseUrl !== '' && !databaseUrl.includes('your-project-id')) {
    const isLocal = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
    return {
      connectionString: databaseUrl,
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    };
  }

  let dbHost = env('DB_HOST');
  let dbPort = Number(env('DB_PORT', '5432'));
  let dbName = env('DB_NAME', 'postgres');
  let dbUser = env('DB_USER', 'postgres');
  let dbPass = env('DB_PASS', '');

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
    max: 10,
    idleTimeoutMillis: 30000,
  };
}

export const pool = new Pool(buildPoolConfig());

export async function checkHealth(): Promise<{ totalKamar: number }> {
  const res = await pool.query<{ total: string }>('SELECT COUNT(*)::text AS total FROM public.kamar');
  return { totalKamar: Number(res.rows[0]?.total ?? 0) };
}
