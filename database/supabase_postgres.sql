-- =====================================================================
-- BUKIT RANDU HOSPITALITY - SKEMA SUPABASE POSTGRESQL
-- Salin dan jalankan seluruh skrip ini di Supabase -> SQL Editor!
-- Mencakup: DDL, DML, Row Level Security (RLS), Trigger,
--           Stored Procedure (SP), Stored Function (SF), Subquery, & Multi-Join.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. DDL: PEMBUATAN TABEL DAN RELASI (SINKRON DENGAN DRIZZLE SCHEMA)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    uid TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    display_name TEXT,
    role TEXT NOT NULL DEFAULT 'guest',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.api_keys (
    id SERIAL PRIMARY KEY,
    key_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    prefix TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'read_write',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.room_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    max_capacity INTEGER NOT NULL DEFAULT 2,
    view_type TEXT DEFAULT 'Bukit & Kota'
);

CREATE TABLE IF NOT EXISTS public.rooms (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES public.room_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    room_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    square_meters INTEGER NOT NULL,
    bed_type TEXT NOT NULL,
    price_per_night NUMERIC(12, 2) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 2,
    status TEXT NOT NULL DEFAULT 'Tersedia',
    image_url TEXT
);

CREATE TABLE IF NOT EXISTS public.promo_codes (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
    max_discount NUMERIC(12, 2) DEFAULT 1000000.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    valid_until TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reservations (
    id TEXT PRIMARY KEY,
    user_uid TEXT,
    room_id TEXT NOT NULL REFERENCES public.rooms(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    promo_code TEXT REFERENCES public.promo_codes(code) ON UPDATE CASCADE ON DELETE SET NULL,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    guest_city TEXT,
    check_in TEXT NOT NULL,
    check_out TEXT NOT NULL,
    nights INTEGER NOT NULL,
    guest_count INTEGER NOT NULL DEFAULT 2,
    special_requests TEXT,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    service_fee NUMERIC(12, 2) NOT NULL,
    tax NUMERIC(12, 2) NOT NULL,
    total NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Dikonfirmasi',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    reservation_id TEXT NOT NULL REFERENCES public.reservations(id) ON UPDATE CASCADE ON DELETE CASCADE,
    payment_method TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Lunas',
    reference_number TEXT NOT NULL,
    paid_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id SERIAL PRIMARY KEY,
    reservation_id TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    note TEXT
);

-- ---------------------------------------------------------------------
-- 2. DML: DATA AWAL (SEED DATA)
-- ---------------------------------------------------------------------

INSERT INTO public.room_categories (id, name, description, max_capacity, view_type) VALUES
('suite', 'Suite Panorama', 'Kamar suite mewah dengan kaca panorama menghadap teluk', 4, 'Bukit & Teluk'),
('villa', 'Villa Bukit', 'Villa privat di lereng bukit dengan teras kayu jati luas', 3, 'Lembah Hijau & Pegunungan'),
('executive', 'Retreat Eksekutif', 'Suaka eksekutif dengan ruang kerja ergonomis modern', 2, 'Sunset Barat & Cakrawala Kota'),
('family', 'Residensi Keluarga', 'Ruang hunian dua lantai untuk liburan keluarga besar', 6, 'Panorama Puncak Bukit 360°')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO public.rooms (id, category_id, room_number, name, square_meters, bed_type, price_per_night, capacity, status, image_url) VALUES
('royal-presidential-suite', 'suite', '301', 'Royal Hilltop Presidential Suite', 120, 'Super King Bed', 2850000.00, 4, 'Tersedia', '/assets/images/suite_presidential_1794410440213.jpg'),
('grand-horizon-villa', 'villa', '405', 'Grand Horizon Hillside Villa', 145, 'King Bed & Daybed', 3450000.00, 3, 'Tersedia', '/assets/images/villa_panoramic_1794410440783.jpg'),
('deluxe-panoramic-sanctuary', 'suite', '201', 'Deluxe Panoramic Sanctuary', 65, 'King Bed atau Twin', 1850000.00, 2, 'Tersedia', '/assets/images/bukit_randu_hero_1794410439341.jpg'),
('executive-sunset-suite', 'executive', '205', 'Executive Sunset Terrace Suite', 78, 'Ergonomic King Bed', 2150000.00, 2, 'Tersedia', '/assets/images/suite_presidential_1794410440213.jpg'),
('hillside-family-residence', 'family', '406', 'Hillside Two-Bedroom Residence', 180, '1 King + 2 Twin Beds', 4200000.00, 6, 'Tersedia', '/assets/images/villa_panoramic_1794410440783.jpg')
ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    price_per_night = EXCLUDED.price_per_night,
    image_url = EXCLUDED.image_url;

INSERT INTO public.promo_codes (code, name, discount_percent, max_discount, is_active, valid_until) VALUES
('HILLTOP15', 'Diskon Spesial Reservasi Online 15%', 15, 750000.00, TRUE, '2026-12-31'),
('BUKITVIP', 'Eksklusif Member Suite Bukit Randu 20%', 20, 1000000.00, TRUE, '2026-12-31'),
('WEEKEND10', 'Promo Staycation Akhir Pekan 10%', 10, 500000.00, TRUE, '2026-12-31')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.api_keys (key_id, name, key_hash, prefix, role, is_active) VALUES
('brh_live_9f82d1c7e4a', 'Kunci API Produksi Web & Mobile', 'a8f5c2d3e4b10987654321fedcba0123456789abcdef0123456789abcdef0123', 'brh_live_9f82...', 'read_write', TRUE)
ON CONFLICT (key_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 3. STORED FUNCTION (SF) - PL/pgSQL
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sf_hitung_total_tagihan(
    p_harga_per_malam NUMERIC,
    p_jumlah_malam INTEGER,
    p_persen_diskon INTEGER DEFAULT 0
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    v_subtotal NUMERIC(12,2);
    v_potongan NUMERIC(12,2);
    v_dasar_pajak NUMERIC(12,2);
    v_layanan NUMERIC(12,2);
    v_ppn NUMERIC(12,2);
BEGIN
    v_subtotal := p_harga_per_malam * GREATEST(p_jumlah_malam, 1);
    v_potongan := v_subtotal * (COALESCE(p_persen_diskon, 0) / 100.0);
    v_dasar_pajak := v_subtotal - v_potongan;
    v_layanan := v_dasar_pajak * 0.05;
    v_ppn := v_dasar_pajak * 0.10;
    RETURN ROUND(v_dasar_pajak + v_layanan + v_ppn, 2);
END;
$$;

CREATE OR REPLACE FUNCTION public.sf_cek_ketersediaan_kamar(
    p_room_id TEXT,
    p_check_in TEXT,
    p_check_out TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_konflik INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_konflik
    FROM public.reservations
    WHERE room_id = p_room_id
      AND status NOT IN ('Batal', 'Selesai')
      AND (check_in <= p_check_out AND check_out >= p_check_in);

    RETURN v_konflik = 0;
END;
$$;

-- ---------------------------------------------------------------------
-- 4. TRIGGER & TRIGGER FUNCTION (PL/pgSQL)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_trg_audit_dan_kamar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (reservation_id, old_status, new_status, note)
        VALUES (NEW.id, 'Baru', NEW.status, 'Reservasi dibuat atas nama ' || NEW.guest_name);

        IF NEW.status IN ('Dikonfirmasi', 'Check-In') THEN
            UPDATE public.rooms SET status = 'Terisi' WHERE id = NEW.room_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO public.audit_logs (reservation_id, old_status, new_status, note)
            VALUES (NEW.id, OLD.status, NEW.status, 'Status berubah dari ' || OLD.status || ' menjadi ' || NEW.status);
        END IF;

        IF NEW.status IN ('Selesai', 'Batal') THEN
            UPDATE public.rooms SET status = 'Tersedia' WHERE id = NEW.room_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_reservasi_audit_kamar ON public.reservations;
CREATE TRIGGER trg_reservasi_audit_kamar
AFTER INSERT OR UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_audit_dan_kamar();

-- ---------------------------------------------------------------------
-- 5. STORED PROCEDURE (SP) - PL/pgSQL
-- ---------------------------------------------------------------------

CREATE OR REPLACE PROCEDURE public.sp_proses_check_out(
    IN p_reservation_id TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.reservations
    SET status = 'Selesai'
    WHERE id = p_reservation_id;
END;
$$;

-- ---------------------------------------------------------------------
-- 6. MULTI-JOIN VIEW & SUBQUERY ANALISIS
-- ---------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_laporan_reservasi_lengkap AS
SELECT
    r.id AS kode_booking,
    r.guest_name AS nama_tamu,
    r.guest_email,
    r.guest_phone,
    rc.name AS kategori,
    rm.room_number AS nomor_kamar,
    rm.name AS nama_suite,
    r.check_in,
    r.check_out,
    r.nights AS jumlah_malam,
    COALESCE(pc.name, 'Tanpa Promo') AS promo_digunakan,
    r.subtotal,
    r.discount,
    r.service_fee,
    r.tax,
    r.total,
    p.payment_method,
    p.status AS status_pembayaran,
    r.status AS status_reservasi,
    r.created_at
FROM public.reservations r
INNER JOIN public.rooms rm ON r.room_id = rm.id
INNER JOIN public.room_categories rc ON rm.category_id = rc.id
LEFT JOIN public.payments p ON r.id = p.reservation_id
LEFT JOIN public.promo_codes pc ON r.promo_code = pc.code
ORDER BY r.created_at DESC;

-- Contoh Subquery: Kamar dengan tarif di atas rata-rata seluruh resort
-- SELECT room_number, name, price_per_night
-- FROM public.rooms
-- WHERE price_per_night > (SELECT AVG(price_per_night) FROM public.rooms);

-- ---------------------------------------------------------------------
-- 7. SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ---------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Katalog kamar, kategori, dan promo aktif dapat dibaca oleh publik
DROP POLICY IF EXISTS "Public read room_categories" ON public.room_categories;
CREATE POLICY "Public read room_categories" ON public.room_categories
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read rooms" ON public.rooms;
CREATE POLICY "Public read rooms" ON public.rooms
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read active promo_codes" ON public.promo_codes;
CREATE POLICY "Public read active promo_codes" ON public.promo_codes
FOR SELECT USING (is_active = true);

-- Tamu dapat membuat reservasi & pembayaran baru (pembacaan laporan sensitif tetap wajib Service Role / API Key)
DROP POLICY IF EXISTS "Public insert reservations" ON public.reservations;
CREATE POLICY "Public insert reservations" ON public.reservations
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert payments" ON public.payments;
CREATE POLICY "Public insert payments" ON public.payments
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert audit_logs" ON public.audit_logs;
CREATE POLICY "Public insert audit_logs" ON public.audit_logs
FOR INSERT WITH CHECK (true);
