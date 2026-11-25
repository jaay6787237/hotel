import { getSupabaseAdmin } from '../lib/supabase-admin.ts';
import {
  calculateReservationPricing,
  generateBookingCode,
  isRoomBookableStatus,
  isValidStayRange,
  resolveNextRoomStatus,
} from './pricing.ts';
import {
  type AuditLogRow,
  type CategoryRow,
  InvalidInputError,
  KamarKotorException,
  KamarPenuhException,
  type KpiMetrics,
  type PromoRow,
  type ReservationReportRow,
  type RoomRow,
  type SubqueryAnalytics,
  VoucherTidakValidException,
} from './hotelTypes.ts';
import { SUPABASE_NOT_CONFIGURED_MSG } from './db.ts';

function requireClient() {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error(SUPABASE_NOT_CONFIGURED_MSG);
  }
  return client;
}

function parseFacilities(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
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
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  const str = String(val ?? '');
  return /^\d{4}-\d{2}-\d{2}/.test(str) ? str.slice(0, 10) : str;
}

function normalizeRestError(err: { code?: string; message: string }): Error {
  const code = String(err.code ?? '');
  if (code === '42P01' || code === 'PGRST205') {
    return new Error(
      "Koneksi ke Supabase berhasil, tetapi tabel belum dibuat. Jalankan seluruh isi supabase_schema.sql di Supabase SQL Editor."
    );
  }
  return new Error(`Supabase API Error (${code || 'unknown'}): ${err.message}`);
}

function mapRoomRow(row: Record<string, unknown>): RoomRow {
  const kat = (row.kategori_kamar ?? {}) as Record<string, unknown>;
  const status = String(row.status_ketersediaan ?? 'Tersedia');
  return {
    id_kamar: Number(row.id_kamar),
    kode_kamar: String(row.kode_kamar ?? ''),
    id_kategori: Number(row.id_kategori),
    nomor_kamar: String(row.nomor_kamar ?? ''),
    nama_kamar: String(row.nama_kamar ?? ''),
    tagline: row.tagline != null ? String(row.tagline) : null,
    deskripsi: row.deskripsi != null ? String(row.deskripsi) : null,
    tarif_per_malam: Number(row.tarif_per_malam ?? 0),
    kapasitas_tamu: Number(row.kapasitas_tamu ?? 2),
    luas_m2: Number(row.luas_m2 ?? 45),
    tipe_kasur: String(row.tipe_kasur ?? 'King Bed'),
    pemandangan: String(row.pemandangan ?? 'Bukit & Teluk Lampung'),
    fasilitas: String(row.fasilitas ?? '[]'),
    fasilitas_array: parseFacilities(row.fasilitas),
    url_gambar: String(row.url_gambar ?? '/assets/images/suite_presidential_1794410440213.jpg'),
    is_featured: Boolean(row.is_featured),
    status_ketersediaan: status,
    is_bookable: isRoomBookableStatus(status),
    kode_kategori: String(kat.kode_kategori ?? row.kode_kategori ?? ''),
    nama_kategori: String(kat.nama_kategori ?? row.nama_kategori ?? ''),
    tipe_pemandangan: kat.tipe_pemandangan != null ? String(kat.tipe_pemandangan) : undefined,
  };
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
    created_at:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? ''),
  };
}

export async function restGetRoomsWithCategory(): Promise<RoomRow[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('kamar')
    .select('*, kategori_kamar(kode_kategori, nama_kategori, tipe_pemandangan)')
    .order('nomor_kamar', { ascending: true });
  if (error) throw normalizeRestError(error);
  return (data ?? []).map((row) => mapRoomRow(row as Record<string, unknown>));
}

export async function restGetRoomsWithAvailability(
  tglCheckin?: string,
  tglCheckout?: string
): Promise<RoomRow[]> {
  const rooms = await restGetRoomsWithCategory();
  if (!tglCheckin || !tglCheckout || !isValidStayRange(tglCheckin, tglCheckout)) {
    return rooms;
  }

  const client = requireClient();
  const { data, error } = await client
    .from('reservasi')
    .select('id_kamar')
    .not('status_reservasi', 'in', '("Batal","Selesai")')
    .lt('tgl_checkin', tglCheckout)
    .gt('tgl_checkout', tglCheckin);

  if (error) throw normalizeRestError(error);
  const busyRoomIds = new Set((data ?? []).map((r) => Number((r as { id_kamar: unknown }).id_kamar)));

  return rooms.map((room) => ({
    ...room,
    is_bookable: isRoomBookableStatus(room.status_ketersediaan) && !busyRoomIds.has(room.id_kamar),
  }));
}

export async function restFindRoomById(idKamar: number): Promise<RoomRow | null> {
  const client = requireClient();
  const { data, error } = await client
    .from('kamar')
    .select('*, kategori_kamar(kode_kategori, nama_kategori, tipe_pemandangan)')
    .eq('id_kamar', idKamar)
    .maybeSingle();
  if (error) throw normalizeRestError(error);
  return data ? mapRoomRow(data as Record<string, unknown>) : null;
}

export async function restGetCategories(): Promise<CategoryRow[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('kategori_kamar')
    .select('*')
    .order('id_kategori', { ascending: true });
  if (error) throw normalizeRestError(error);
  return (data ?? []) as CategoryRow[];
}

export async function restGetActivePromos(): Promise<PromoRow[]> {
  const client = requireClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await client
    .from('voucher_promo')
    .select('*')
    .eq('is_active', true)
    .gte('berlaku_hingga', today)
    .order('persen_diskon', { ascending: false });
  if (error) throw normalizeRestError(error);
  return (data ?? []) as PromoRow[];
}

export async function restValidatePromoCode(kodePromo: string): Promise<PromoRow> {
  const clean = kodePromo.trim().toUpperCase();
  if (!clean) {
    throw new VoucherTidakValidException('Kode promo tidak boleh kosong.');
  }
  const client = requireClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await client
    .from('voucher_promo')
    .select('*')
    .ilike('kode_promo', clean)
    .eq('is_active', true)
    .gte('berlaku_hingga', today)
    .limit(1)
    .maybeSingle();
  if (error) throw normalizeRestError(error);
  if (!data) {
    throw new VoucherTidakValidException(
      `Kode promo '${clean}' tidak valid, nonaktif, atau sudah kedaluwarsa.`
    );
  }
  return data as PromoRow;
}

export async function restCekKetersediaanKamar(
  idKamar: number,
  tglCheckin: string,
  tglCheckout: string
): Promise<boolean> {
  if (!isValidStayRange(tglCheckin, tglCheckout)) return false;
  const client = requireClient();
  const { data: roomData, error: roomErr } = await client
    .from('kamar')
    .select('status_ketersediaan')
    .eq('id_kamar', idKamar)
    .maybeSingle();
  if (roomErr) throw normalizeRestError(roomErr);
  const status = String((roomData as { status_ketersediaan?: unknown } | null)?.status_ketersediaan ?? '');
  if (!status || !isRoomBookableStatus(status)) return false;

  const { count, error: resErr } = await client
    .from('reservasi')
    .select('id_reservasi', { count: 'exact', head: true })
    .eq('id_kamar', idKamar)
    .not('status_reservasi', 'in', '("Batal","Selesai")')
    .lt('tgl_checkin', tglCheckout)
    .gt('tgl_checkout', tglCheckin);
  if (resErr) throw normalizeRestError(resErr);
  return Number(count ?? 0) === 0;
}

function mapNestedReservation(row: Record<string, unknown>): ReservationReportRow {
  const tamu = (row.tamu ?? {}) as Record<string, unknown>;
  const kamar = (row.kamar ?? {}) as Record<string, unknown>;
  const kat = (kamar.kategori_kamar ?? {}) as Record<string, unknown>;
  const voucher = (row.voucher_promo ?? {}) as Record<string, unknown>;
  const payList = Array.isArray(row.pembayaran) ? (row.pembayaran as Array<Record<string, unknown>>) : [];
  const pay = payList[0] ?? ((row.pembayaran as Record<string, unknown> | null) ?? {});
  return normalizeReservationRow({
    id_reservasi: row.id_reservasi,
    kode_booking: row.kode_booking,
    nama_tamu: tamu.nama_lengkap ?? '',
    email_tamu: tamu.email ?? '',
    telepon_tamu: tamu.no_telepon ?? '',
    kota_asal: tamu.kota_asal ?? null,
    id_kamar: row.id_kamar,
    kode_kamar: kamar.kode_kamar ?? '',
    nomor_kamar: kamar.nomor_kamar ?? '',
    nama_kamar: kamar.nama_kamar ?? '',
    status_kamar: kamar.status_ketersediaan ?? '',
    kode_kategori: kat.kode_kategori ?? '',
    nama_kategori: kat.nama_kategori ?? '',
    kode_promo: voucher.kode_promo ?? '-',
    nama_promo: voucher.nama_promo ?? 'Tanpa Promo',
    persen_diskon: voucher.persen_diskon ?? 0,
    tgl_checkin: row.tgl_checkin,
    tgl_checkout: row.tgl_checkout,
    jumlah_malam: row.jumlah_malam,
    jumlah_tamu: row.jumlah_tamu,
    catatan_khusus: row.catatan_khusus ?? null,
    subtotal: row.subtotal,
    potongan_diskon: row.potongan_diskon,
    biaya_layanan: row.biaya_layanan,
    pajak_ppn: row.pajak_ppn,
    total_tagihan: row.total_tagihan,
    status_reservasi: row.status_reservasi,
    metode_pembayaran: pay.metode_pembayaran ?? 'Bayar di Resepsionis',
    status_pembayaran: pay.status_pembayaran ?? 'Belum Lunas',
    nomor_referensi: pay.nomor_referensi ?? '-',
    created_at: row.created_at,
  });
}

export async function restFindByKodeBooking(kodeBooking: string): Promise<ReservationReportRow | null> {
  const clean = kodeBooking.trim();
  if (!clean) return null;
  const client = requireClient();

  const { data, error } = await client
    .from('vw_laporan_reservasi_lengkap')
    .select('*')
    .ilike('kode_booking', clean)
    .limit(1)
    .maybeSingle();

  if (!error) {
    return data ? normalizeReservationRow(data as Record<string, unknown>) : null;
  }

  if (String((error as { code?: unknown }).code ?? '') !== 'PGRST205' && String((error as { code?: unknown }).code ?? '') !== '42P01') {
    throw normalizeRestError(error);
  }

  const { data: joined, error: joinErr } = await client
    .from('reservasi')
    .select(
      '*, tamu(*), kamar(*, kategori_kamar(*)), voucher_promo(*), pembayaran(*)'
    )
    .ilike('kode_booking', clean)
    .limit(1)
    .maybeSingle();
  if (joinErr) throw normalizeRestError(joinErr);
  return joined ? mapNestedReservation(joined as Record<string, unknown>) : null;
}

export async function restGetLaporanMultiJoin(): Promise<ReservationReportRow[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_laporan_reservasi_lengkap')
    .select('*')
    .order('created_at', { ascending: false });

  if (!error) {
    return (data ?? []).map((row) => normalizeReservationRow(row as Record<string, unknown>));
  }

  if (String((error as { code?: unknown }).code ?? '') !== 'PGRST205' && String((error as { code?: unknown }).code ?? '') !== '42P01') {
    throw normalizeRestError(error);
  }

  const { data: joined, error: joinErr } = await client
    .from('reservasi')
    .select('*, tamu(*), kamar(*, kategori_kamar(*)), voucher_promo(*), pembayaran(*)')
    .order('created_at', { ascending: false });
  if (joinErr) throw normalizeRestError(joinErr);
  return (joined ?? []).map((row) => mapNestedReservation(row as Record<string, unknown>));
}

export async function restGetKpiMetrics(): Promise<KpiMetrics> {
  const client = requireClient();
  const [roomsRes, resRes, payRes] = await Promise.all([
    client.from('kamar').select('status_ketersediaan'),
    client.from('reservasi').select('status_reservasi').in('status_reservasi', ['Dikonfirmasi', 'Check-In']),
    client.from('pembayaran').select('jumlah_bayar').eq('status_pembayaran', 'Lunas'),
  ]);
  if (roomsRes.error) throw normalizeRestError(roomsRes.error);
  if (resRes.error) throw normalizeRestError(resRes.error);
  if (payRes.error) throw normalizeRestError(payRes.error);

  const roomRows = roomsRes.data ?? [];
  const totalKamar = roomRows.length;
  const kamarTerisi = roomRows.filter((r) => r.status_ketersediaan === 'Terisi').length;
  const kamarTersedia = roomRows.filter((r) => r.status_ketersediaan === 'Tersedia').length;
  const kamarPemeliharaan = roomRows.filter((r) => r.status_ketersediaan === 'Pemeliharaan').length;
  const okupansiPersen = totalKamar > 0 ? Math.round((kamarTerisi / totalKamar) * 1000) / 10 : 0;
  const pendapatanLunas = (payRes.data ?? []).reduce((acc, r) => acc + Number(r.jumlah_bayar ?? 0), 0);

  return {
    total_kamar: totalKamar,
    kamar_terisi: kamarTerisi,
    kamar_tersedia: kamarTersedia,
    kamar_pemeliharaan: kamarPemeliharaan,
    okupansi_persen: okupansiPersen,
    reservasi_aktif: (resRes.data ?? []).length,
    pendapatan_lunas: pendapatanLunas,
  };
}

export async function restGetAnalitikSubquery(): Promise<SubqueryAnalytics> {
  const rooms = await restGetRoomsWithCategory();
  if (rooms.length === 0) {
    return { rata_rata_tarif: 0, kamar_premium: [] };
  }
  const sum = rooms.reduce((acc, r) => acc + Number(r.tarif_per_malam), 0);
  const avg = Math.round((sum / rooms.length) * 100) / 100;
  const kamarPremium = rooms
    .filter((r) => Number(r.tarif_per_malam) > avg)
    .sort((a, b) => Number(b.tarif_per_malam) - Number(a.tarif_per_malam))
    .map((r) => ({
      id_kamar: r.id_kamar,
      kode_kamar: r.kode_kamar,
      nomor_kamar: r.nomor_kamar,
      nama_kamar: r.nama_kamar,
      tarif_per_malam: r.tarif_per_malam,
      status_ketersediaan: r.status_ketersediaan,
      nama_kategori: r.nama_kategori,
    }));
  return { rata_rata_tarif: avg, kamar_premium: kamarPremium };
}

export async function restGetAuditLogs(limit = 20): Promise<AuditLogRow[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('log_audit_reservasi')
    .select('*')
    .order('waktu_perubahan', { ascending: false })
    .order('id_log', { ascending: false })
    .limit(limit);
  if (error) throw normalizeRestError(error);
  return (data ?? []).map((row) => ({
    id_log: Number(row.id_log),
    id_reservasi: Number(row.id_reservasi),
    kode_booking: row.kode_booking != null ? String(row.kode_booking) : null,
    status_lama: row.status_lama != null ? String(row.status_lama) : null,
    status_baru: String(row.status_baru ?? ''),
    keterangan: row.keterangan != null ? String(row.keterangan) : null,
    waktu_perubahan: String(row.waktu_perubahan ?? '').replace('T', ' ').slice(0, 19),
  }));
}

async function ensureAuditLogExists(
  idReservasi: number,
  kodeBooking: string,
  statusLama: string,
  statusBaru: string,
  keterangan: string
): Promise<void> {
  const client = requireClient();
  const { count } = await client
    .from('log_audit_reservasi')
    .select('id_log', { count: 'exact', head: true })
    .eq('id_reservasi', idReservasi)
    .eq('status_baru', statusBaru);
  if (Number(count ?? 0) === 0) {
    await client.from('log_audit_reservasi').insert({
      id_reservasi: idReservasi,
      kode_booking: kodeBooking,
      status_lama: statusLama,
      status_baru: statusBaru,
      keterangan,
    });
  }
}

export async function restBuatReservasiBaru(
  input: Record<string, unknown>
): Promise<ReservationReportRow | Record<string, unknown>> {
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

  const kamar = await restFindRoomById(idKamar);
  if (!kamar) {
    throw new Error('Kamar yang dipilih tidak ditemukan.');
  }
  if (!isRoomBookableStatus(kamar.status_ketersediaan)) {
    throw new KamarPenuhException(
      kamar.status_ketersediaan === 'Terisi'
        ? `Kamar ${kamar.nomor_kamar} (${kamar.nama_kamar}) saat ini berstatus Terisi sehingga tidak dapat dipesan.`
        : `Kamar ${kamar.nomor_kamar} (${kamar.nama_kamar}) sedang dalam Pemeliharaan sehingga tidak dapat dipesan.`
    );
  }
  const tersedia = await restCekKetersediaanKamar(idKamar, tglCheckin, tglCheckout);
  if (!tersedia) {
    throw new KamarPenuhException(
      `Kamar ${kamar.nomor_kamar} (${kamar.nama_kamar}) sudah dipesan pada rentang tanggal ${tglCheckin} s/d ${tglCheckout}.`
    );
  }

  let idVoucher: number | null = null;
  let persenDiskon = 0;
  let maksDiskon = 0;
  if (kodePromo !== '') {
    const promo = await restValidatePromoCode(kodePromo);
    idVoucher = Number(promo.id_voucher);
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

  const client = requireClient();
  const { data: tamuData, error: tamuErr } = await client
    .from('tamu')
    .upsert(
      {
        nama_lengkap: namaTamu,
        email: emailTamu.toLowerCase(),
        no_telepon: noTelepon,
        kota_asal: kotaAsal,
      },
      { onConflict: 'email' }
    )
    .select('id_tamu')
    .single();
  if (tamuErr) throw normalizeRestError(tamuErr);
  const idTamu = Number((tamuData as { id_tamu: unknown }).id_tamu);

  const { data: resData, error: resErr } = await client
    .from('reservasi')
    .insert({
      kode_booking: kodeBooking,
      id_tamu: idTamu,
      id_kamar: idKamar,
      id_voucher: idVoucher,
      tgl_checkin: tglCheckin,
      tgl_checkout: tglCheckout,
      jumlah_malam: jumlahMalam,
      jumlah_tamu: jumlahTamu,
      catatan_khusus: catatan !== '' ? catatan : null,
      subtotal: pricing.subtotal,
      potongan_diskon: pricing.potongan_diskon,
      biaya_layanan: pricing.biaya_layanan,
      pajak_ppn: pricing.pajak_ppn,
      total_tagihan: pricing.total_tagihan,
      status_reservasi: 'Dikonfirmasi',
    })
    .select('id_reservasi')
    .single();
  if (resErr) throw normalizeRestError(resErr);
  const idReservasi = Number((resData as { id_reservasi: unknown }).id_reservasi);

  const { error: payErr } = await client.from('pembayaran').insert({
    id_reservasi: idReservasi,
    metode_pembayaran: metodeBayar,
    jumlah_bayar: pricing.total_tagihan,
    status_pembayaran: 'Lunas',
    nomor_referensi: `PAY-${kodeBooking}`,
  });
  if (payErr) throw normalizeRestError(payErr);

  await ensureAuditLogExists(
    idReservasi,
    kodeBooking,
    'Baru',
    'Dikonfirmasi',
    'Reservasi baru dibuat dengan status awal: Dikonfirmasi'
  );

  const detail = await restFindByKodeBooking(kodeBooking);
  if (detail) {
    detail.tipe_tagihan_oop = pricing.tipe_tagihan;
    return detail;
  }

  return {
    kode_booking: kodeBooking,
    ...pricing,
    nama_kamar: kamar.nama_kamar,
    nomor_kamar: kamar.nomor_kamar,
    kode_kamar: kamar.kode_kamar,
    nama_kategori: kamar.nama_kategori,
    kode_promo: kodePromo || '-',
    persen_diskon: persenDiskon,
    tgl_checkin: tglCheckin,
    tgl_checkout: tglCheckout,
    jumlah_malam: jumlahMalam,
    jumlah_tamu: jumlahTamu,
    nama_tamu: namaTamu,
    email_tamu: emailTamu,
    telepon_tamu: noTelepon,
    kota_asal: kotaAsal,
    catatan_khusus: catatan || null,
    metode_pembayaran: metodeBayar,
    status_pembayaran: 'Lunas',
    status_reservasi: 'Dikonfirmasi',
    nomor_referensi: `PAY-${kodeBooking}`,
    created_at: new Date().toISOString(),
  };
}

export async function restProsesCheckIn(idReservasi: number): Promise<void> {
  const client = requireClient();
  const { data, error } = await client
    .from('reservasi')
    .select('id_reservasi, kode_booking, id_kamar, status_reservasi, kamar(nomor_kamar, status_ketersediaan)')
    .eq('id_reservasi', idReservasi)
    .maybeSingle();
  if (error) throw normalizeRestError(error);
  if (!data) throw new Error('Data reservasi tidak ditemukan.');

  const kamarRaw = Array.isArray(data.kamar) ? data.kamar[0] : data.kamar;
  const kamar = (kamarRaw ?? {}) as Record<string, unknown>;
  const statusReservasi = String(data.status_reservasi ?? '');
  const statusKamar = String(kamar.status_ketersediaan ?? '');
  const nomorKamar = String(kamar.nomor_kamar ?? '');

  if (statusReservasi !== 'Dikonfirmasi') {
    throw new InvalidInputError(
      `Check-In tidak dapat diproses karena status reservasi saat ini adalah '${statusReservasi}'.`
    );
  }
  if (statusKamar === 'Pemeliharaan') {
    throw new KamarKotorException(
      `Check-In ditolak! Kamar ${nomorKamar} masih berstatus Pemeliharaan (kotor/housekeeping belum selesai).`
    );
  }

  const { error: updErr } = await client
    .from('reservasi')
    .update({ status_reservasi: 'Check-In', updated_at: new Date().toISOString() })
    .eq('id_reservasi', idReservasi);
  if (updErr) throw normalizeRestError(updErr);

  await client
    .from('kamar')
    .update({ status_ketersediaan: 'Terisi' })
    .eq('id_kamar', Number(data.id_kamar));

  await ensureAuditLogExists(
    idReservasi,
    String(data.kode_booking ?? ''),
    statusReservasi,
    'Check-In',
    `Tamu melakukan Check-In ke Kamar ${nomorKamar}.`
  );
}

export async function restProsesCheckOut(idReservasi: number): Promise<void> {
  const client = requireClient();
  const { data, error } = await client
    .from('reservasi')
    .select('id_kamar, kode_booking, status_reservasi')
    .eq('id_reservasi', idReservasi)
    .maybeSingle();
  if (error) throw normalizeRestError(error);
  if (!data) throw new Error('Data reservasi tidak ditemukan.');

  const statusReservasi = String(data.status_reservasi ?? '');
  if (statusReservasi === 'Selesai' || statusReservasi === 'Batal') {
    throw new InvalidInputError(`Reservasi sudah berstatus '${statusReservasi}'.`);
  }

  const { error: updErr } = await client
    .from('reservasi')
    .update({ status_reservasi: 'Selesai', updated_at: new Date().toISOString() })
    .eq('id_reservasi', idReservasi);
  if (updErr) throw normalizeRestError(updErr);

  await client
    .from('kamar')
    .update({ status_ketersediaan: 'Pemeliharaan' })
    .eq('id_kamar', Number(data.id_kamar));

  await ensureAuditLogExists(
    idReservasi,
    String(data.kode_booking ?? ''),
    statusReservasi,
    'Selesai',
    'Check-Out diproses; kamar masuk status Pemeliharaan untuk pembersihan.'
  );
}

export async function restBatalkanReservasi(idReservasi: number): Promise<void> {
  const client = requireClient();
  const { data, error } = await client
    .from('reservasi')
    .select('id_kamar, kode_booking, status_reservasi')
    .eq('id_reservasi', idReservasi)
    .maybeSingle();
  if (error) throw normalizeRestError(error);
  if (!data) throw new Error('Data reservasi tidak ditemukan.');

  const statusReservasi = String(data.status_reservasi ?? '');
  if (statusReservasi === 'Selesai' || statusReservasi === 'Batal') {
    throw new InvalidInputError(`Reservasi dengan status '${statusReservasi}' tidak dapat dibatalkan.`);
  }

  const { error: updErr } = await client
    .from('reservasi')
    .update({ status_reservasi: 'Batal', updated_at: new Date().toISOString() })
    .eq('id_reservasi', idReservasi);
  if (updErr) throw normalizeRestError(updErr);

  const nextRoomStatus = resolveNextRoomStatus(statusReservasi, 'Batal', 'Tersedia');
  if (statusReservasi === 'Check-In' && nextRoomStatus === 'Tersedia') {
    await client
      .from('kamar')
      .update({ status_ketersediaan: nextRoomStatus })
      .eq('id_kamar', Number(data.id_kamar));
  }

  await ensureAuditLogExists(
    idReservasi,
    String(data.kode_booking ?? ''),
    statusReservasi,
    'Batal',
    'Reservasi dibatalkan oleh Admin Front Office.'
  );
}

export async function restCreateRoom(data: Record<string, unknown>): Promise<number> {
  const kodeKamar = String(data.kode_kamar ?? '').trim().toUpperCase();
  const nomorKamar = String(data.nomor_kamar ?? '').trim();
  const namaKamar = String(data.nama_kamar ?? '').trim();
  const tarifPerMalam = Number(data.tarif_per_malam ?? 1850000);

  if (!kodeKamar || !nomorKamar || !namaKamar) {
    throw new InvalidInputError('Kode kamar, nomor kamar, dan nama kamar wajib diisi.');
  }
  if (!Number.isFinite(tarifPerMalam) || tarifPerMalam <= 0) {
    throw new InvalidInputError('Tarif per malam harus lebih besar dari 0.');
  }

  const statusRaw = String(data.status_ketersediaan ?? 'Tersedia');
  const status = ['Tersedia', 'Terisi', 'Pemeliharaan'].includes(statusRaw) ? statusRaw : 'Tersedia';
  const fasilitas = JSON.stringify(['Wi-Fi Cepat', 'Sarapan Prasmanan', 'Balkon Panorama']);

  const client = requireClient();
  const { data: inserted, error } = await client
    .from('kamar')
    .insert({
      kode_kamar: kodeKamar,
      id_kategori: Number(data.id_kategori ?? 1),
      nomor_kamar: nomorKamar,
      nama_kamar: namaKamar,
      tagline: String(data.tagline ?? 'Kamar panorama eksklusif di puncak Bukit Randu').trim(),
      deskripsi: String(
        data.deskripsi ??
          'Nikmati kenyamanan suite modern dengan pemandangan Bukit Randu dan Teluk Lampung.'
      ).trim(),
      tarif_per_malam: tarifPerMalam,
      kapasitas_tamu: Math.max(1, Number(data.kapasitas_tamu ?? 2) || 2),
      luas_m2: Math.max(10, Number(data.luas_m2 ?? 65) || 65),
      tipe_kasur: String(data.tipe_kasur ?? 'King Bed').trim(),
      pemandangan: String(data.pemandangan ?? 'Bukit & Teluk Lampung').trim(),
      fasilitas,
      url_gambar: String(data.url_gambar ?? '/assets/images/suite_presidential_1794410440213.jpg').trim(),
      is_featured: Boolean(data.is_featured),
      status_ketersediaan: status,
    })
    .select('id_kamar')
    .single();
  if (error) throw normalizeRestError(error);
  return Number((inserted as { id_kamar: unknown }).id_kamar);
}

export async function restUpdateRoomStatus(idKamar: number, status: string): Promise<void> {
  if (!Number.isInteger(idKamar) || idKamar <= 0) {
    throw new InvalidInputError('ID kamar tidak valid.');
  }
  if (!['Tersedia', 'Terisi', 'Pemeliharaan'].includes(status)) {
    throw new InvalidInputError('Status kamar tidak valid.');
  }
  const client = requireClient();
  const { data, error } = await client
    .from('kamar')
    .update({ status_ketersediaan: status })
    .eq('id_kamar', idKamar)
    .select('id_kamar');
  if (error) throw normalizeRestError(error);
  if (!data || data.length === 0) {
    throw new InvalidInputError(`Unit kamar #${idKamar} tidak ditemukan.`);
  }
}

export async function restDeleteRoom(idKamar: number): Promise<void> {
  if (!Number.isInteger(idKamar) || idKamar <= 0) {
    throw new InvalidInputError('ID kamar tidak valid.');
  }
  const client = requireClient();
  const { data, error } = await client
    .from('kamar')
    .delete()
    .eq('id_kamar', idKamar)
    .select('id_kamar');
  if (error) throw normalizeRestError(error);
  if (!data || data.length === 0) {
    throw new InvalidInputError(`Unit kamar #${idKamar} tidak ditemukan.`);
  }
}
