-- =====================================================================
-- BUKIT RANDU HOSPITALITY — HOLIDAY INN LAMPUNG BUKIT RANDU
-- SKEMA BASIS DATA POSTGRESQL (SUPABASE READY - PL/pgSQL)
-- Mencakup: 7 Tabel Relasional, Seed Data, 2 Stored Function,
--           2 Stored Procedure, 2 Trigger, View Multi-Join 6 Tabel,
--           dan Analitik Scalar Subquery.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. DDL: PEMBUATAN 7 TABEL RELASIONAL
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.kategori_kamar (
    id_kategori SERIAL PRIMARY KEY,
    kode_kategori VARCHAR(20) NOT NULL UNIQUE,
    nama_kategori VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    kapasitas_maks INT NOT NULL DEFAULT 2,
    tipe_pemandangan VARCHAR(100) NOT NULL DEFAULT 'Pemandangan Bukit & Teluk',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kamar (
    id_kamar SERIAL PRIMARY KEY,
    kode_kamar VARCHAR(20) NOT NULL UNIQUE,
    id_kategori INT NOT NULL REFERENCES public.kategori_kamar(id_kategori) ON UPDATE CASCADE ON DELETE RESTRICT,
    nomor_kamar VARCHAR(10) NOT NULL UNIQUE,
    nama_kamar VARCHAR(150) NOT NULL,
    tagline TEXT,
    deskripsi TEXT,
    tarif_per_malam NUMERIC(12, 2) NOT NULL CHECK (tarif_per_malam > 0),
    kapasitas_tamu INT NOT NULL DEFAULT 2,
    luas_m2 INT NOT NULL DEFAULT 45,
    tipe_kasur VARCHAR(80) NOT NULL DEFAULT 'King Bed',
    pemandangan VARCHAR(120) NOT NULL DEFAULT 'Bukit & Teluk Lampung',
    fasilitas TEXT NOT NULL DEFAULT '[]',
    url_gambar VARCHAR(255) NOT NULL DEFAULT '/assets/images/suite_presidential_1794410440213.jpg',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    status_ketersediaan VARCHAR(30) NOT NULL DEFAULT 'Tersedia'
        CHECK (status_ketersediaan IN ('Tersedia', 'Terisi', 'Pemeliharaan')),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tamu (
    id_tamu SERIAL PRIMARY KEY,
    nama_lengkap VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    no_telepon VARCHAR(40) NOT NULL,
    kota_asal VARCHAR(100) DEFAULT 'Bandar Lampung',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.voucher_promo (
    id_voucher SERIAL PRIMARY KEY,
    kode_promo VARCHAR(40) NOT NULL UNIQUE,
    nama_promo VARCHAR(150) NOT NULL,
    persen_diskon INT NOT NULL CHECK (persen_diskon BETWEEN 1 AND 100),
    maks_diskon NUMERIC(12, 2) NOT NULL DEFAULT 1000000.00,
    berlaku_hingga DATE NOT NULL DEFAULT '2026-12-31',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.reservasi (
    id_reservasi SERIAL PRIMARY KEY,
    kode_booking VARCHAR(30) NOT NULL UNIQUE,
    id_tamu INT NOT NULL REFERENCES public.tamu(id_tamu) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_kamar INT NOT NULL REFERENCES public.kamar(id_kamar) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_voucher INT REFERENCES public.voucher_promo(id_voucher) ON UPDATE CASCADE ON DELETE SET NULL,
    tgl_checkin DATE NOT NULL,
    tgl_checkout DATE NOT NULL,
    jumlah_malam INT NOT NULL CHECK (jumlah_malam >= 1),
    jumlah_tamu INT NOT NULL DEFAULT 2,
    catatan_khusus TEXT,
    subtotal NUMERIC(12, 2) NOT NULL,
    potongan_diskon NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    biaya_layanan NUMERIC(12, 2) NOT NULL,
    pajak_ppn NUMERIC(12, 2) NOT NULL,
    total_tagihan NUMERIC(12, 2) NOT NULL,
    status_reservasi VARCHAR(30) NOT NULL DEFAULT 'Dikonfirmasi'
        CHECK (status_reservasi IN ('Menunggu', 'Dikonfirmasi', 'Check-In', 'Selesai', 'Batal')),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pembayaran (
    id_pembayaran SERIAL PRIMARY KEY,
    id_reservasi INT NOT NULL REFERENCES public.reservasi(id_reservasi) ON UPDATE CASCADE ON DELETE CASCADE,
    metode_pembayaran VARCHAR(100) NOT NULL DEFAULT 'Transfer Virtual Account (BCA/Mandiri)',
    jumlah_bayar NUMERIC(12, 2) NOT NULL,
    status_pembayaran VARCHAR(30) NOT NULL DEFAULT 'Lunas'
        CHECK (status_pembayaran IN ('Belum Lunas', 'Lunas', 'Dikembalikan')),
    nomor_referensi VARCHAR(80) NOT NULL UNIQUE,
    tgl_bayar TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.log_audit_reservasi (
    id_log SERIAL PRIMARY KEY,
    id_reservasi INT NOT NULL,
    kode_booking VARCHAR(30),
    status_lama VARCHAR(30),
    status_baru VARCHAR(30) NOT NULL,
    keterangan TEXT,
    waktu_perubahan TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2. DML: DATA AWAL (SEED DATA)
-- ---------------------------------------------------------------------

INSERT INTO public.kategori_kamar (kode_kategori, nama_kategori, deskripsi, kapasitas_maks, tipe_pemandangan) VALUES
('KAT-DLX', 'Suite Panorama', 'Kamar modern di puncak bukit bersebelahan langsung dengan kolam renang infinity dan pemandangan Teluk Lampung.', 2, 'Kolam Infinity & Horizon Teluk'),
('KAT-EXEC', 'Retreat Eksekutif', 'Suaka eksekutif yang memadukan fasilitas workstation modern dengan pemandangan golden hour spektakuler.', 2, 'Sunset Barat & Cakrawala Kota'),
('KAT-PRES', 'Presidential Suite', 'Master suite mewah dengan kaca panorama melengkung 270 derajat menghadap pesona Teluk Lampung.', 4, 'Pemandangan Bukit & Teluk'),
('KAT-VILA', 'Villa & Residensi Bukit', 'Villa privat dan hunian dua lantai di lereng bukit dengan teras kayu jati luas untuk pasangan maupun keluarga.', 6, 'Lembah Hijau & Pegunungan')
ON CONFLICT (kode_kategori) DO UPDATE SET
    nama_kategori = EXCLUDED.nama_kategori,
    deskripsi = EXCLUDED.deskripsi,
    kapasitas_maks = EXCLUDED.kapasitas_maks,
    tipe_pemandangan = EXCLUDED.tipe_pemandangan;

INSERT INTO public.kamar (
    kode_kamar, id_kategori, nomor_kamar, nama_kamar, tagline, deskripsi,
    tarif_per_malam, kapasitas_tamu, luas_m2, tipe_kasur, pemandangan,
    fasilitas, url_gambar, is_featured, status_ketersediaan
) VALUES
(
    'KMR-101',
    (SELECT id_kategori FROM public.kategori_kamar WHERE kode_kategori = 'KAT-DLX'),
    '101',
    'Deluxe Panoramic Sanctuary',
    'Kamar modern di puncak bukit bersebelahan langsung dengan kolam renang infinity',
    'Dirancang untuk kenyamanan istimewa dengan pemandangan menakjubkan, Deluxe Panoramic Sanctuary memadukan gaya minimalis kontemporer dengan aksen batu alam. Langkah langsung ke dek kolam renang atau nikmati kopi senja dari balkon kaca pribadi Anda.',
    1850000.00, 2, 65, 'King Bed atau Twin', 'Kolam Infinity & Horizon Teluk',
    '["Akses Langsung ke Dek Kolam Renang","Pilihan Ranjang King atau Twin","Balkon Panorama Pribadi","Sarapan Prasmanan Termasuk","Meja Kerja Ergonomis & Wi-Fi Cepat","Rainfall Shower Hangat","Brankas Kamar & Layanan Setrika"]',
    '/assets/images/bukit_randu_hero_1794410439341.jpg', TRUE, 'Tersedia'
),
(
    'KMR-201',
    (SELECT id_kategori FROM public.kategori_kamar WHERE kode_kategori = 'KAT-EXEC'),
    '201',
    'Executive Sunset Terrace Suite',
    'Dirancang khusus bagi pebisnis dan delegasi yang mengutamakan fokus dan kemewahan',
    'Suaka eksekutif yang memadukan fasilitas workstation modern dengan pemandangan golden hour spektakuler. Termasuk akses eksklusif ke Hilltop Business Lounge, layanan binatu kilat, dan sajian canape sore.',
    2150000.00, 2, 78, 'Ergonomic King Bed', 'Sunset Barat & Cakrawala Kota',
    '["Akses Executive Lounge Puncak","Ruang Kerja Ergonomis Modern","Koneksi Wi-Fi 200 Mbps","Balkon Sunset Panorama Barat","Layanan Binatu & Pressing Cepat","Sarapan Harian & Canape Senja","Smart TV Hiburan Berkualitas"]',
    '/assets/images/suite_presidential_1794410440213.jpg', FALSE, 'Tersedia'
),
(
    'KMR-301',
    (SELECT id_kategori FROM public.kategori_kamar WHERE kode_kategori = 'KAT-PRES'),
    '301',
    'Royal Hilltop Presidential Suite',
    'Master suite mewah dengan kaca panorama melengkung menghadap pesona Teluk Lampung',
    'Berada di puncak tertinggi Bukit Randu, Presidential Suite kami menyajikan panorama spektakuler 270 derajat yang memadukan punggung perbukitan hijau asri hingga garis pantai Teluk Lampung yang berkilau. Dilengkapi seni ukir kayu jati nusantara, ruang santai privat, bathtub marmer mewah, dan layanan butler pribadi 24 jam.',
    2850000.00, 4, 120, 'Super King Bed', 'Pemandangan Bukit & Teluk',
    '["Pemandangan Panorama Bukit & Laut","Tempat Tidur Super King","Sarapan Prasmanan Eksklusif Termasuk","Jacuzzi Marmer Pribadi","Layanan Butler 24 Jam","Wi-Fi Serat Optik Kecepatan Tinggi","Mesin Kopi Espresso & Pilihan Teh Pilihan","Akses Prioritas Horizon Infinity Pool"]',
    '/assets/images/suite_presidential_1794410440213.jpg', TRUE, 'Tersedia'
),
(
    'KMR-302',
    (SELECT id_kategori FROM public.kategori_kamar WHERE kode_kategori = 'KAT-VILA'),
    '302',
    'Grand Horizon Hillside Villa',
    'Villa privat di lereng bukit dengan teras kayu jati luas dan daybed luar ruangan',
    'Rasakan kedamaian pegunungan di villa mandiri kami. Dikelilingi tanaman tropis alami, teras kayu yang lapang sangat ideal untuk bersantai di pagi hari dan menikmati matahari terbenam, lengkap dengan rain-shower alam terbuka dan wine bar kurasi khusus.',
    3450000.00, 3, 145, 'King Bed & Daybed', 'Lembah Hijau & Pegunungan',
    '["Daybed Santai Luar Ruangan","Tempat Tidur King","Panorama Lembah Pegunungan","Afternoon Tea Gratis Setiap Sore","Shower Batu Alam Terbuka","Mini Bar & Wine Bar Kurasi","Antar-Jemput Buggy Car Bukit","Fasilitas Minibar Lengkap"]',
    '/assets/images/villa_panoramic_1794410440783.jpg', TRUE, 'Tersedia'
),
(
    'KMR-401',
    (SELECT id_kategori FROM public.kategori_kamar WHERE kode_kategori = 'KAT-VILA'),
    '401',
    'Hillside Two-Bedroom Residence',
    'Ruang hunian dua lantai yang dirancang istimewa untuk liburan keluarga besar',
    'Nikmati kebersamaan bersama keluarga dalam kemewahan dua kamar tidur terpisah dan paviliun ruang tamu berkonsep terbuka. Dilengkapi ruang makan keluarga, dapur pantry, dek berjemur privat, dan area aman untuk anak-anak.',
    4200000.00, 6, 180, '1 King + 2 Twin Beds', 'Panorama Puncak Bukit 360°',
    '["Dua Kamar Tidur dengan Kamar Mandi En-Suite","Paviliun Ruang Tamu & Ruang Makan Luas","Sundeck Keluarga Pribadi","Sarapan Gratis untuk 4 Orang Dewasa","Paket Bingkisan Selamat Datang Anak","Layanan Pramutamu Keluarga Khusus","Layanan Santap Kamar 24 Jam"]',
    '/assets/images/villa_panoramic_1794410440783.jpg', FALSE, 'Tersedia'
)
ON CONFLICT (kode_kamar) DO UPDATE SET
    nama_kamar = EXCLUDED.nama_kamar,
    tarif_per_malam = EXCLUDED.tarif_per_malam,
    url_gambar = EXCLUDED.url_gambar;

INSERT INTO public.voucher_promo (kode_promo, nama_promo, persen_diskon, maks_diskon, berlaku_hingga, is_active) VALUES
('HILLTOP15', 'Diskon Spesial Reservasi Online 15%', 15, 1500000.00, '2026-12-31', TRUE),
('BUKITVIP', 'Eksklusif Member Suite Bukit Randu 20%', 20, 2000000.00, '2026-12-31', TRUE),
('WEEKEND10', 'Promo Staycation Akhir Pekan 10%', 10, 1000000.00, '2026-12-31', TRUE)
ON CONFLICT (kode_promo) DO UPDATE SET
    nama_promo = EXCLUDED.nama_promo,
    persen_diskon = EXCLUDED.persen_diskon,
    is_active = EXCLUDED.is_active;

INSERT INTO public.tamu (nama_lengkap, email, no_telepon, kota_asal) VALUES
('Dr. Hartono Sasongko', 'hartono.sasongko@example.com', '+62 811-721-9001', 'Jakarta'),
('Dewi Kartika', 'dewi.kartika@example.com', '+62 812-8834-2210', 'Bandung')
ON CONFLICT (email) DO NOTHING;

-- ---------------------------------------------------------------------
-- 3. STORED FUNCTION (PL/pgSQL)
-- ---------------------------------------------------------------------

-- Hapus overload lama 3-parameter jika ada agar konsisten menggunakan 4 parameter (+ p_maks_diskon)
DROP FUNCTION IF EXISTS public.sf_hitung_total_tagihan(NUMERIC, INT, INT);

CREATE OR REPLACE FUNCTION public.sf_hitung_total_tagihan(
    p_harga_per_malam NUMERIC,
    p_jumlah_malam INT,
    p_persen_diskon INT DEFAULT 0,
    p_maks_diskon NUMERIC DEFAULT 0
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    v_subtotal NUMERIC(12, 2);
    v_potongan NUMERIC(12, 2);
    v_setelah_diskon NUMERIC(12, 2);
    v_layanan NUMERIC(12, 2);
    v_ppn NUMERIC(12, 2);
BEGIN
    v_subtotal := p_harga_per_malam * GREATEST(p_jumlah_malam, 1);
    v_potongan := ROUND(v_subtotal * (GREATEST(LEAST(COALESCE(p_persen_diskon, 0), 100), 0) / 100.0), 2);

    IF COALESCE(p_maks_diskon, 0) > 0 AND v_potongan > p_maks_diskon THEN
        v_potongan := p_maks_diskon;
    END IF;

    v_setelah_diskon := v_subtotal - v_potongan;
    v_layanan := ROUND(v_setelah_diskon * 0.05, 2);
    v_ppn := ROUND(v_setelah_diskon * 0.10, 2);
    RETURN ROUND(v_setelah_diskon + v_layanan + v_ppn, 2);
END;
$$;

CREATE OR REPLACE FUNCTION public.sf_cek_ketersediaan_kamar(
    p_id_kamar INT,
    p_tgl_checkin DATE,
    p_tgl_checkout DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_status_kamar VARCHAR(30);
    v_bentrok INT;
BEGIN
    IF p_tgl_checkin IS NULL OR p_tgl_checkout IS NULL OR p_tgl_checkout <= p_tgl_checkin THEN
        RETURN FALSE;
    END IF;

    SELECT status_ketersediaan INTO v_status_kamar
    FROM public.kamar
    WHERE id_kamar = p_id_kamar;

    IF v_status_kamar IS NULL OR v_status_kamar <> 'Tersedia' THEN
        RETURN FALSE;
    END IF;

    SELECT COUNT(*) INTO v_bentrok
    FROM public.reservasi
    WHERE id_kamar = p_id_kamar
      AND status_reservasi NOT IN ('Batal', 'Selesai')
      AND (tgl_checkin < p_tgl_checkout AND tgl_checkout > p_tgl_checkin);

    RETURN v_bentrok = 0;
END;
$$;

-- ---------------------------------------------------------------------
-- 4. TRIGGER & TRIGGER FUNCTION (PL/pgSQL)
-- ---------------------------------------------------------------------

-- Sinkronisasi status kamar hanya saat Check-In / Selesai / Pembatalan Check-In + pencatatan Audit Log
CREATE OR REPLACE FUNCTION public.fn_trg_log_perubahan_reservasi()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status_reservasi IS DISTINCT FROM NEW.status_reservasi THEN
        IF NEW.status_reservasi = 'Check-In' THEN
            UPDATE public.kamar
            SET status_ketersediaan = 'Terisi'
            WHERE id_kamar = NEW.id_kamar;
        ELSIF NEW.status_reservasi = 'Selesai' THEN
            UPDATE public.kamar
            SET status_ketersediaan = 'Pemeliharaan'
            WHERE id_kamar = NEW.id_kamar;
        ELSIF NEW.status_reservasi = 'Batal' AND OLD.status_reservasi = 'Check-In' THEN
            UPDATE public.kamar
            SET status_ketersediaan = 'Tersedia'
            WHERE id_kamar = NEW.id_kamar;
        END IF;

        INSERT INTO public.log_audit_reservasi (
            id_reservasi,
            kode_booking,
            status_lama,
            status_baru,
            keterangan
        ) VALUES (
            NEW.id_reservasi,
            NEW.kode_booking,
            OLD.status_reservasi,
            NEW.status_reservasi,
            'Perubahan status otomatis oleh Trigger: ' || OLD.status_reservasi || ' -> ' || NEW.status_reservasi
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_perubahan_reservasi ON public.reservasi;
CREATE TRIGGER trg_log_perubahan_reservasi
AFTER UPDATE ON public.reservasi
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_log_perubahan_reservasi();

CREATE OR REPLACE FUNCTION public.fn_trg_update_ketersediaan_kamar()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Kamar fisik baru berstatus Terisi saat tamu benar-benar Check-In
    IF NEW.status_reservasi = 'Check-In' THEN
        UPDATE public.kamar
        SET status_ketersediaan = 'Terisi'
        WHERE id_kamar = NEW.id_kamar;
    END IF;

    INSERT INTO public.log_audit_reservasi (
        id_reservasi,
        kode_booking,
        status_lama,
        status_baru,
        keterangan
    ) VALUES (
        NEW.id_reservasi,
        NEW.kode_booking,
        'Baru',
        NEW.status_reservasi,
        'Reservasi baru dibuat dengan status awal: ' || NEW.status_reservasi
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_ketersediaan_kamar ON public.reservasi;
CREATE TRIGGER trg_update_ketersediaan_kamar
AFTER INSERT ON public.reservasi
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_update_ketersediaan_kamar();

-- ---------------------------------------------------------------------
-- 5. STORED PROCEDURE (PL/pgSQL)
-- ---------------------------------------------------------------------

CREATE OR REPLACE PROCEDURE public.sp_buat_reservasi_baru(
    IN p_kode_booking VARCHAR,
    IN p_nama_tamu VARCHAR,
    IN p_email_tamu VARCHAR,
    IN p_no_telepon VARCHAR,
    IN p_kota_asal VARCHAR,
    IN p_id_kamar INT,
    IN p_tgl_checkin DATE,
    IN p_tgl_checkout DATE,
    IN p_jumlah_tamu INT,
    IN p_kode_promo VARCHAR,
    IN p_catatan_khusus TEXT,
    IN p_metode_pembayaran VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_tersedia BOOLEAN;
    v_id_tamu INT;
    v_id_voucher INT := NULL;
    v_persen_diskon INT := 0;
    v_maks_diskon NUMERIC(12, 2) := 0;
    v_tarif NUMERIC(12, 2);
    v_malam INT;
    v_subtotal NUMERIC(12, 2);
    v_diskon NUMERIC(12, 2) := 0;
    v_dasar NUMERIC(12, 2);
    v_layanan NUMERIC(12, 2);
    v_ppn NUMERIC(12, 2);
    v_total NUMERIC(12, 2);
    v_id_reservasi INT;
BEGIN
    IF p_tgl_checkin IS NULL OR p_tgl_checkout IS NULL OR p_tgl_checkout <= p_tgl_checkin THEN
        RAISE EXCEPTION 'TANGGAL_TIDAK_VALID: Tanggal check-out harus setelah check-in.';
    END IF;

    v_tersedia := public.sf_cek_ketersediaan_kamar(p_id_kamar, p_tgl_checkin, p_tgl_checkout);
    IF NOT v_tersedia THEN
        RAISE EXCEPTION 'KAMAR_PENUH: Kamar sedang berstatus Terisi, dalam Pemeliharaan, atau sudah dipesan pada tanggal tersebut.';
    END IF;

    SELECT tarif_per_malam INTO v_tarif
    FROM public.kamar
    WHERE id_kamar = p_id_kamar;

    IF v_tarif IS NULL THEN
        RAISE EXCEPTION 'KAMAR_TIDAK_DITEMUKAN: Unit kamar tidak ditemukan.';
    END IF;

    v_malam := (p_tgl_checkout - p_tgl_checkin);
    v_subtotal := ROUND(v_tarif * v_malam, 2);

    IF p_kode_promo IS NOT NULL AND TRIM(p_kode_promo) <> '' THEN
        SELECT id_voucher, persen_diskon, maks_diskon
        INTO v_id_voucher, v_persen_diskon, v_maks_diskon
        FROM public.voucher_promo
        WHERE UPPER(kode_promo) = UPPER(TRIM(p_kode_promo))
          AND is_active = TRUE
          AND berlaku_hingga >= CURRENT_DATE
        LIMIT 1;

        IF v_id_voucher IS NULL THEN
            RAISE EXCEPTION 'VOUCHER_TIDAK_VALID: Kode promo tidak aktif atau kedaluwarsa.';
        END IF;

        v_diskon := ROUND(v_subtotal * (v_persen_diskon / 100.0), 2);
        IF v_maks_diskon > 0 AND v_diskon > v_maks_diskon THEN
            v_diskon := v_maks_diskon;
        END IF;
    END IF;

    v_dasar := v_subtotal - v_diskon;
    v_layanan := ROUND(v_dasar * 0.05, 2);
    v_ppn := ROUND(v_dasar * 0.10, 2);
    v_total := public.sf_hitung_total_tagihan(v_tarif, v_malam, v_persen_diskon, v_maks_diskon);

    INSERT INTO public.tamu (nama_lengkap, email, no_telepon, kota_asal)
    VALUES (p_nama_tamu, LOWER(TRIM(p_email_tamu)), p_no_telepon, COALESCE(NULLIF(TRIM(p_kota_asal), ''), 'Bandar Lampung'))
    ON CONFLICT (email) DO UPDATE SET
        nama_lengkap = EXCLUDED.nama_lengkap,
        no_telepon = EXCLUDED.no_telepon,
        kota_asal = EXCLUDED.kota_asal
    RETURNING id_tamu INTO v_id_tamu;

    INSERT INTO public.reservasi (
        kode_booking, id_tamu, id_kamar, id_voucher,
        tgl_checkin, tgl_checkout, jumlah_malam, jumlah_tamu,
        catatan_khusus, subtotal, potongan_diskon, biaya_layanan,
        pajak_ppn, total_tagihan, status_reservasi
    ) VALUES (
        p_kode_booking, v_id_tamu, p_id_kamar, v_id_voucher,
        p_tgl_checkin, p_tgl_checkout, v_malam, GREATEST(p_jumlah_tamu, 1),
        p_catatan_khusus, v_subtotal, v_diskon, v_layanan,
        v_ppn, v_total, 'Dikonfirmasi'
    )
    RETURNING id_reservasi INTO v_id_reservasi;

    INSERT INTO public.pembayaran (
        id_reservasi, metode_pembayaran, jumlah_bayar, status_pembayaran, nomor_referensi
    ) VALUES (
        v_id_reservasi,
        COALESCE(NULLIF(TRIM(p_metode_pembayaran), ''), 'Transfer Virtual Account (BCA/Mandiri)'),
        v_total,
        'Lunas',
        'PAY-' || p_kode_booking
    );
END;
$$;

CREATE OR REPLACE PROCEDURE public.sp_proses_check_out(
    IN p_id_reservasi INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_kamar INT;
    v_status VARCHAR(30);
BEGIN
    SELECT id_kamar, status_reservasi INTO v_id_kamar, v_status
    FROM public.reservasi
    WHERE id_reservasi = p_id_reservasi;

    IF v_id_kamar IS NULL THEN
        RAISE EXCEPTION 'RESERVASI_TIDAK_DITEMUKAN: ID reservasi tidak ditemukan.';
    END IF;

    IF v_status IN ('Selesai', 'Batal') THEN
        RAISE EXCEPTION 'STATUS_TIDAK_VALID: Reservasi sudah berstatus %.', v_status;
    END IF;

    -- Trigger trg_log_perubahan_reservasi otomatis mengubah kamar ke Pemeliharaan & mencatat Audit Log
    UPDATE public.reservasi
    SET status_reservasi = 'Selesai',
        updated_at = NOW()
    WHERE id_reservasi = p_id_reservasi;
END;
$$;

-- ---------------------------------------------------------------------
-- 6. VIEW MULTI-JOIN (6 TABEL) & ANALITIK SUBQUERY
-- ---------------------------------------------------------------------

CREATE OR REPLACE VIEW public.vw_laporan_reservasi_lengkap AS
SELECT
    r.id_reservasi,
    r.kode_booking,
    t.nama_lengkap AS nama_tamu,
    t.email AS email_tamu,
    t.no_telepon AS telepon_tamu,
    t.kota_asal,
    k.id_kamar,
    k.kode_kamar,
    k.nomor_kamar,
    k.nama_kamar,
    k.status_ketersediaan AS status_kamar,
    kk.kode_kategori,
    kk.nama_kategori,
    COALESCE(vp.kode_promo, '-') AS kode_promo,
    COALESCE(vp.nama_promo, 'Tanpa Promo') AS nama_promo,
    COALESCE(vp.persen_diskon, 0) AS persen_diskon,
    r.tgl_checkin,
    r.tgl_checkout,
    r.jumlah_malam,
    r.jumlah_tamu,
    r.catatan_khusus,
    r.subtotal,
    r.potongan_diskon,
    r.biaya_layanan,
    r.pajak_ppn,
    r.total_tagihan,
    r.status_reservasi,
    COALESCE(p.metode_pembayaran, 'Bayar di Resepsionis') AS metode_pembayaran,
    COALESCE(p.status_pembayaran, 'Belum Lunas') AS status_pembayaran,
    COALESCE(p.nomor_referensi, '-') AS nomor_referensi,
    r.created_at
FROM public.reservasi r
INNER JOIN public.tamu t ON r.id_tamu = t.id_tamu
INNER JOIN public.kamar k ON r.id_kamar = k.id_kamar
INNER JOIN public.kategori_kamar kk ON k.id_kategori = kk.id_kategori
LEFT JOIN public.pembayaran p ON r.id_reservasi = p.id_reservasi
LEFT JOIN public.voucher_promo vp ON r.id_voucher = vp.id_voucher
ORDER BY r.created_at DESC;

-- Contoh Query Scalar Subquery (Kamar di atas rata-rata tarif hotel):
-- SELECT kode_kamar, nomor_kamar, nama_kamar, tarif_per_malam
-- FROM public.kamar
-- WHERE tarif_per_malam > (SELECT AVG(tarif_per_malam) FROM public.kamar)
-- ORDER BY tarif_per_malam DESC;

-- ---------------------------------------------------------------------
-- 7. SEED CONTOH RESERVASI AWAL (OPSIONAL AGAR DASHBOARD LANGSUNG TERISI)
-- ---------------------------------------------------------------------
DO $$
DECLARE
    v_id_kamar INT;
BEGIN
    SELECT id_kamar INTO v_id_kamar
    FROM public.kamar
    WHERE kode_kamar = 'KMR-301'
    LIMIT 1;

    IF v_id_kamar IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.reservasi WHERE kode_booking = 'BRH-882410'
    ) THEN
        CALL public.sp_buat_reservasi_baru(
            'BRH-882410',
            'Dr. Hartono Sasongko',
            'hartono.sasongko@example.com',
            '+62 811-721-9001',
            'Jakarta',
            v_id_kamar,
            (CURRENT_DATE + 1)::DATE,
            (CURRENT_DATE + 3)::DATE,
            2,
            'HILLTOP15',
            'Kamar lantai tertinggi menghadap teluk',
            'Transfer Virtual Account (BCA/Mandiri)'
        );
    END IF;
END $$;

-- ---------------------------------------------------------------------
-- 8. IZIN AKSES SUPABASE API & POOLER (AMAN UNTUK SQL EDITOR & HEIDISQL)
-- ---------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
        GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role, authenticated, anon;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role, authenticated, anon;
        GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role, authenticated, anon;
        GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA public TO service_role, authenticated, anon;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
