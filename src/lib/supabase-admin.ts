import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

function cleanEnv(raw: string | undefined): string {
  if (!raw) return '';
  let trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function getSupabaseUrl(): string {
  return cleanEnv(
    process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL
  );
}

export function getSupabaseKey(): string {
  return cleanEnv(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY
  );
}

export const isUsingSupabaseApi = (): boolean => {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  const urlLower = url.toLowerCase();
  const keyLower = key.toLowerCase();
  return Boolean(
    url &&
      key &&
      !urlLower.includes('your-project-id') &&
      !urlLower.includes('your-supabase') &&
      !keyLower.includes('your-supabase') &&
      !keyLower.includes('[your-')
  );
};

let cachedKeySignature = '';
let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isUsingSupabaseApi()) return null;
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  const signature = `${url}|${key}`;
  if (cachedClient && cachedKeySignature === signature) {
    return cachedClient;
  }
  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  cachedKeySignature = signature;
  return cachedClient;
}

export const supabaseAdmin: SupabaseClient | null = getSupabaseAdmin();
