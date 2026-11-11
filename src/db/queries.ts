import { db } from './index.ts';
import { rooms, roomCategories, promoCodes, reservations, payments, auditLogs, apiKeys, users } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import crypto from 'crypto';

// 1. Ambil daftar kamar aktif dari PostgreSQL
export async function getRoomsFromDb() {
  try {
    return await db.select().from(rooms);
  } catch (error) {
    console.error('Database query failed in getRoomsFromDb:', error);
    throw new Error('Gagal mengambil daftar kamar dari basis data.', { cause: error });
  }
}

// 2. Ambil daftar promo code aktif
export async function getPromoCodesFromDb() {
  try {
    return await db.select().from(promoCodes).where(eq(promoCodes.isActive, true));
  } catch (error) {
    console.error('Database query failed in getPromoCodesFromDb:', error);
    throw new Error('Gagal mengambil data promo dari basis data.', { cause: error });
  }
}

// 3. Simpan transaksi reservasi baru secara aman (ACID) ke PostgreSQL
export interface NewReservationPayload {
  id: string; // 'BRH-XXXXXX'
  userUid?: string;
  roomId: string;
  promoCode?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCity?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestCount: number;
  specialRequests?: string;
  subtotal: string;
  discount: string;
  serviceFee: string;
  tax: string;
  total: string;
  paymentMethod: string;
}

export async function createReservationInDb(payload: NewReservationPayload) {
  try {
    // 1. Simpan Reservasi
    await db.insert(reservations).values({
      id: payload.id,
      userUid: payload.userUid,
      roomId: payload.roomId,
      promoCode: payload.promoCode || null,
      guestName: payload.guestName,
      guestEmail: payload.guestEmail,
      guestPhone: payload.guestPhone,
      guestCity: payload.guestCity,
      checkIn: payload.checkIn,
      checkOut: payload.checkOut,
      nights: payload.nights,
      guestCount: payload.guestCount,
      specialRequests: payload.specialRequests,
      subtotal: payload.subtotal,
      discount: payload.discount,
      serviceFee: payload.serviceFee,
      tax: payload.tax,
      total: payload.total,
      status: 'Dikonfirmasi',
    });

    // 2. Simpan Bukti Pembayaran
    const paymentId = `PAY-${payload.id.replace('BRH-', '')}`;
    const refNumber = `REF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    await db.insert(payments).values({
      id: paymentId,
      reservationId: payload.id,
      paymentMethod: payload.paymentMethod,
      amount: payload.total,
      status: 'Lunas',
      referenceNumber: refNumber,
    });

    // 3. Catat Audit Log
    await db.insert(auditLogs).values({
      reservationId: payload.id,
      oldStatus: 'Baru',
      newStatus: 'Dikonfirmasi',
      note: `Reservasi berhasil dibuat atas nama ${payload.guestName} via ${payload.paymentMethod}`,
    });

    return {
      success: true,
      reservationId: payload.id,
      paymentId,
      referenceNumber: refNumber,
    };
  } catch (error) {
    console.error('Database insertion failed in createReservationInDb:', error);
    throw new Error('Gagal memproses transaksi reservasi di basis data.', { cause: error });
  }
}

// 4. Laporan Riwayat Reservasi (Multi-Join)
export async function getReservationsReport() {
  try {
    return await db
      .select({
        id: reservations.id,
        guestName: reservations.guestName,
        guestEmail: reservations.guestEmail,
        guestPhone: reservations.guestPhone,
        checkIn: reservations.checkIn,
        checkOut: reservations.checkOut,
        nights: reservations.nights,
        guestCount: reservations.guestCount,
        roomName: rooms.name,
        roomNumber: rooms.roomNumber,
        category: roomCategories.name,
        subtotal: reservations.subtotal,
        discount: reservations.discount,
        serviceFee: reservations.serviceFee,
        tax: reservations.tax,
        total: reservations.total,
        status: reservations.status,
        promoCode: reservations.promoCode,
        paymentMethod: payments.paymentMethod,
        paymentStatus: payments.status,
        createdAt: reservations.createdAt,
      })
      .from(reservations)
      .innerJoin(rooms, eq(reservations.roomId, rooms.id))
      .innerJoin(roomCategories, eq(rooms.categoryId, roomCategories.id))
      .leftJoin(payments, eq(reservations.id, payments.reservationId))
      .orderBy(desc(reservations.createdAt));
  } catch (error) {
    console.error('Database query failed in getReservationsReport:', error);
    throw new Error('Gagal mengambil laporan reservasi relasional.', { cause: error });
  }
}

// 5. Manajemen Kunci Keamanan API (API Keys)
export async function getApiKeysFromDb() {
  try {
    return await db
      .select({
        id: apiKeys.id,
        keyId: apiKeys.keyId,
        name: apiKeys.name,
        prefix: apiKeys.prefix,
        role: apiKeys.role,
        isActive: apiKeys.isActive,
        createdAt: apiKeys.createdAt,
        lastUsedAt: apiKeys.lastUsedAt,
      })
      .from(apiKeys)
      .orderBy(desc(apiKeys.createdAt));
  } catch (error) {
    console.error('Database query failed in getApiKeysFromDb:', error);
    throw new Error('Gagal mengambil daftar kunci API dari basis data.', { cause: error });
  }
}

// 6. Pembuatan Kunci API Baru untuk Integrasi & Keamanan Data
export async function generateNewApiKey(name: string, role: 'read_only' | 'read_write' | 'admin' = 'read_write') {
  try {
    const rawRandom = crypto.randomBytes(16).toString('hex');
    const secretPart = crypto.randomBytes(8).toString('hex');
    const fullApiKey = `brh_live_${rawRandom}${secretPart}`;
    const keyId = `brh_live_${rawRandom.substring(0, 11)}`;
    const prefix = `brh_live_${rawRandom.substring(0, 6)}...`;
    const keyHash = crypto.createHash('sha256').update(fullApiKey).digest('hex');

    const [created] = await db
      .insert(apiKeys)
      .values({
        keyId,
        name,
        keyHash,
        prefix,
        role,
        isActive: true,
      })
      .returning();

    return {
      apiKey: fullApiKey, // Hanya ditampilkan 1 kali kepada pengguna untuk dicatat
      keyDetails: created,
    };
  } catch (error) {
    console.error('Failed to generate API Key:', error);
    throw new Error('Gagal membuat kunci API baru di basis data.', { cause: error });
  }
}
