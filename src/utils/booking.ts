export interface Room {
  id: string;
  name: string;
  tagline: string;
  category: 'suite' | 'villa' | 'executive' | 'family';
  basePriceIdr: number;
  basePriceUsd: number;
  maxGuests: number;
  bedType: string;
  view: string;
  sqm: number;
  image: string;
  description: string;
  amenities: string[];
  featured?: boolean;
}

export interface BookingDates {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
}

export interface GuestDetails {
  fullName: string;
  email: string;
  phone: string;
  specialRequests?: string;
}

export interface RateBreakdown {
  nights: number;
  roomBaseRate: number;
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  taxAmount: number;
  serviceChargeAmount: number;
  totalAmount: number;
  appliedPromo?: string;
}

export const PROMO_CODES: Record<string, number> = {
  HILLTOP15: 15,
  BUKITVIP: 20,
  WEEKEND10: 10,
};

export const TAX_RATE = 0.10; // 10% Government VAT
export const SERVICE_CHARGE_RATE = 0.05; // 5% Luxury Resort Service Charge

/**
 * Calculates the number of nights between two date strings (YYYY-MM-DD).
 * Returns minimum 1 night if dates are identical or invalid.
 */
export function calculateNights(checkInStr: string, checkOutStr: string): number {
  if (!checkInStr || !checkOutStr) return 1;
  const start = new Date(checkInStr);
  const end = new Date(checkOutStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

/**
 * Validates promo code and returns discount percentage (0-100).
 */
export function getPromoDiscountPercentage(promoCode?: string): number {
  if (!promoCode) return 0;
  const code = promoCode.trim().toUpperCase();
  return PROMO_CODES[code] || 0;
}

/**
 * Calculates the complete itemized rate breakdown for a booking.
 */
export function calculateRateBreakdown(
  room: Room,
  dates: BookingDates,
  promoCode?: string,
  currency: 'IDR' | 'USD' = 'IDR'
): RateBreakdown {
  const nights = calculateNights(dates.checkIn, dates.checkOut);
  const roomBaseRate = currency === 'IDR' ? room.basePriceIdr : room.basePriceUsd;
  const subtotal = roomBaseRate * nights;
  
  const discountPercentage = getPromoDiscountPercentage(promoCode);
  const discountAmount = Math.round(subtotal * (discountPercentage / 100));
  const afterDiscount = subtotal - discountAmount;
  
  const taxAmount = Math.round(afterDiscount * TAX_RATE);
  const serviceChargeAmount = Math.round(afterDiscount * SERVICE_CHARGE_RATE);
  const totalAmount = afterDiscount + taxAmount + serviceChargeAmount;

  return {
    nights,
    roomBaseRate,
    subtotal,
    discountAmount,
    discountPercentage,
    taxAmount,
    serviceChargeAmount,
    totalAmount,
    appliedPromo: discountPercentage > 0 ? promoCode?.trim().toUpperCase() : undefined,
  };
}

/**
 * Formats a monetary amount into Indonesian Rupiah or USD string.
 */
export function formatCurrency(amount: number, currency: 'IDR' | 'USD' = 'IDR'): string {
  if (currency === 'IDR') {
    return `IDR ${amount.toLocaleString('id-ID')}`;
  }
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Generates an authentic reservation reference string.
 */
export function generateBookingReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'BRH-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

/**
 * Validates guest form fields.
 */
export function validateGuestDetails(details: GuestDetails): { isValid: boolean; errors: Partial<Record<keyof GuestDetails, string>> } {
  const errors: Partial<Record<keyof GuestDetails, string>> = {};

  if (!details.fullName || details.fullName.trim().length < 3) {
    errors.fullName = 'Mohon masukkan nama lengkap Anda (minimal 3 karakter).';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!details.email || !emailRegex.test(details.email.trim())) {
    errors.email = 'Mohon masukkan alamat email yang valid untuk konfirmasi reservasi.';
  }

  if (!details.phone || details.phone.trim().length < 8) {
    errors.phone = 'Mohon masukkan nomor telepon/WhatsApp yang aktif.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
