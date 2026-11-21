import crypto from 'node:crypto';

export interface PricingInput {
  pricePerNight: number;
  nights: number;
  discountPercent?: number;
  maxDiscount?: number;
  isSuiteCategory?: boolean;
}

export interface PricingBreakdown {
  subtotal: number;
  potongan_diskon: number;
  biaya_layanan: number;
  pajak_ppn: number;
  total_tagihan: number;
  tipe_tagihan: string;
}

export function calculateReservationPricing(input: PricingInput): PricingBreakdown {
  const nights = Math.max(1, Math.floor(input.nights));
  const rate = Math.max(0, Number(input.pricePerNight) || 0);
  const subtotal = Math.round(rate * nights);

  const discountPct = Math.max(0, Number(input.discountPercent) || 0);
  const maxDiscount = Math.max(0, Number(input.maxDiscount) || 0);
  let diskon = discountPct > 0 ? Math.round(subtotal * (discountPct / 100)) : 0;
  if (maxDiscount > 0 && diskon > maxDiscount) {
    diskon = Math.round(maxDiscount);
  }

  const dasar = Math.max(0, subtotal - diskon);
  const layanan = Math.round(dasar * 0.05);
  const ppn = Math.round(dasar * 0.10);
  const total = dasar + layanan + ppn;

  return {
    subtotal,
    potongan_diskon: diskon,
    biaya_layanan: layanan,
    pajak_ppn: ppn,
    total_tagihan: total,
    tipe_tagihan: input.isSuiteCategory ? 'TagihanSuite (Privilege)' : 'TagihanKamar (Standar)',
  };
}

export function isValidStayRange(tglCheckin: string, tglCheckout: string): boolean {
  if (!tglCheckin || !tglCheckout) return false;
  const d1 = new Date(`${tglCheckin}T00:00:00Z`);
  const d2 = new Date(`${tglCheckout}T00:00:00Z`);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return false;
  return d2 > d1;
}

export function resolveNextRoomStatus(
  oldResStatus: string | null,
  newResStatus: string,
  currentRoomStatus: string
): string {
  if (newResStatus === 'Check-In') {
    return 'Terisi';
  }
  if (newResStatus === 'Selesai') {
    return 'Pemeliharaan';
  }
  if (newResStatus === 'Batal' && oldResStatus === 'Check-In') {
    return 'Tersedia';
  }
  return currentRoomStatus;
}

export function generateBookingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars[crypto.randomInt(0, chars.length)];
  }
  return `BRH-${suffix}`;
}
