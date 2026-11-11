import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNights,
  getPromoDiscountPercentage,
  calculateRateBreakdown,
  formatCurrency,
  validateGuestDetails,
  Room
} from './booking';

const mockRoom: Room = {
  id: 'presidential-suite',
  name: 'Royal Hilltop Presidential Suite',
  tagline: 'Panoramic views over Bandar Lampung bay',
  category: 'suite',
  basePriceIdr: 2500000,
  basePriceUsd: 165,
  maxGuests: 4,
  bedType: 'Super King Bed',
  view: 'Panoramic Hill & Bay View',
  sqm: 110,
  image: '/test.jpg',
  description: 'Luxury suite atop Bukit Randu.',
  amenities: ['Panoramic Balcony', 'Butler Service', 'High-speed Wi-Fi', 'Complimentary Breakfast'],
  featured: true,
};

test('calculateNights calculates difference between two valid dates correctly', () => {
  assert.equal(calculateNights('2026-11-20', '2026-11-23'), 3);
  assert.equal(calculateNights('2026-11-20', '2026-11-21'), 1);
  assert.equal(calculateNights('2026-11-20', '2026-11-20'), 1); // fallback to min 1
});

test('getPromoDiscountPercentage handles valid and invalid codes', () => {
  assert.equal(getPromoDiscountPercentage('HILLTOP15'), 15);
  assert.equal(getPromoDiscountPercentage('hilltop15'), 15); // case insensitive
  assert.equal(getPromoDiscountPercentage('BUKITVIP'), 20);
  assert.equal(getPromoDiscountPercentage('INVALIDCODE'), 0);
  assert.equal(getPromoDiscountPercentage(undefined), 0);
});

test('calculateRateBreakdown computes nights, discount, tax, service charge, and total in IDR', () => {
  const breakdown = calculateRateBreakdown(mockRoom, {
    checkIn: '2026-12-01',
    checkOut: '2026-12-03' // 2 nights
  }, 'HILLTOP15', 'IDR');

  assert.equal(breakdown.nights, 2);
  assert.equal(breakdown.roomBaseRate, 2500000);
  assert.equal(breakdown.subtotal, 5000000);
  assert.equal(breakdown.discountPercentage, 15);
  assert.equal(breakdown.discountAmount, 750000); // 15% of 5,000,000
  
  const afterDiscount = 4250000;
  assert.equal(breakdown.taxAmount, Math.round(afterDiscount * 0.10)); // 425,000
  assert.equal(breakdown.serviceChargeAmount, Math.round(afterDiscount * 0.05)); // 212,500
  assert.equal(breakdown.totalAmount, afterDiscount + 425000 + 212500); // 4,887,500
  assert.equal(breakdown.appliedPromo, 'HILLTOP15');
});

test('formatCurrency handles IDR and USD formatting', () => {
  assert.equal(formatCurrency(2500000, 'IDR'), 'IDR 2.500.000');
  assert.equal(formatCurrency(165, 'USD'), '$165');
});

test('validateGuestDetails validates complete and incomplete entries', () => {
  const valid = validateGuestDetails({
    fullName: 'Maulana Jaya',
    email: 'guest@example.com',
    phone: '+6281234567890',
  });
  assert.equal(valid.isValid, true);
  assert.deepEqual(valid.errors, {});

  const invalid = validateGuestDetails({
    fullName: 'A',
    email: 'not-an-email',
    phone: '',
  });
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.fullName);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.phone);
});
