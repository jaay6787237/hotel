import { relations } from 'drizzle-orm';
import { boolean, decimal, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// 1. Users Table (Integrated with Firebase Authentication)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').notNull().default('guest'), // 'guest' | 'staff' | 'admin'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. API Keys Table for Data Security & Machine-to-Machine Integration
export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  keyId: text('key_id').notNull().unique(), // Public identifier e.g. 'brh_live_8f3a...'
  name: text('name').notNull(), // Client / integration name e.g. 'Sistem Reservasi Mitra'
  keyHash: text('key_hash').notNull(), // SHA-256 hashed secret
  prefix: text('prefix').notNull(), // Preview prefix for display e.g. 'brh_live_8f3a...'
  role: text('role').notNull().default('read_write'), // 'read_only' | 'read_write' | 'admin'
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'),
});

// 3. Room Categories Table
export const roomCategories = pgTable('room_categories', {
  id: text('id').primaryKey(), // 'deluxe' | 'suite' | 'villa'
  name: text('name').notNull(),
  description: text('description'),
  maxCapacity: integer('max_capacity').notNull().default(2),
  viewType: text('view_type').default('Bukit & Kota'),
});

// 4. Rooms Table (Master Room Inventory)
export const rooms = pgTable('rooms', {
  id: text('id').primaryKey(), // e.g. 'royal-presidential-suite'
  categoryId: text('category_id')
    .notNull()
    .references(() => roomCategories.id),
  roomNumber: text('room_number').notNull().unique(),
  name: text('name').notNull(),
  squareMeters: integer('square_meters').notNull(),
  bedType: text('bed_type').notNull(),
  pricePerNight: decimal('price_per_night', { precision: 12, scale: 2 }).notNull(),
  capacity: integer('capacity').notNull().default(2),
  status: text('status').notNull().default('Tersedia'), // 'Tersedia' | 'Terisi' | 'Pemeliharaan'
  imageUrl: text('image_url'),
});

// 5. Promo Codes Table
export const promoCodes = pgTable('promo_codes', {
  code: text('code').primaryKey(), // e.g. 'HILLTOP15'
  name: text('name').notNull(),
  discountPercent: integer('discount_percent').notNull(),
  maxDiscount: decimal('max_discount', { precision: 12, scale: 2 }).default('1000000.00'),
  isActive: boolean('is_active').notNull().default(true),
  validUntil: text('valid_until').notNull(), // YYYY-MM-DD
});

// 6. Reservations Table (Core Booking Transactions)
export const reservations = pgTable('reservations', {
  id: text('id').primaryKey(), // 'BRH-XXXXXX'
  userUid: text('user_uid'),
  roomId: text('room_id')
    .notNull()
    .references(() => rooms.id),
  promoCode: text('promo_code').references(() => promoCodes.code),
  guestName: text('guest_name').notNull(),
  guestEmail: text('guest_email').notNull(),
  guestPhone: text('guest_phone').notNull(),
  guestCity: text('guest_city'),
  checkIn: text('check_in').notNull(), // YYYY-MM-DD
  checkOut: text('check_out').notNull(), // YYYY-MM-DD
  nights: integer('nights').notNull(),
  guestCount: integer('guest_count').notNull().default(2),
  specialRequests: text('special_requests'),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  serviceFee: decimal('service_fee', { precision: 12, scale: 2 }).notNull(), // 5%
  tax: decimal('tax', { precision: 12, scale: 2 }).notNull(), // 10%
  total: decimal('total', { precision: 12, scale: 2 }).notNull(),
  status: text('status').notNull().default('Dikonfirmasi'), // 'Dikonfirmasi' | 'Check-In' | 'Selesai' | 'Batal'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Payments Table
export const payments = pgTable('payments', {
  id: text('id').primaryKey(), // 'PAY-XXXXXX'
  reservationId: text('reservation_id')
    .notNull()
    .references(() => reservations.id),
  paymentMethod: text('payment_method').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: text('status').notNull().default('Lunas'), // 'Lunas' | 'Menunggu' | 'Gagal'
  referenceNumber: text('reference_number').notNull(),
  paidAt: timestamp('paid_at').defaultNow().notNull(),
});

// 8. Audit Logs Table (Logging changes & security triggers)
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  reservationId: text('reservation_id').notNull(),
  oldStatus: text('old_status'),
  newStatus: text('new_status').notNull(),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
  note: text('note'),
});

// Relationships
export const roomCategoriesRelations = relations(roomCategories, ({ many }) => ({
  rooms: many(rooms),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  category: one(roomCategories, {
    fields: [rooms.categoryId],
    references: [roomCategories.id],
  }),
  reservations: many(reservations),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  room: one(rooms, {
    fields: [reservations.roomId],
    references: [rooms.id],
  }),
  promo: one(promoCodes, {
    fields: [reservations.promoCode],
    references: [promoCodes.code],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  reservation: one(reservations, {
    fields: [payments.reservationId],
    references: [reservations.id],
  }),
}));
