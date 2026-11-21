import type { PoolClient } from 'pg';
import { pool } from './db.ts';
import {
  calculateReservationPricing,
  generateBookingCode,
  isValidStayRange,
  resolveNextRoomStatus,
} from './pricing.ts';

export class KamarPenuhException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KamarPenuhException';
  }
}

export class KamarKotorException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KamarKotorException';
  }
}

export class VoucherTidakValidException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VoucherTidakValidException';
  }
}

export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInputError';
  }
}

export interface RoomRow {
  id_kamar: number;
  kode_kamar: string;
  id_kategori: number;
  nomor_kamar: string;
  nama_kamar: string;
  tagline: string | null;
  deskripsi: string | null;
  tarif_per_malam: string | number;
  kapasitas_tamu: number;
  luas_m2: number;
  tipe_kasur: string;
  pemandangan: string;
  fasilitas: string;
  fasilitas_array: string[];
  url_gambar: string;
  is_featured: boolean;
  status_ketersediaan: string;
  kode_kategori: string;
  nama_kategori: string;
  tipe_pemandangan?: string;
}

export interface CategoryRow {
  id_kategori: number;
  kode_kategori: string;
  nama_kategori: string;
  deskripsi: string | null;
  kapasitas_maks: number;
  tipe_pemandangan: string;
}

export interface PromoRow {
  id_voucher: number;
  kode_promo: string;
  nama_promo: string;
  persen_diskon: number;
  maks_diskon: string | number;
  berlaku_hingga: string;
  is_active: boolean;
}

export interface ReservationReportRow {
  id_reservasi: number;
  kode_booking: string;
  nama_tamu: string;
  email_tamu: string;
  telepon_tamu: string;
  kota_asal: string | null;
  id_kamar: number;
  kode_kamar: string;
  nomor_kamar: string;
  nama_kamar: string;
  status_kamar: string;
  kode_kategori: string;
  nama_kategori: string;
  kode_promo: string;
  nama_promo: string;
  persen_diskon: number;
  tgl_checkin: string;
  tgl_checkout: string;
  jumlah_malam: number;
  jumlah_tamu: number;
  catatan_khusus: string | null;
  subtotal: string | number;
  potongan_diskon: string | number;
  biaya_layanan: string | number;
  pajak_ppn: string | number;
  total_tagihan: string | number;
  status_reservasi: string;
  metode_pembayaran: string;
  status_pembayaran: string;
  nomor_referensi: string;
  created_at: string;
  tipe_tagihan_oop?: string;
}

export interface AuditLogRow {
  id_log: number;
  id_reservasi: number;
  kode_booking: string | null;
  status_lama: string | null;
  status_baru: string;
  keterangan: string | null;
  waktu_perubahan: string;
}

export interface KpiMetrics {
  total_kamar: number;
  kamar_terisi: number;
  kamar_tersedia: number;
  kamar_pemeliharaan: number;
  okupansi_persen: number;
  reservasi_aktif: number;
  pendapatan_lunas: number;
}

export interface SubqueryAnalytics {
  rata_rata_tarif: number;
  kamar_premium: Array<{
    id_kamar: number;
    kode_kamar: string;
    nomor_kamar: string;
    nama_kamar: string;
    tarif_per_malam: string | number;
    status_ketersediaan: string;
    nama_kategori: string;
  }>;
}

function parseFacilities(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map(String);
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function formatDateValue(val: unknown): string {
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }
  const str = String(val ?? '');
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  return str;
}

function normalizeReservationRow(row: Record<string, unknown>): ReservationReportRow {
  return {
    id_reservasi: Number(row.id_reservasi),
    kode_booking: String(row.kode_booking ?? ''),
    nama_tamu: String(row.nama_tamu ?? ''),
    email_tamu: String(row.email_tamu ?? ''),
    telepon_tamu: String(row.telepon_tamu ?? ''),
    kota_asal: row.kota_asal != null ? String(row.kota_asal) : null,
    id_kamar: Number(row.id_kamar),
    kode_kamar: String(row.kode_kamar ?? ''),
    nomor_kamar: String(row.nomor_kamar ?? ''),
    nama_kamar: String(row.nama_kamar ?? ''),
    status_kamar: String(row.status_kamar ?? ''),
    kode_kategori: String(row.kode_kategori ?? ''),
    nama_kategori: String(row.nama_kategori ?? ''),
    kode_promo: String(row.kode_promo ?? '-'),
    nama_promo: String(row.nama_promo ?? 'Tanpa Promo'),
    persen_diskon: Number(row.persen_diskon ?? 0),
    tgl_checkin: formatDateValue(row.tgl_checkin),
    tgl_checkout: formatDateValue(row.tgl_checkout),
    jumlah_malam: Number(row.jumlah_malam ?? 1),
    jumlah_tamu: Number(row.jumlah_tamu ?? 2),
    catatan_khusus: row.catatan_khusus != null ? String(row.catatan_khusus) : null,
    subtotal: Number(row.subtotal ?? 0),
    potongan_diskon: Number(row.potongan_diskon ?? 0),
    biaya_layanan: Number(row.biaya_layanan ?? 0),
    pajak_ppn: Number(row.pajak_ppn ?? 0),
    total_tagihan: Number(row.total_tagihan ?? 0),
    status_reservasi: String(row.status_reservasi ?? 'Dikonfirmasi'),
    metode_pembayaran: String(row.metode_pembayaran ?? 'Bayar di Resepsionis'),
    status_pembayaran: String(row.status_pembayaran ?? 'Belum Lunas'),
    nomor_referensi: String(row.nomor_referensi ?? '-'),
    created_at: String(row.created_at ?? ''),
  };
}

function getPgCode(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'code' in err) {
    return String((err as { code?: unknown }).code ?? '');
  }
  return undefined;
}

const MULTI_JOIN_SELECT = `
  SELECT
    r.id_reservasi,
    r.kode_booking,
    t.nama_lengkap AS nama_tamu,
    t.email AS email_tamu,
    t.no_telepon AS telepon_tamu,
    t.kota_asal,
    k.id_kamar,
    k.kode_kamar,
    k.nomor_kamar,
    k.nama_kamar,
    k.status_ketersediaan AS status_kamar,
    kk.kode_kategori,
    kk.nama_kategori,
    COALESCE(vp.kode_promo, '-') AS kode_promo,
    COALESCE(vp.nama_promo, 'Tanpa Promo') AS nama_promo,
    COALESCE(vp.persen_diskon, 0) AS persen_diskon,
    r.tgl_checkin::text AS tgl_checkin,
    r.tgl_checkout::text AS tgl_checkout,
    r.jumlah_malam,
    r.jumlah_tamu,
    r.catatan_khusus,
    r.subtotal,
    r.potongan_diskon,
    r.biaya_layanan,
    r.pajak_ppn,
    r.total_tagihan,
    r.status_reservasi,
    COALESCE(p.metode_pembayaran, 'Bayar di Resepsionis') AS metode_pembayaran,
    COALESCE(p.status_pembayaran, 'Belum Lunas') AS status_pembayaran,
    COALESCE(p.nomor_referensi, '-') AS nomor_referensi,
    r.created_at
  FROM public.reservasi r
  INNER JOIN public.tamu t ON r.id_tamu = t.id_tamu
  INNER JOIN public.kamar k ON r.id_kamar = k.id_kamar
  INNER JOIN public.kategori_kamar kk ON k.id_kategori = kk.id_kategori
  LEFT JOIN public.pembayaran p ON r.id_reservasi = p.id_reservasi
  LEFT JOIN public.voucher_promo vp ON r.id_voucher = vp.id_voucher
`;

export async function getRoomsWithCategory(): Promise<RoomRow[]> {
  const res = await pool.query<Record<string, unknown>>(
    `SELECT k.*, kk.kode_kategori, kk.nama_kategori, kk.tipe_pemandangan
     FROM public.kamar k
     INNER JOIN public.kategori_kamar kk ON k.id_kategori = kk.id_kategori
     ORDER BY k.nomor_kamar ASC`
  );
  return res.rows.map((row) => ({
    ...(row as unknown as RoomRow),
    id_kamar: Number(row.id_kamar),
    id_kategori: Number(row.id_kategori),
    kapasitas_tamu: Number(row.kapasitas_tamu ?? 2),
    luas_m2: Number(row.luas_m2 ?? 45),
    is_featured: Boolean(row.is_featured),
    fasilitas_array: parseFacilities(row.fasilitas),
  }));
}

export async function findRoomById(idKamar: number): Promise<RoomRow | null> {
  const res = await pool.query<Record<string, unknown>>(
    `SELECT k.*, kk.kode_kategori, kk.nama_kategori
     FROM public.kamar k
     INNER JOIN public.kategori_kamar kk ON k.id_kategori = kk.id_kategori
     WHERE k.id_kamar = $1
     LIMIT 1`,
    [idKamar]
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    ...(row as unknown as RoomRow),
    id_kamar: Number(row.id_kamar),
    id_kategori: Number(row.id_kategori),
    kapasitas_tamu: Number(row.kapasitas_tamu ?? 2),
    luas_m2: Number(row.luas_m2 ?? 45),
    is_featured: Boolean(row.is_featured),
    fasilitas_array: parseFacilities(row.fasilitas),
  };
}

export async function getCategories(): Promise<CategoryRow[]> {
  const res = await pool.query<CategoryRow>('SELECT * FROM public.kategori_kamar ORDER BY id_kategori ASC');
  return res.rows;
}

export async function getActivePromos(): Promise<PromoRow[]> {
  const res = await pool.query<PromoRow>(
    `SELECT * FROM public.voucher_promo
     WHERE is_active = TRUE AND berlaku_hingga >= CURRENT_DATE
     ORDER BY persen_diskon DESC`
  );
  return res.rows;
}

export async function validatePromoCode(kodePromo: string): Promise<PromoRow> {
  const clean = kodePromo.trim().toUpperCase();
  if (!clean) {
    throw new VoucherTidakValidException('Kode promo tidak boleh kosong.');
  }
  const res = await pool.query<PromoRow>(
    `SELECT * FROM public.voucher_promo
     WHERE UPPER(kode_promo) = $1
       AND is_active = TRUE
       AND berlaku_hingga >= CURRENT_DATE
     LIMIT 1`,
    [clean]
  );
  const promo = res.rows[0];
  if (!promo) {
    throw new VoucherTidakValidException(
      `Kode promo '${clean}' tidak valid, nonaktif, atau sudah kedaluwarsa.`
    );
  }
  return promo;
}

export async function cekKetersediaanKamar(
  idKamar: number,
  tglCheckin: string,
  tglCheckout: string
): Promise<boolean> {
  if (!isValidStayRange(tglCheckin, tglCheckout)) {
    return false;
  }
  try {
    const res = await pool.query<{ tersedia: boolean }>(
      'SELECT public.sf_cek_ketersediaan_kamar($1, $2::date, $3::date) AS tersedia',
      [idKamar, tglCheckin, tglCheckout]
    );
    return Boolean(res.rows[0]?.tersedia);
  } catch (err) {
    if (getPgCode(err) !== '42883') {
      throw err;
    }
    const kRes = await pool.query<{ status_ketersediaan: string }>(
      'SELECT status_ketersediaan FROM public.kamar WHERE id_kamar = $1',
      [idKamar]
    );
    const statusKamar = kRes.rows[0]?.status_ketersediaan;
    if (!statusKamar || statusKamar === 'Pemeliharaan') {
      return false;
    }
    const bRes = await pool.query<{ cnt: string }>(
      `SELECT COUNT(*)::text AS cnt FROM public.reservasi
       WHERE id_kamar = $1
         AND status_reservasi NOT IN ('Batal', 'Selesai')
         AND (tgl_checkin < $3::date AND tgl_checkout > $2::date)`,
      [idKamar, tglCheckin, tglCheckout]
    );
    return Number(bRes.rows[0]?.cnt ?? 0) === 0;
  }
}

export async function findByKodeBooking(kodeBooking: string): Promise<ReservationReportRow | null> {
  const clean = kodeBooking.trim();
  if (!clean) return null;
  try {
    const res = await pool.query<Record<string, unknown>>(
      'SELECT * FROM public.vw_laporan_reservasi_lengkap WHERE UPPER(kode_booking) = UPPER($1) LIMIT 1',
      [clean]
    );
    return res.rows[0] ? normalizeReservationRow(res.rows[0]) : null;
  } catch (err) {
    if (getPgCode(err) !== '42P01') {
      throw err;
    }
    const res = await pool.query<Record<string, unknown>>(
      `${MULTI_JOIN_SELECT} WHERE UPPER(r.kode_booking) = UPPER($1) LIMIT 1`,
      [clean]
    );
    return res.rows[0] ? normalizeReservationRow(res.rows[0]) : null;
  }
}

export async function getLaporanMultiJoin(): Promise<ReservationReportRow[]> {
  try {
    const res = await pool.query<Record<string, unknown>>(
      'SELECT * FROM public.vw_laporan_reservasi_lengkap'
    );
    return res.rows.map(normalizeReservationRow);
  } catch (err) {
    if (getPgCode(err) !== '42P01') {
      throw err;
    }
    const res = await pool.query<Record<string, unknown>>(
      `${MULTI_JOIN_SELECT} ORDER BY r.created_at DESC`
    );
    return res.rows.map(normalizeReservationRow);
  }
}

export async function getKpiMetrics(): Promise<KpiMetrics> {
  const kamarRes = await pool.query<Record<string, string>>(
    `SELECT
       COUNT(*)::text AS total_kamar,
       COUNT(*) FILTER (WHERE status_ketersediaan = 'Terisi')::text AS kamar_terisi,
       COUNT(*) FILTER (WHERE status_ketersediaan = 'Tersedia')::text AS kamar_tersedia,
       COUNT(*) FILTER (WHERE status_ketersediaan = 'Pemeliharaan')::text AS kamar_pemeliharaan
     FROM public.kamar`
  );
  const stats = kamarRes.rows[0] ?? {};
  const totalKamar = Number(stats.total_kamar ?? 0);
  const kamarTerisi = Number(stats.kamar_terisi ?? 0);
  const okupansiPersen = totalKamar > 0 ? Math.round((kamarTerisi / totalKamar) * 1000) / 10 : 0;

  const resAktif = await pool.query<{ aktif: string }>(
    `SELECT COUNT(*)::text AS aktif
     FROM public.reservasi
     WHERE status_reservasi IN ('Dikonfirmasi', 'Check-In')`
  );
  const payRes = await pool.query<{ total: string }>(
    `SELECT COALESCE(SUM(jumlah_bayar), 0)::text AS total
     FROM public.pembayaran
     WHERE status_pembayaran = 'Lunas'`
  );

  return {
    total_kamar: totalKamar,
    kamar_terisi: kamarTerisi,
    kamar_tersedia: Number(stats.kamar_tersedia ?? 0),
    kamar_pemeliharaan: Number(stats.kamar_pemeliharaan ?? 0),
    okupansi_persen: okupansiPersen,
    reservasi_aktif: Number(resAktif.rows[0]?.aktif ?? 0),
    pendapatan_lunas: Number(payRes.rows[0]?.total ?? 0),
  };
}

export async function getAnalitikSubquery(): Promise<SubqueryAnalytics> {
  const avgRes = await pool.query<{ rata_rata: string }>(
    'SELECT ROUND(AVG(tarif_per_malam), 2)::text AS rata_rata FROM public.kamar'
  );
  const premRes = await pool.query<SubqueryAnalytics['kamar_premium'][number]>(
    `SELECT k.id_kamar, k.kode_kamar, k.nomor_kamar, k.nama_kamar, k.tarif_per_malam,
            k.status_ketersediaan, kk.nama_kategori
     FROM public.kamar k
     INNER JOIN public.kategori_kamar kk ON k.id_kategori = kk.id_kategori
     WHERE k.tarif_per_malam > (SELECT AVG(tarif_per_malam) FROM public.kamar)
     ORDER BY k.tarif_per_malam DESC`
  );
  return {
    rata_rata_tarif: Number(avgRes.rows[0]?.rata_rata ?? 0),
    kamar_premium: premRes.rows,
  };
}

export async function getAuditLogs(limit = 20): Promise<AuditLogRow[]> {
  const res = await pool.query<Record<string, unknown>>(
    'SELECT * FROM public.log_audit_reservasi ORDER BY waktu_perubahan DESC, id_log DESC LIMIT $1',
    [limit]
  );
  return res.rows.map((row) => ({
    id_log: Number(row.id_log),
    id_reservasi: Number(row.id_reservasi),
    kode_booking: row.kode_booking != null ? String(row.kode_booking) : null,
    status_lama: row.status_lama != null ? String(row.status_lama) : null,
    status_baru: String(row.status_baru ?? ''),
    keterangan: row.keterangan != null ? String(row.keterangan) : null,
    waktu_perubahan:
      row.waktu_perubahan instanceof Date
        ? row.waktu_perubahan.toISOString().replace('T', ' ').slice(0, 19)
        : String(row.waktu_perubahan ?? ''),
  }));
}

async function hasTrigger(client: PoolClient, triggerName: string): Promise<boolean> {
  const trigRes = await client.query<{ has_trg: boolean }>(
    'SELECT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = $1) AS has_trg',
    [triggerName]
  );
  return Boolean(trigRes.rows[0]?.has_trg);
}

async function recordAuditIfNoTrigger(
  client: PoolClient,
  idReservasi: number,
  kodeBooking: string,
  statusLama: string,
  statusBaru: string,
  note: string,
  triggerName = 'trg_log_perubahan_reservasi'
): Promise<void> {
  if (!(await hasTrigger(client, triggerName))) {
    await client.query(
      `INSERT INTO public.log_audit_reservasi (id_reservasi, kode_booking, status_lama, status_baru, keterangan)
       VALUES ($1, $2, $3, $4, $5)`,
      [idReservasi, kodeBooking, statusLama, statusBaru, note]
    );
  }
}

export async function buatReservasiBaru(input: Record<string, unknown>): Promise<ReservationReportRow | Record<string, unknown>> {
  const idKamar = Number(input.id_kamar ?? 0);
  const tglCheckin = String(input.tgl_checkin ?? '').trim();
  const tglCheckout = String(input.tgl_checkout ?? '').trim();
  const namaTamu = String(input.nama_tamu ?? '').trim();
  const emailTamu = String(input.email_tamu ?? '').trim();
  const noTelepon = String(input.no_telepon ?? '').trim();
  const kotaAsal = String(input.kota_asal ?? 'Bandar Lampung').trim() || 'Bandar Lampung';
  const jumlahTamu = Math.max(1, Number(input.jumlah_tamu ?? 2) || 2);
  const kodePromo = String(input.kode_promo ?? '').trim().toUpperCase();
  const catatan = String(input.catatan_khusus ?? '').trim();
  const metodeBayar =
    String(input.metode_pembayaran ?? 'Transfer Virtual Account (BCA/Mandiri)').trim() ||
    'Transfer Virtual Account (BCA/Mandiri)';

  if (idKamar <= 0 || !tglCheckin || !tglCheckout || !namaTamu || !emailTamu || !noTelepon) {
    throw new InvalidInputError('Semua kolom wajib reservasi harus dilengkapi.');
  }

  if (!isValidStayRange(tglCheckin, tglCheckout)) {
    throw new InvalidInputError('Tanggal Check-Out harus setelah tanggal Check-In.');
  }
  const d1 = new Date(`${tglCheckin}T00:00:00Z`);
  const d2 = new Date(`${tglCheckout}T00:00:00Z`);
  const jumlahMalam = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));

  const kamar = await findRoomById(idKamar);
  if (!kamar) {
    throw new Error('Kamar yang dipilih tidak ditemukan.');
  }

  const tersedia = await cekKetersediaanKamar(idKamar, tglCheckin, tglCheckout);
  if (!tersedia) {
    throw new KamarPenuhException(
      `Kamar ${kamar.nomor_kamar} (${kamar.nama_kamar}) sedang terisi atau dalam pemeliharaan pada tanggal tersebut.`
    );
  }

  let persenDiskon = 0;
  let maksDiskon = 0;
  if (kodePromo !== '') {
    const promo = await validatePromoCode(kodePromo);
    persenDiskon = Number(promo.persen_diskon);
    maksDiskon = Number(promo.maks_diskon);
  }

  const kodeBooking = generateBookingCode();
  const isSuite = kamar.kode_kategori === 'KAT-PRES' || kamar.kode_kategori === 'KAT-VILA';
  const pricing = calculateReservationPricing({
    pricePerNight: Number(kamar.tarif_per_malam),
    nights: jumlahMalam,
    discountPercent: persenDiskon,
    maxDiscount: maksDiskon,
    isSuiteCategory: isSuite,
  });

  try {
    await pool.query(
      'CALL public.sp_buat_reservasi_baru($1, $2, $3, $4, $5, $6, $7::date, $8::date, $9, $10, $11, $12)',
      [
        kodeBooking,
        namaTamu,
        emailTamu,
        noTelepon,
        kotaAsal,
        idKamar,
        tglCheckin,
        tglCheckout,
        jumlahTamu,
        kodePromo !== '' ? kodePromo : null,
        catatan !== '' ? catatan : null,
        metodeBayar,
      ]
    );
  } catch (err) {
    if (getPgCode(err) !== '42883') {
      throw err;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let idVoucher: number | null = null;
      if (kodePromo !== '') {
        const vRes = await client.query<{ id_voucher: number }>(
          'SELECT id_voucher FROM public.voucher_promo WHERE UPPER(kode_promo) = UPPER($1) LIMIT 1',
          [kodePromo]
        );
        idVoucher = vRes.rows[0]?.id_voucher ?? null;
      }

      const tRes = await client.query<{ id_tamu: number }>(
        `INSERT INTO public.tamu (nama_lengkap, email, no_telepon, kota_asal)
         VALUES ($1, LOWER(TRIM($2)), $3, $4)
         ON CONFLICT (email) DO UPDATE SET
           nama_lengkap = EXCLUDED.nama_lengkap,
           no_telepon = EXCLUDED.no_telepon,
           kota_asal = EXCLUDED.kota_asal
         RETURNING id_tamu`,
        [namaTamu, emailTamu, noTelepon, kotaAsal]
      );
      const idTamu = Number(tRes.rows[0].id_tamu);

      const rRes = await client.query<{ id_reservasi: number }>(
        `INSERT INTO public.reservasi (
           kode_booking, id_tamu, id_kamar, id_voucher,
           tgl_checkin, tgl_checkout, jumlah_malam, jumlah_tamu,
           catatan_khusus, subtotal, potongan_diskon, biaya_layanan,
           pajak_ppn, total_tagihan, status_reservasi
         ) VALUES (
           $1, $2, $3, $4,
           $5::date, $6::date, $7, $8,
           $9, $10, $11, $12,
           $13, $14, 'Dikonfirmasi'
         ) RETURNING id_reservasi`,
        [
          kodeBooking,
          idTamu,
          idKamar,
          idVoucher,
          tglCheckin,
          tglCheckout,
          jumlahMalam,
          jumlahTamu,
          catatan !== '' ? catatan : null,
          pricing.subtotal,
          pricing.potongan_diskon,
          pricing.biaya_layanan,
          pricing.pajak_ppn,
          pricing.total_tagihan,
        ]
      );
      const idReservasi = Number(rRes.rows[0].id_reservasi);

      await client.query(
        `INSERT INTO public.pembayaran (id_reservasi, metode_pembayaran, jumlah_bayar, status_pembayaran, nomor_referensi)
         VALUES ($1, $2, $3, 'Lunas', $4)`,
        [idReservasi, metodeBayar, pricing.total_tagihan, `PAY-${kodeBooking}`]
      );

      await recordAuditIfNoTrigger(
        client,
        idReservasi,
        kodeBooking,
        'Baru',
        'Dikonfirmasi',
        'Reservasi baru dibuat dengan status awal: Dikonfirmasi',
        'trg_update_ketersediaan_kamar'
      );

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  }

  const detail = await findByKodeBooking(kodeBooking);
  if (detail) {
    detail.tipe_tagihan_oop = pricing.tipe_tagihan;
    return detail;
  }

  return {
    kode_booking: kodeBooking,
    ...pricing,
    nama_kamar: kamar.nama_kamar,
    nomor_kamar: kamar.nomor_kamar,
    tgl_checkin: tglCheckin,
    tgl_checkout: tglCheckout,
    jumlah_malam: jumlahMalam,
    nama_tamu: namaTamu,
    email_tamu: emailTamu,
    telepon_tamu: noTelepon,
    metode_pembayaran: metodeBayar,
    status_pembayaran: 'Lunas',
  };
}

export async function prosesCheckIn(idReservasi: number): Promise<void> {
  const client = await pool.connect();
  try {
    const res = await client.query<{
      id_reservasi: number;
      kode_booking: string;
      id_kamar: number;
      status_reservasi: string;
      nomor_kamar: string;
      status_ketersediaan: string;
    }>(
      `SELECT r.id_reservasi, r.kode_booking, r.id_kamar, r.status_reservasi, k.nomor_kamar, k.status_ketersediaan
       FROM public.reservasi r
       INNER JOIN public.kamar k ON r.id_kamar = k.id_kamar
       WHERE r.id_reservasi = $1
       LIMIT 1`,
      [idReservasi]
    );
    const row = res.rows[0];
    if (!row) {
      throw new Error('Data reservasi tidak ditemukan.');
    }
    if (row.status_reservasi !== 'Dikonfirmasi') {
      throw new InvalidInputError(
        `Check-In tidak dapat diproses karena status reservasi saat ini adalah '${row.status_reservasi}'.`
      );
    }
    if (row.status_ketersediaan === 'Pemeliharaan') {
      throw new KamarKotorException(
        `Check-In ditolak! Kamar ${row.nomor_kamar} masih berstatus Pemeliharaan (kotor/housekeeping belum selesai).`
      );
    }

    await client.query('BEGIN');
    await client.query(
      "UPDATE public.reservasi SET status_reservasi = 'Check-In', updated_at = NOW() WHERE id_reservasi = $1",
      [idReservasi]
    );
    if (!(await hasTrigger(client, 'trg_log_perubahan_reservasi'))) {
      await client.query(
        "UPDATE public.kamar SET status_ketersediaan = 'Terisi' WHERE id_kamar = $1",
        [row.id_kamar]
      );
      await recordAuditIfNoTrigger(
        client,
        idReservasi,
        row.kode_booking,
        row.status_reservasi,
        'Check-In',
        `Tamu melakukan Check-In ke Kamar ${row.nomor_kamar}.`
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

export async function prosesCheckOut(idReservasi: number): Promise<void> {
  try {
    await pool.query('CALL public.sp_proses_check_out($1)', [idReservasi]);
  } catch (err) {
    if (getPgCode(err) !== '42883') {
      throw err;
    }
    const client = await pool.connect();
    try {
      const q = await client.query<{
        id_kamar: number;
        kode_booking: string;
        status_reservasi: string;
      }>(
        'SELECT id_kamar, kode_booking, status_reservasi FROM public.reservasi WHERE id_reservasi = $1 LIMIT 1',
        [idReservasi]
      );
      const row = q.rows[0];
      if (!row) {
        throw new Error('Data reservasi tidak ditemukan.');
      }
      if (row.status_reservasi === 'Selesai' || row.status_reservasi === 'Batal') {
        throw new InvalidInputError(`Reservasi sudah berstatus '${row.status_reservasi}'.`);
      }

      await client.query('BEGIN');
      await client.query(
        "UPDATE public.reservasi SET status_reservasi = 'Selesai', updated_at = NOW() WHERE id_reservasi = $1",
        [idReservasi]
      );
      if (!(await hasTrigger(client, 'trg_log_perubahan_reservasi'))) {
        await client.query(
          "UPDATE public.kamar SET status_ketersediaan = 'Pemeliharaan' WHERE id_kamar = $1",
          [row.id_kamar]
        );
        await recordAuditIfNoTrigger(
          client,
          idReservasi,
          row.kode_booking,
          row.status_reservasi,
          'Selesai',
          'Check-Out diproses; kamar masuk status Pemeliharaan untuk pembersihan.'
        );
      }
      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw txErr;
    } finally {
      client.release();
    }
  }
}

export async function batalkanReservasi(idReservasi: number): Promise<void> {
  const client = await pool.connect();
  try {
    const q = await client.query<{
      id_kamar: number;
      kode_booking: string;
      status_reservasi: string;
    }>(
      'SELECT id_kamar, kode_booking, status_reservasi FROM public.reservasi WHERE id_reservasi = $1 LIMIT 1',
      [idReservasi]
    );
    const row = q.rows[0];
    if (!row) {
      throw new Error('Data reservasi tidak ditemukan.');
    }
    if (row.status_reservasi === 'Selesai' || row.status_reservasi === 'Batal') {
      throw new InvalidInputError(`Reservasi dengan status '${row.status_reservasi}' tidak dapat dibatalkan.`);
    }

    await client.query('BEGIN');
    await client.query(
      "UPDATE public.reservasi SET status_reservasi = 'Batal', updated_at = NOW() WHERE id_reservasi = $1",
      [idReservasi]
    );
    if (!(await hasTrigger(client, 'trg_log_perubahan_reservasi'))) {
      const nextRoomStatus = resolveNextRoomStatus(row.status_reservasi, 'Batal', 'Tersedia');
      if (row.status_reservasi === 'Check-In' && nextRoomStatus === 'Tersedia') {
        await client.query(
          "UPDATE public.kamar SET status_ketersediaan = $1 WHERE id_kamar = $2",
          [nextRoomStatus, row.id_kamar]
        );
      }
      await recordAuditIfNoTrigger(
        client,
        idReservasi,
        row.kode_booking,
        row.status_reservasi,
        'Batal',
        'Reservasi dibatalkan oleh Admin Front Office.'
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

export async function createRoom(data: Record<string, unknown>): Promise<number> {
  const statusRaw = String(data.status_ketersediaan ?? 'Tersedia');
  const status = ['Tersedia', 'Terisi', 'Pemeliharaan'].includes(statusRaw) ? statusRaw : 'Tersedia';
  const fasilitas = JSON.stringify(['Wi-Fi Cepat', 'Sarapan Prasmanan', 'Balkon Panorama']);

  const res = await pool.query<{ id_kamar: number }>(
    `INSERT INTO public.kamar (
       kode_kamar, id_kategori, nomor_kamar, nama_kamar, tagline, deskripsi,
       tarif_per_malam, kapasitas_tamu, luas_m2, tipe_kasur, pemandangan,
       fasilitas, url_gambar, is_featured, status_ketersediaan
     ) VALUES (
       $1, $2, $3, $4, $5, $6,
       $7, $8, $9, $10, $11,
       $12, $13, $14, $15
     ) RETURNING id_kamar`,
    [
      String(data.kode_kamar ?? '').trim().toUpperCase(),
      Number(data.id_kategori ?? 1),
      String(data.nomor_kamar ?? '').trim(),
      String(data.nama_kamar ?? '').trim(),
      String(data.tagline ?? 'Kamar panorama eksklusif di puncak Bukit Randu').trim(),
      String(
        data.deskripsi ??
          'Nikmati kenyamanan suite modern dengan pemandangan Bukit Randu dan Teluk Lampung.'
      ).trim(),
      Number(data.tarif_per_malam ?? 1850000),
      Number(data.kapasitas_tamu ?? 2),
      Number(data.luas_m2 ?? 65),
      String(data.tipe_kasur ?? 'King Bed').trim(),
      String(data.pemandangan ?? 'Bukit & Teluk Lampung').trim(),
      fasilitas,
      String(data.url_gambar ?? '/assets/images/suite_presidential_1794410440213.jpg').trim(),
      Boolean(data.is_featured),
      status,
    ]
  );
  return Number(res.rows[0].id_kamar);
}

export async function updateRoomStatus(idKamar: number, status: string): Promise<void> {
  if (!['Tersedia', 'Terisi', 'Pemeliharaan'].includes(status)) {
    throw new InvalidInputError('Status kamar tidak valid.');
  }
  await pool.query('UPDATE public.kamar SET status_ketersediaan = $1 WHERE id_kamar = $2', [
    status,
    idKamar,
  ]);
}

export async function deleteRoom(idKamar: number): Promise<void> {
  await pool.query('DELETE FROM public.kamar WHERE id_kamar = $1', [idKamar]);
}
