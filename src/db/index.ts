import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads / serverless invocations
declare global {
  var _postgresPool: Pool | undefined;
}

export const isUsingSupabasePg = (): boolean => {
  return Boolean(
    process.env.SUPABASE_DB_HOST &&
      !process.env.SUPABASE_DB_HOST.includes('your-project-id') &&
      process.env.SUPABASE_DB_PASSWORD &&
      !process.env.SUPABASE_DB_PASSWORD.includes('your-supabase')
  );
};

// Function to create or retrieve the connection pool using the Object Method.
// Supports Supabase PostgreSQL Pooler (SUPABASE_DB_*) with SSL and AI Studio Cloud SQL (SQL_*).
export const createPool = () => {
  if (!global._postgresPool) {
    if (isUsingSupabasePg()) {
      global._postgresPool = new Pool({
        host: process.env.SUPABASE_DB_HOST,
        port: parseInt(process.env.SUPABASE_DB_PORT || '6543', 10),
        user: process.env.SUPABASE_DB_USER || 'postgres',
        password: process.env.SUPABASE_DB_PASSWORD,
        database: process.env.SUPABASE_DB_NAME || 'postgres',
        ssl: {
          rejectUnauthorized: false,
        },
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    } else {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    }

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
