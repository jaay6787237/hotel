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
  calculateReservationPricing,
  generateBookingCode,
  isValidStayRange,
  resolveNextRoomStatus,
} from './pricing.ts';

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
  // Booking Dikonfirmasi -> kamar tetap Tersedia
  assert.equal(resolveNextRoomStatus(null, 'Dikonfirmasi', 'Tersedia'), 'Tersedia');
  // Tamu Check-In -> kamar Terisi
  assert.equal(resolveNextRoomStatus('Dikonfirmasi', 'Check-In', 'Tersedia'), 'Terisi');
  // Tamu Check-Out (Selesai) -> kamar Pemeliharaan
  assert.equal(resolveNextRoomStatus('Check-In', 'Selesai', 'Terisi'), 'Pemeliharaan');
  // Batal setelah Check-In -> kamar kembali Tersedia
  assert.equal(resolveNextRoomStatus('Check-In', 'Batal', 'Terisi'), 'Tersedia');
  // Batal sebelum Check-In -> kamar tetap status semula
  assert.equal(resolveNextRoomStatus('Dikonfirmasi', 'Batal', 'Tersedia'), 'Tersedia');
});

test('generateBookingCode returns BRH-XXXXXX format', () => {
  const code = generateBookingCode();
  assert.match(code, /^BRH-[A-Z2-9]{6}$/);
});
