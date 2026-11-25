import type { RoomRow } from '../hotelService.ts';

export function escapeHtml(val: unknown): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatRupiah(amount: number | string): string {
  const num = Number(amount) || 0;
  const formatted = Math.round(num).toLocaleString('id-ID');
  return `IDR ${formatted}`;
}

export function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

export function mapRoomToClientDto(r: RoomRow) {
  const tarifIdr = Number(r.tarif_per_malam ?? 0);
  const status = String(r.status_ketersediaan ?? 'Tersedia');
  return {
    id_kamar: Number(r.id_kamar),
    kode_kamar: String(r.kode_kamar),
    nomor_kamar: String(r.nomor_kamar),
    name: String(r.nama_kamar),
    tagline: String(r.tagline ?? ''),
    description: String(r.deskripsi ?? ''),
    categoryCode: String(r.kode_kategori ?? 'KAT-DLX'),
    categoryName: String(r.nama_kategori ?? 'Suite Panorama'),
    basePriceIdr: tarifIdr,
    basePriceUsd: Math.round(tarifIdr / 15500),
    maxGuests: Number(r.kapasitas_tamu ?? 2),
    bedType: String(r.tipe_kasur ?? 'King Bed'),
    view: String(r.pemandangan ?? 'Bukit & Teluk'),
    sqm: Number(r.luas_m2 ?? 65),
    image: String(r.url_gambar || '/assets/images/suite_presidential_1794410440213.jpg'),
    amenities: Array.isArray(r.fasilitas_array) ? r.fasilitas_array : [],
    featured: Boolean(r.is_featured),
    status_ketersediaan: status,
    is_bookable: r.is_bookable !== undefined ? Boolean(r.is_bookable) : status === 'Tersedia',
  };
}
