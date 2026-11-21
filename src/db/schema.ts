import { relations } from 'drizzle-orm';
import { boolean, date, decimal, integer, numeric, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

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

// ---------------------------------------------------------------------
// PHP OOP MVC Relational Tables (Supabase / Cloud SQL PostgreSQL)
// ---------------------------------------------------------------------

export const kategoriKamar = pgTable('kategori_kamar', {
  idKategori: serial('id_kategori').primaryKey(),
  kodeKategori: varchar('kode_kategori', { length: 20 }).notNull().unique(),
  namaKategori: varchar('nama_kategori', { length: 100 }).notNull(),
  deskripsi: text('deskripsi'),
  kapasitasMaks: integer('kapasitas_maks').notNull().default(2),
  tipePemandangan: varchar('tipe_pemandangan', { length: 100 }).notNull().default('Pemandangan Bukit & Teluk'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const kamar = pgTable('kamar', {
  idKamar: serial('id_kamar').primaryKey(),
  kodeKamar: varchar('kode_kamar', { length: 20 }).notNull().unique(),
  idKategori: integer('id_kategori').notNull().references(() => kategoriKamar.idKategori),
  nomorKamar: varchar('nomor_kamar', { length: 10 }).notNull().unique(),
  namaKamar: varchar('nama_kamar', { length: 150 }).notNull(),
  tagline: text('tagline'),
  deskripsi: text('deskripsi'),
  tarifPerMalam: numeric('tarif_per_malam', { precision: 12, scale: 2 }).notNull(),
  kapasitasTamu: integer('kapasitas_tamu').notNull().default(2),
  luasM2: integer('luas_m2').notNull().default(45),
  tipeKasur: varchar('tipe_kasur', { length: 80 }).notNull().default('King Bed'),
  pemandangan: varchar('pemandangan', { length: 120 }).notNull().default('Bukit & Teluk Lampung'),
  fasilitas: text('fasilitas').notNull().default('[]'),
  urlGambar: varchar('url_gambar', { length: 255 }).notNull().default('/assets/images/suite_presidential_1794410440213.jpg'),
  isFeatured: boolean('is_featured').notNull().default(false),
  statusKetersediaan: varchar('status_ketersediaan', { length: 30 }).notNull().default('Tersedia'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tamu = pgTable('tamu', {
  idTamu: serial('id_tamu').primaryKey(),
  namaLengkap: varchar('nama_lengkap', { length: 150 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  noTelepon: varchar('no_telepon', { length: 40 }).notNull(),
  kotaAsal: varchar('kota_asal', { length: 100 }).default('Bandar Lampung'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const voucherPromo = pgTable('voucher_promo', {
  idVoucher: serial('id_voucher').primaryKey(),
  kodePromo: varchar('kode_promo', { length: 40 }).notNull().unique(),
  namaPromo: varchar('nama_promo', { length: 150 }).notNull(),
  persenDiskon: integer('persen_diskon').notNull(),
  maksDiskon: numeric('maks_diskon', { precision: 12, scale: 2 }).notNull().default('1000000.00'),
  berlakuHingga: date('berlaku_hingga').notNull().default('2026-12-31'),
  isActive: boolean('is_active').notNull().default(true),
});

export const reservasi = pgTable('reservasi', {
  idReservasi: serial('id_reservasi').primaryKey(),
  kodeBooking: varchar('kode_booking', { length: 30 }).notNull().unique(),
  idTamu: integer('id_tamu').notNull().references(() => tamu.idTamu),
  idKamar: integer('id_kamar').notNull().references(() => kamar.idKamar),
  idVoucher: integer('id_voucher').references(() => voucherPromo.idVoucher),
  tglCheckin: date('tgl_checkin').notNull(),
  tglCheckout: date('tgl_checkout').notNull(),
  jumlahMalam: integer('jumlah_malam').notNull(),
  jumlahTamu: integer('jumlah_tamu').notNull().default(2),
  catatanKhusus: text('catatan_khusus'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  potonganDiskon: numeric('potongan_diskon', { precision: 12, scale: 2 }).notNull().default('0.00'),
  biayaLayanan: numeric('biaya_layanan', { precision: 12, scale: 2 }).notNull(),
  pajakPpn: numeric('pajak_ppn', { precision: 12, scale: 2 }).notNull(),
  totalTagihan: numeric('total_tagihan', { precision: 12, scale: 2 }).notNull(),
  statusReservasi: varchar('status_reservasi', { length: 30 }).notNull().default('Dikonfirmasi'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const pembayaran = pgTable('pembayaran', {
  idPembayaran: serial('id_pembayaran').primaryKey(),
  idReservasi: integer('id_reservasi').notNull().references(() => reservasi.idReservasi),
  metodePembayaran: varchar('metode_pembayaran', { length: 100 }).notNull().default('Transfer Virtual Account (BCA/Mandiri)'),
  jumlahBayar: numeric('jumlah_bayar', { precision: 12, scale: 2 }).notNull(),
  statusPembayaran: varchar('status_pembayaran', { length: 30 }).notNull().default('Lunas'),
  nomorReferensi: varchar('nomor_referensi', { length: 80 }).notNull().unique(),
  tglBayar: timestamp('tgl_bayar').defaultNow().notNull(),
});

export const logAuditReservasi = pgTable('log_audit_reservasi', {
  idLog: serial('id_log').primaryKey(),
  idReservasi: integer('id_reservasi').notNull(),
  kodeBooking: varchar('kode_booking', { length: 30 }),
  statusLama: varchar('status_lama', { length: 30 }),
  statusBaru: varchar('status_baru', { length: 30 }).notNull(),
  keterangan: text('keterangan'),
  waktuPerubahan: timestamp('waktu_perubahan').defaultNow().notNull(),
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
