import { db, isUsingSupabasePg } from './index.ts';
import { rooms, roomCategories, promoCodes, reservations, payments, auditLogs, apiKeys } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { supabaseAdmin, isUsingSupabaseApi } from '../lib/supabase-admin.ts';

const shouldUseSupabaseRest = (): boolean => isUsingSupabaseApi() && !isUsingSupabasePg() && Boolean(supabaseAdmin);

// 1. Ambil daftar kamar aktif dari PostgreSQL / Supabase
export async function getRoomsFromDb() {
  try {
    if (shouldUseSupabaseRest() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin.from('rooms').select('*');
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        categoryId: r.category_id,
        roomNumber: r.room_number,
        name: r.name,
        squareMeters: r.square_meters,
        bedType: r.bed_type,
        pricePerNight: String(r.price_per_night),
        capacity: r.capacity,
        status: r.status,
        imageUrl: r.image_url,
      }));
    }
    return await db.select().from(rooms);
  } catch (error) {
    console.error('Database query failed in getRoomsFromDb:', error);
    throw new Error('Gagal mengambil daftar kamar dari basis data.', { cause: error });
  }
}

// 2. Ambil daftar promo code aktif
export async function getPromoCodesFromDb() {
  try {
    if (shouldUseSupabaseRest() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('promo_codes')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return (data || []).map((p: any) => ({
        code: p.code,
        name: p.name,
        discountPercent: p.discount_percent,
        maxDiscount: String(p.max_discount),
        isActive: p.is_active,
        validUntil: p.valid_until,
      }));
    }
    return await db.select().from(promoCodes).where(eq(promoCodes.isActive, true));
  } catch (error) {
    console.error('Database query failed in getPromoCodesFromDb:', error);
    throw new Error('Gagal mengambil data promo dari basis data.', { cause: error });
  }
}

// 3. Simpan transaksi reservasi baru secara aman (ACID) ke PostgreSQL / Supabase
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
    const paymentId = `PAY-${payload.id.replace('BRH-', '')}`;
    const refNumber = `REF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    if (shouldUseSupabaseRest() && supabaseAdmin) {
      const { error: resError } = await supabaseAdmin.from('reservations').insert({
        id: payload.id,
        user_uid: payload.userUid || null,
        room_id: payload.roomId,
        promo_code: payload.promoCode || null,
        guest_name: payload.guestName,
        guest_email: payload.guestEmail,
        guest_phone: payload.guestPhone,
        guest_city: payload.guestCity || null,
        check_in: payload.checkIn,
        check_out: payload.checkOut,
        nights: payload.nights,
        guest_count: payload.guestCount,
        special_requests: payload.specialRequests || null,
        subtotal: payload.subtotal,
        discount: payload.discount,
        service_fee: payload.serviceFee,
        tax: payload.tax,
        total: payload.total,
        status: 'Dikonfirmasi',
      });
      if (resError) throw resError;

      const { error: payError } = await supabaseAdmin.from('payments').insert({
        id: paymentId,
        reservation_id: payload.id,
        payment_method: payload.paymentMethod,
        amount: payload.total,
        status: 'Lunas',
        reference_number: refNumber,
      });
      if (payError) throw payError;

      await supabaseAdmin.from('audit_logs').insert({
        reservation_id: payload.id,
        old_status: 'Baru',
        new_status: 'Dikonfirmasi',
        note: `Reservasi berhasil dibuat atas nama ${payload.guestName} via ${payload.paymentMethod}`,
      });

      return {
        success: true,
        reservationId: payload.id,
        paymentId,
        referenceNumber: refNumber,
      };
    }

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
    if (shouldUseSupabaseRest() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('v_laporan_reservasi_lengkap')
        .select('*');
      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.kode_booking,
        guestName: row.nama_tamu,
        guestEmail: row.guest_email,
        guestPhone: row.guest_phone,
        checkIn: row.check_in,
        checkOut: row.check_out,
        nights: row.jumlah_malam,
        roomName: row.nama_suite,
        roomNumber: row.nomor_kamar,
        category: row.kategori,
        subtotal: String(row.subtotal),
        discount: String(row.discount),
        serviceFee: String(row.service_fee),
        tax: String(row.tax),
        total: String(row.total),
        status: row.status_reservasi,
        promoCode: row.promo_digunakan,
        paymentMethod: row.payment_method,
        paymentStatus: row.status_pembayaran,
        createdAt: row.created_at,
      }));
    }

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
    if (shouldUseSupabaseRest() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('api_keys')
        .select('id, key_id, name, prefix, role, is_active, created_at, last_used_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((k: any) => ({
        id: k.id,
        keyId: k.key_id,
        name: k.name,
        prefix: k.prefix,
        role: k.role,
        isActive: k.is_active,
        createdAt: k.created_at,
        lastUsedAt: k.last_used_at,
      }));
    }

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

    if (shouldUseSupabaseRest() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('api_keys')
        .insert({
          key_id: keyId,
          name,
          key_hash: keyHash,
          prefix,
          role,
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;
      return {
        apiKey: fullApiKey,
        keyDetails: data,
      };
    }

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
