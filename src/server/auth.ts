import crypto from 'node:crypto';
import type { Request, Response } from 'express';

export const ADMIN_COOKIE_NAME = 'brh_admin_session';
export const FLASH_COOKIE_NAME = 'brh_flash';
export const SESSION_TTL_SECONDS = 43200; // 12 jam

export interface AdminSessionPayload {
  user: string;
  role: string;
  exp: number;
}

export interface FlashMessage {
  type: 'success' | 'error';
  message: string;
}

export function getAppKey(): string {
  return process.env.APP_KEY || 'bukit-randu-hospitality-lampung-secret-key-2026-hmac';
}

export function getConfiguredAdminUsername(): string {
  return process.env.ADMIN_USER || 'admin@bukitrandu.com';
}

export function getConfiguredAdminPassword(): string {
  return process.env.ADMIN_PASS || 'BukitRandu2026!';
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUser = getConfiguredAdminUsername().trim().toLowerCase();
  const actualUser = username.trim().toLowerCase();
  const expectedPass = getConfiguredAdminPassword();
  return safeEqual(expectedUser, actualUser) && safeEqual(expectedPass, password);
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(encoded: string): string | null {
  try {
    let padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const mod = padded.length % 4;
    if (mod > 0) {
      padded += '='.repeat(4 - mod);
    }
    return Buffer.from(padded, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

export function generateSignedToken(username: string, nowSeconds = Math.floor(Date.now() / 1000)): string {
  const payload: AdminSessionPayload = {
    user: username,
    role: 'admin',
    exp: nowSeconds + SESSION_TTL_SECONDS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', getAppKey()).update(encodedPayload).digest('hex');
  return `${encodedPayload}.${signature}`;
}

export function verifySignedToken(
  token: string | null | undefined,
  nowSeconds = Math.floor(Date.now() / 1000)
): AdminSessionPayload | null {
  if (!token || !token.includes('.')) {
    return null;
  }
  const dotIdx = token.indexOf('.');
  const encodedPayload = token.slice(0, dotIdx);
  const providedSignature = token.slice(dotIdx + 1);
  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = crypto.createHmac('sha256', getAppKey()).update(encodedPayload).digest('hex');
  if (!safeEqual(expectedSignature, providedSignature)) {
    return null;
  }

  const decoded = base64UrlDecode(encodedPayload);
  if (!decoded) {
    return null;
  }

  try {
    const data = JSON.parse(decoded) as Partial<AdminSessionPayload>;
    if (!data || typeof data.user !== 'string' || typeof data.exp !== 'number') {
      return null;
    }
    if (data.exp < nowSeconds) {
      return null;
    }
    return {
      user: data.user,
      role: typeof data.role === 'string' ? data.role : 'admin',
      exp: data.exp,
    };
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) {
    return out;
  }
  for (const part of cookieHeader.split(';')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    const rawVal = part.slice(eqIdx + 1).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(rawVal);
    } catch {
      out[key] = rawVal;
    }
  }
  return out;
}

export function isHttpsHeaders(
  headers: Record<string, string | string[] | undefined>,
  isReqSecure = false
): boolean {
  if (isReqSecure) {
    return true;
  }
  const first = (val: string | string[] | undefined): string =>
    Array.isArray(val) ? (val[0] ?? '') : (val ?? '');

  if (first(headers['x-forwarded-proto']).toLowerCase() === 'https') {
    return true;
  }
  if (first(headers['origin']).toLowerCase().startsWith('https://')) {
    return true;
  }
  if (first(headers['referer']).toLowerCase().startsWith('https://')) {
    return true;
  }
  const fwdHost = first(headers['x-forwarded-host']).toLowerCase();
  if (fwdHost !== '' && !fwdHost.startsWith('localhost') && !fwdHost.startsWith('127.0.0.1')) {
    return true;
  }
  return false;
}

export function sendCookie(
  res: Response,
  req: Request,
  name: string,
  value: string,
  maxAgeSeconds: number
): void {
  const https = isHttpsHeaders(req.headers, req.secure);
  const clampedMaxAge = Math.max(0, maxAgeSeconds);
  const expiresDate = new Date(Date.now() + (maxAgeSeconds > 0 ? maxAgeSeconds * 1000 : -3600 * 1000));
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Expires=${expiresDate.toUTCString()}`,
    `Max-Age=${clampedMaxAge}`,
    'Path=/',
    'HttpOnly',
  ];

  if (https) {
    parts.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    parts.push('SameSite=Lax');
  }

  res.append('Set-Cookie', parts.join('; '));
}

export function setFlash(res: Response, req: Request, type: 'success' | 'error', message: string): void {
  const encoded = base64UrlEncode(JSON.stringify({ type, message }));
  const sig = crypto.createHmac('sha256', getAppKey()).update(encoded).digest('hex');
  sendCookie(res, req, FLASH_COOKIE_NAME, `${encoded}.${sig}`, 120);
}

export function consumeFlash(req: Request, res: Response): FlashMessage | null {
  const cookies = parseCookies(req.headers.cookie);
  const raw = cookies[FLASH_COOKIE_NAME] || '';
  if (!raw || !raw.includes('.')) {
    return null;
  }

  sendCookie(res, req, FLASH_COOKIE_NAME, '', 0);

  const dotIdx = raw.indexOf('.');
  const encoded = raw.slice(0, dotIdx);
  const sig = raw.slice(dotIdx + 1);
  const expected = crypto.createHmac('sha256', getAppKey()).update(encoded).digest('hex');
  if (!safeEqual(expected, sig)) {
    return null;
  }

  const decoded = base64UrlDecode(encoded);
  if (!decoded) {
    return null;
  }

  try {
    const parsed = JSON.parse(decoded) as Partial<FlashMessage>;
    if ((parsed.type === 'success' || parsed.type === 'error') && typeof parsed.message === 'string') {
      return { type: parsed.type, message: parsed.message };
    }
    return null;
  } catch {
    return null;
  }
}

export function getAuthenticatedAdmin(req: Request): AdminSessionPayload | null {
  const cookies = parseCookies(req.headers.cookie);
  return verifySignedToken(cookies[ADMIN_COOKIE_NAME]);
}
