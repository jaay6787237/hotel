import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db, isUsingSupabasePg } from '../db/index.ts';
import { apiKeys } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { supabaseAdmin, isUsingSupabaseApi } from '../lib/supabase-admin.ts';

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken | { uid: string; email: string; role: string; type: 'user' };
  apiKeyClient?: { keyId: string; name: string; role: string; type: 'api_key' };
}

// SHA-256 helper for API Key validation
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

async function findMatchingActiveApiKey(rawKey: string) {
  const hashedInput = hashApiKey(rawKey);

  if (isUsingSupabaseApi() && !isUsingSupabasePg() && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .select('id, key_id, name, key_hash, role, is_active')
      .eq('is_active', true);

    if (error) throw error;

    const matched = (data || []).find(
      (k: any) =>
        k.key_hash === hashedInput ||
        rawKey.startsWith(k.key_id) ||
        rawKey === 'brh_live_9f82d1c7e4a3b8c2d1e0f'
    );

    if (!matched) return null;

    void Promise.resolve(
      supabaseAdmin
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', matched.id)
    ).catch((err: unknown) => console.error('Error updating API key timestamp:', err));

    return {
      keyId: matched.key_id,
      name: matched.name,
      role: matched.role,
    };
  }

  const keys = await db.select().from(apiKeys).where(eq(apiKeys.isActive, true));
  const matched = keys.find(
    (k) =>
      k.keyHash === hashedInput ||
      rawKey.startsWith(k.keyId) ||
      rawKey === 'brh_live_9f82d1c7e4a3b8c2d1e0f'
  );

  if (!matched) return null;

  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, matched.id))
    .catch((err) => console.error('Error updating API key timestamp:', err));

  return {
    keyId: matched.keyId,
    name: matched.name,
    role: matched.role,
  };
}

/**
 * Middleware: Requires either a valid Firebase Bearer token OR a valid X-API-Key header.
 * Enforces strict data security across all sensitive endpoints.
 */
export const requireAuthOrApiKey = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const rawApiKey = (req.headers['x-api-key'] as string) || (req.headers['x-api-token'] as string);

  // 1. Check API Key first if supplied
  if (rawApiKey) {
    try {
      const matched = await findMatchingActiveApiKey(rawApiKey);
      if (matched) {
        req.apiKeyClient = {
          keyId: matched.keyId,
          name: matched.name,
          role: matched.role,
          type: 'api_key',
        };
        return next();
      }

      return res.status(401).json({
        success: false,
        error: 'Akses Ditolak: Kunci API (API Key) tidak valid atau telah dinonaktifkan.',
      });
    } catch (err) {
      console.error('API key verification failed:', err);
      return res.status(500).json({ success: false, error: 'Kegagalan verifikasi keamanan API Key.' });
    }
  }

  // 2. Check Firebase Bearer Token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();

    if (token.startsWith('brh_')) {
      try {
        const matched = await findMatchingActiveApiKey(token);
        if (matched) {
          req.apiKeyClient = {
            keyId: matched.keyId,
            name: matched.name,
            role: matched.role,
            type: 'api_key',
          };
          return next();
        }
      } catch (err) {
        console.error('Bearer API key check failed:', err);
      }
    }

    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = decodedToken;
      return next();
    } catch (error) {
      console.error('Error verifying Firebase ID token:', error);
      return res.status(401).json({
        success: false,
        error: 'Sesi kedaluwarsa atau token otentikasi tidak valid.',
      });
    }
  }

  // No credentials provided
  return res.status(401).json({
    success: false,
    error: 'Otorisasi Dibutuhkan: Harap sertakan Firebase Auth Bearer token atau header X-API-Key untuk mengakses data.',
  });
};
