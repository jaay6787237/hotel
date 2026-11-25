import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSignedToken,
  isHttpsHeaders,
  parseCookies,
  verifyAdminCredentials,
  verifySignedToken,
} from './auth.ts';
import {
  assertSupabaseConfigured,
  buildPoolConfig,
  checkHealth,
  formatSupabasePgError,
  getSupabaseConnectionMode,
  hasDatabaseConfig,
  hasPgDatabaseConfig,
  hasSupabaseApiConfig,
  parseSupabaseConnectionString,
  pool,
  SUPABASE_NOT_CONFIGURED_MSG,
  SUPABASE_PLACEHOLDER_PASSWORD_MSG,
} from './db.ts';
import {
  calculateReservationPricing,
  generateBookingCode,
  isRoomBookableStatus,
  isValidStayRange,
  resolveNextRoomStatus,
} from './pricing.ts';
import { renderLandingPage } from './views/landing.ts';
import { renderDashboardPage } from './views/dashboard.ts';

test('verifyAdminCredentials accepts default credentials case-insensitively and rejects wrong passwords', () => {
  assert.equal(verifyAdminCredentials('admin@bukitrandu.com', 'BukitRandu2026!'), true);
  assert.equal(verifyAdminCredentials(' ADMIN@BUKITRANDU.COM ', 'BukitRandu2026!'), true);
  assert.equal(verifyAdminCredentials('admin@bukitrandu.com', 'wrong-pass'), false);
  assert.equal(verifyAdminCredentials('other@bukitrandu.com', 'BukitRandu2026!'), false);
});

test('generateSignedToken and verifySignedToken validate signatures and expiry', () => {
  const now = 1_700_000_000;
  const token = generateSignedToken('admin@bukitrandu.com', now);
  const decoded = verifySignedToken(token, now + 60);
  assert.ok(decoded);
  assert.equal(decoded.user, 'admin@bukitrandu.com');
  assert.equal(decoded.role, 'admin');

  assert.equal(verifySignedToken(`${token}tamper`, now + 60), null);
  assert.equal(verifySignedToken(token, now + 50_000), null);
  assert.equal(verifySignedToken(null), null);
});

test('isHttpsHeaders detects Cloud Run nginx proxy even when x-forwarded-proto is overwritten to http', () => {
  assert.equal(isHttpsHeaders({}, false), false);
  assert.equal(isHttpsHeaders({ 'x-forwarded-proto': 'http', 'x-forwarded-host': 'localhost:3000' }, false), false);
  assert.equal(
    isHttpsHeaders(
      {
        'x-forwarded-proto': 'http',
        'x-forwarded-host': 'ais-dev-y3nw6t2mbjeouzci44wage-840745162085.asia-east1.run.app',
      },
      false
    ),
    true
  );
  assert.equal(
    isHttpsHeaders({ origin: 'https://ais-dev-y3nw6t2mbjeouzci44wage-840745162085.asia-east1.run.app' }, false),
    true
  );
});

test('parseCookies decodes cookie pairs cleanly', () => {
  const parsed = parseCookies('a=1; brh_admin_session=abc.def; empty=');
  assert.equal(parsed.a, '1');
  assert.equal(parsed.brh_admin_session, 'abc.def');
  assert.equal(parsed.empty, '');
});

test('calculateReservationPricing computes subtotal, capped discount, 5% service, and 10% tax', () => {
  const res = calculateReservationPricing({
    pricePerNight: 2_000_000,
    nights: 2,
    discountPercent: 15,
    maxDiscount: 1_500_000,
    isSuiteCategory: false,
  });
  assert.equal(res.subtotal, 4_000_000);
  assert.equal(res.potongan_diskon, 600_000);
  // dasar = 3,400,000; service 5% = 170,000; ppn 10% = 340,000; total = 3,910,000
  assert.equal(res.biaya_layanan, 170_000);
  assert.equal(res.pajak_ppn, 340_000);
  assert.equal(res.total_tagihan, 3_910_000);
  assert.equal(res.tipe_tagihan, 'TagihanKamar (Standar)');

  const capped = calculateReservationPricing({
    pricePerNight: 5_000_000,
    nights: 3,
    discountPercent: 20,
    maxDiscount: 1_000_000,
    isSuiteCategory: true,
  });
  assert.equal(capped.potongan_diskon, 1_000_000);
  assert.equal(capped.tipe_tagihan, 'TagihanSuite (Privilege)');
});

test('isValidStayRange enforces checkout strictly after checkin', () => {
  assert.equal(isValidStayRange('2026-12-01', '2026-12-03'), true);
  assert.equal(isValidStayRange('2026-12-01', '2026-12-01'), false);
  assert.equal(isValidStayRange('2026-12-05', '2026-12-03'), false);
  assert.equal(isValidStayRange('', '2026-12-03'), false);
});

test('resolveNextRoomStatus keeps room Tersedia on Dikonfirmasi and updates only on Check-In / Selesai / Check-In Cancel', () => {
  assert.equal(resolveNextRoomStatus(null, 'Dikonfirmasi', 'Tersedia'), 'Tersedia');
  assert.equal(resolveNextRoomStatus('Dikonfirmasi', 'Check-In', 'Tersedia'), 'Terisi');
  assert.equal(resolveNextRoomStatus('Check-In', 'Selesai', 'Terisi'), 'Pemeliharaan');
  assert.equal(resolveNextRoomStatus('Check-In', 'Batal', 'Terisi'), 'Tersedia');
  assert.equal(resolveNextRoomStatus('Dikonfirmasi', 'Batal', 'Tersedia'), 'Tersedia');
});

test('generateBookingCode returns BRH-XXXXXX format', () => {
  const code = generateBookingCode();
  assert.match(code, /^BRH-[A-Z2-9]{6}$/);
});

test('isRoomBookableStatus allows only Tersedia and blocks Terisi and Pemeliharaan', () => {
  assert.equal(isRoomBookableStatus('Tersedia'), true);
  assert.equal(isRoomBookableStatus('Terisi'), false);
  assert.equal(isRoomBookableStatus('Pemeliharaan'), false);
  assert.equal(isRoomBookableStatus(''), false);
});

test('hasDatabaseConfig supports Supabase pg URLs and Supabase API fallback, ignores SQL_HOST and placeholders', async () => {
  const keys = [
    'DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL',
    'POSTGRES_URL_NON_POOLING',
    'SUPABASE_DB_URL',
    'DB_HOST',
    'POSTGRES_HOST',
    'SQL_HOST',
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'VITE_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'VITE_SUPABASE_ANON_KEY',
  ] as const;
  const backup = Object.fromEntries(keys.map((k) => [k, process.env[k]]));

  try {
    for (const k of keys) delete process.env[k];
    assert.equal(hasDatabaseConfig(), false);
    assert.equal(getSupabaseConnectionMode(), 'unconfigured');
    assert.throws(() => assertSupabaseConfigured(), (err: Error) => err.message === SUPABASE_NOT_CONFIGURED_MSG);
    await assert.rejects(() => checkHealth(), (err: Error) => err.message === SUPABASE_NOT_CONFIGURED_MSG);

    // Cloud SQL env var must NOT satisfy Supabase-only configuration
    process.env.SQL_HOST = '10.0.0.1';
    assert.equal(hasDatabaseConfig(), false);

    // Placeholder [YOUR-DATABASE-PASSWORD] without API keys fails fast cleanly
    process.env.DATABASE_URL =
      'postgresql://postgres.exaheopeplazfmnftaxk:[YOUR-DATABASE-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';
    assert.equal(hasPgDatabaseConfig(), false);
    assert.equal(hasDatabaseConfig(), false);
    assert.throws(() => assertSupabaseConfigured(), (err: Error) => err.message === SUPABASE_PLACEHOLDER_PASSWORD_MSG);

    // Adding SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY activates supabase-api mode even without DATABASE_URL
    process.env.SUPABASE_URL = 'https://exaheopeplazfmnftaxk.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.testkey';
    assert.equal(hasSupabaseApiConfig(), true);
    assert.equal(getSupabaseConnectionMode(), 'supabase-api');
    assert.equal(hasDatabaseConfig(), true);
    assert.doesNotThrow(() => assertSupabaseConfigured());

    // Valid quoted DATABASE_URL switches mode to pg and strips surrounding quotes
    process.env.DATABASE_URL =
      '"postgresql://postgres.exaheopeplazfmnftaxk:RealPass123@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"';
    assert.equal(hasPgDatabaseConfig(), true);
    assert.equal(getSupabaseConnectionMode(), 'pg');
    const quotedCfg = buildPoolConfig();
    assert.equal(quotedCfg.host, 'aws-1-ap-southeast-1.pooler.supabase.com');
    assert.equal(quotedCfg.password, 'RealPass123');

    const parsed = parseSupabaseConnectionString(
      'postgresql://postgres.exaheopeplazfmnftaxk:P@ss#123!@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require'
    );
    assert.deepEqual(parsed, {
      host: 'aws-1-ap-southeast-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: 'postgres.exaheopeplazfmnftaxk',
      password: 'P@ss#123!',
      isLocal: false,
    });

    assert.ok(formatSupabasePgError({ code: '28P01', message: 'password authentication failed' }).includes('Password'));
    assert.ok(formatSupabasePgError(new Error('Tenant or user not found')).includes('postgres.<PROJECT_REF>'));
    assert.ok(formatSupabasePgError({ code: '42P01', message: 'relation "public.kamar" does not exist' }).includes('supabase_schema.sql'));
  } finally {
    for (const k of keys) {
      if (backup[k] === undefined) delete process.env[k];
      else process.env[k] = backup[k];
    }
  }
});

test('vercel.json rewrites dynamic traffic to /api/index while letting static public assets bypass', () => {
  const raw = readFileSync(path.resolve('vercel.json'), 'utf8');
  const cfg = JSON.parse(raw) as {
    outputDirectory?: string;
    functions?: Record<string, { includeFiles?: string }>;
    rewrites?: Array<{ source: string; destination: string }>;
  };
  assert.equal(cfg.outputDirectory, 'public');
  assert.equal(cfg.functions?.['api/index.ts']?.includeFiles, '{src/server/**,src/lib/**,public/**}');
  assert.equal(cfg.rewrites?.[0]?.destination, '/api/index');
  assert.ok(cfg.rewrites?.[0]?.source.includes('assets/'));
});

test('SSR landing and dashboard pages render critical sync and receipt markup without window.alert or window.open', () => {
  const landingHtml = renderLandingPage({
    rooms: [],
    promos: [],
    kwitansi: null,
    cekKodeError: null,
    searchedCode: '',
    dbError: null,
    flash: null,
    defaultCheckIn: '2026-12-01',
    defaultCheckOut: '2026-12-03',
  });
  const errIdx = landingHtml.indexOf('id="bm-error-box"');
  const step1Idx = landingHtml.indexOf('id="booking-step-1"');
  assert.ok(errIdx > 0 && step1Idx > 0 && errIdx < step1Idx, 'bm-error-box must precede booking-step-1');
  assert.ok(landingHtml.includes('id="printable-voucher"'));
  assert.equal(landingHtml.includes('arsitektur-db'), false);
  assert.equal(landingHtml.includes('Arsitektur SQL'), false);
  assert.equal(/\bwindow\.(alert|open)\s*\(/.test(landingHtml), false);

  const dashboardHtml = renderDashboardPage({
    adminIdentity: 'admin@bukitrandu.com',
    kpi: {
      total_kamar: 5,
      kamar_terisi: 1,
      kamar_tersedia: 4,
      kamar_pemeliharaan: 0,
      okupansi_persen: 20,
      reservasi_aktif: 1,
      pendapatan_lunas: 3000000,
    },
    reservations: [],
    rooms: [],
    categories: [],
    subqueryAnalytics: { rata_rata_tarif: 2500000, kamar_premium: [] },
    auditLogs: [],
    flash: null,
  });
  assert.ok(dashboardHtml.includes('/api/admin/sync'));
  assert.ok(dashboardHtml.includes('kamar_pemeliharaan'));
  assert.ok(dashboardHtml.includes('Terhubung langsung ke Supabase PostgreSQL'));
  assert.equal(/\bwindow\.(alert|open)\s*\(/.test(dashboardHtml), false);
});

test('PostgreSQL pool registers an error listener so idle disconnects do not crash Node', () => {
  assert.ok(pool.listenerCount('error') >= 1);
  assert.doesNotThrow(() => {
    pool.emit('error', new Error('Connection terminated unexpectedly'), undefined as never);
  });
});
