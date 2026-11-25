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
  is_bookable?: boolean;
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
