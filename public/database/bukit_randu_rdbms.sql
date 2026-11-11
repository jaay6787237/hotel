-- =====================================================================
-- BUKIT RANDU HOSPITALITY - SKEMA BASIS DATA RELASIONAL (RDBMS)
-- Mencakup: DDL, DML, Trigger, Stored Procedure (SP), 
--           Stored Function (SF), Subquery, dan Multi-Join.
-- Kompatibel: PostgreSQL & MySQL 8.0+ (Sesuai Konvensi SQL Standar)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. DDL: PEMBUATAN TABEL DAN RELASI
-- ---------------------------------------------------------------------

-- Tabel 1: Kategori Kamar
CREATE TABLE IF NOT EXISTS kategori_kamar (
    id_kategori VARCHAR(10) PRIMARY KEY,
    nama_kategori VARCHAR(50) NOT NULL,
    deskripsi TEXT,
    kapasitas_maks INT NOT NULL DEFAULT 2,
    pemandangan VARCHAR(50) DEFAULT 'Bukit & Kota'
);

-- Tabel 2: Master Kamar
CREATE TABLE IF NOT EXISTS kamar (
    id_kamar VARCHAR(10) PRIMARY KEY,
    id_kategori VARCHAR(10) NOT NULL,
    nomor_kamar VARCHAR(10) UNIQUE NOT NULL,
    nama_tipe VARCHAR(100) NOT NULL,
    luas_ruangan INT NOT NULL, -- dalam meter persegi (m²)
    tipe_ranjang VARCHAR(50) NOT NULL,
    harga_per_malam DECIMAL(12,2) NOT NULL,
    status_ketersediaan VARCHAR(20) NOT NULL DEFAULT 'Tersedia', -- 'Tersedia', 'Terisi', 'Pemeliharaan'
    CONSTRAINT fk_kamar_kategori FOREIGN KEY (id_kategori) 
        REFERENCES kategori_kamar(id_kategori) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Tabel 3: Master Tamu
CREATE TABLE IF NOT EXISTS tamu (
    id_tamu VARCHAR(10) PRIMARY KEY,
    nama_lengkap VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    nomor_telepon VARCHAR(20) NOT NULL,
    kota_asal VARCHAR(50),
    tanggal_terdaftar TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel 4: Master Voucher Promo
CREATE TABLE IF NOT EXISTS voucher_promo (
    kode_voucher VARCHAR(20) PRIMARY KEY,
    nama_promo VARCHAR(100) NOT NULL,
    persentase_diskon INT NOT NULL CHECK (persentase_diskon BETWEEN 1 AND 100),
    maksimal_diskon DECIMAL(12,2) DEFAULT 1000000.00,
    status_aktif BOOLEAN DEFAULT TRUE,
    berlaku_sampai DATE NOT NULL
);

-- Tabel 5: Transaksi Reservasi
CREATE TABLE IF NOT EXISTS reservasi (
    id_reservasi VARCHAR(16) PRIMARY KEY, -- Format: BRH-XXXXXX
    id_tamu VARCHAR(10) NOT NULL,
    id_kamar VARCHAR(10) NOT NULL,
    kode_voucher VARCHAR(20),
    tanggal_checkin DATE NOT NULL,
    tanggal_checkout DATE NOT NULL,
    jumlah_malam INT NOT NULL,
    jumlah_tamu INT NOT NULL DEFAULT 1,
    catatan_khusus TEXT,
    subtotal_tarif DECIMAL(12,2) NOT NULL,
    potongan_diskon DECIMAL(12,2) DEFAULT 0.00,
    biaya_layanan DECIMAL(12,2) NOT NULL, -- 5%
    pajak_ppn DECIMAL(12,2) NOT NULL,     -- 10%
    total_tagihan DECIMAL(12,2) NOT NULL,
    status_reservasi VARCHAR(20) NOT NULL DEFAULT 'Menunggu Konfirmasi', -- 'Menunggu Konfirmasi', 'Dikonfirmasi', 'Check-In', 'Selesai', 'Batal'
    tanggal_buat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reservasi_tamu FOREIGN KEY (id_tamu) 
        REFERENCES tamu(id_tamu) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_reservasi_kamar FOREIGN KEY (id_kamar) 
        REFERENCES kamar(id_kamar) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_reservasi_voucher FOREIGN KEY (kode_voucher) 
        REFERENCES voucher_promo(kode_voucher) ON UPDATE CASCADE ON DELETE SET NULL
);

-- Tabel 6: Detail Pembayaran
CREATE TABLE IF NOT EXISTS pembayaran (
    id_pembayaran VARCHAR(20) PRIMARY KEY,
    id_reservasi VARCHAR(16) NOT NULL,
    metode_pembayaran VARCHAR(50) NOT NULL, -- 'Transfer Bank (BCA/Mandiri)', 'Kartu Kredit', 'QRIS Instan'
    waktu_bayar TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    jumlah_bayar DECIMAL(12,2) NOT NULL,
    status_pembayaran VARCHAR(20) NOT NULL DEFAULT 'Lunas', -- 'Menunggu', 'Lunas', 'Gagal'
    nomor_referensi VARCHAR(50),
    CONSTRAINT fk_pembayaran_reservasi FOREIGN KEY (id_reservasi) 
        REFERENCES reservasi(id_reservasi) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Tabel 7: Log Audit Aktivitas Reservasi (Untuk Trigger)
CREATE TABLE IF NOT EXISTS log_audit_reservasi (
    id_log SERIAL PRIMARY KEY,
    id_reservasi VARCHAR(16) NOT NULL,
    status_lama VARCHAR(20),
    status_baru VARCHAR(20),
    diubah_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    keterangan VARCHAR(255)
);

-- ---------------------------------------------------------------------
-- 2. DML: DATA AWAL (SEEDING DATA)
-- ---------------------------------------------------------------------

INSERT INTO kategori_kamar (id_kategori, nama_kategori, deskripsi, kapasitas_maks, pemandangan) VALUES
('KAT-DLX', 'Deluxe Room', 'Kamar elegan dengan balkon pribadi menghadap panorama kota', 2, 'Pemandangan Kota'),
('KAT-EXEC', 'Executive Suite', 'Kamar suite mewah dengan ruang santai terpisah dan panorama teluk', 3, 'Kota & Teluk'),
('KAT-PRES', 'Presidential Suite', 'Suite mewah tingkat tinggi dengan jacuzzi pribadi dan pelayan 24 jam', 4, 'Panorama 360 Derajat'),
('KAT-VILA', 'Panoramic Villa', 'Villa pribadi berundak dengan kolam renang infinity dan gazebo asri', 6, 'Perbukitan & Teluk');

INSERT INTO kamar (id_kamar, id_kategori, nomor_kamar, nama_tipe, luas_ruangan, tipe_ranjang, harga_per_malam, status_ketersediaan) VALUES
('KMR-101', 'KAT-DLX', '101', 'Superior Hillside King', 38, 'King Bed 200x200', 1250000.00, 'Tersedia'),
('KMR-102', 'KAT-DLX', '102', 'Deluxe Hillside Twin', 38, 'Twin Single 120x200', 1250000.00, 'Tersedia'),
('KMR-201', 'KAT-EXEC', '201', 'Executive Hilltop Suite', 58, 'King Bed 200x200', 2100000.00, 'Tersedia'),
('KMR-301', 'KAT-PRES', '301', 'Grand Randu Presidential Suite', 115, 'Super King Bed', 4850000.00, 'Tersedia'),
('KMR-401', 'KAT-VILA', '401', 'Two-Bedroom Panoramic Villa', 160, '1 King + 2 Twin', 6200000.00, 'Tersedia');

INSERT INTO voucher_promo (kode_voucher, nama_promo, persentase_diskon, maksimal_diskon, status_aktif, berlaku_sampai) VALUES
('HILLTOP15', 'Diskon Spesial Reservasi Online 15%', 15, 750000.00, TRUE, '2026-12-31'),
('BUKITVIP', 'Eksklusif Member Suite Bukit Randu', 20, 1000000.00, TRUE, '2026-12-31'),
('WEEKEND10', 'Promo Staycation Akhir Pekan', 10, 500000.00, TRUE, '2026-12-31');

INSERT INTO tamu (id_tamu, id_tamu, email, nomor_telepon, kota_asal) VALUES
('TMU-001', 'TMU-001', 'bambang.widodo@perusahaan.co.id', '081288992211', 'Jakarta Selatan')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 3. STORED FUNCTION (SF)
-- ---------------------------------------------------------------------

-- SF 1: Menghitung total tagihan bersih (Termasuk Diskon, Biaya Layanan 5%, dan PPN 10%)
-- Rumus: Total = (Subtotal - Diskon) + Layanan(5%) + PPN(10%)
DELIMITER //
CREATE FUNCTION sf_hitung_total_tagihan(
    p_harga_per_malam DECIMAL(12,2),
    p_jumlah_malam INT,
    p_persen_diskon INT
) 
RETURNS DECIMAL(12,2)
DETERMINISTIC
BEGIN
    DECLARE v_subtotal DECIMAL(12,2);
    DECLARE v_potongan DECIMAL(12,2);
    DECLARE v_dasar_pajak DECIMAL(12,2);
    DECLARE v_layanan DECIMAL(12,2);
    DECLARE v_ppn DECIMAL(12,2);
    DECLARE v_total DECIMAL(12,2);

    SET v_subtotal = p_harga_per_malam * p_jumlah_malam;
    SET v_potongan = v_subtotal * (p_persen_diskon / 100.0);
    SET v_dasar_pajak = v_subtotal - v_potongan;
    
    SET v_layanan = v_dasar_pajak * 0.05; -- Biaya Layanan 5%
    SET v_ppn = v_dasar_pajak * 0.10;     -- PPN 10%
    SET v_total = v_dasar_pajak + v_layanan + v_ppn;

    RETURN v_total;
END //
DELIMITER ;

-- SF 2: Memeriksa ketersediaan kamar pada rentang tanggal checkin dan checkout
DELIMITER //
CREATE FUNCTION sf_cek_ketersediaan_kamar(
    p_id_kamar VARCHAR(10),
    p_tgl_checkin DATE,
    p_tgl_checkout DATE
)
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE v_konflik INT;
    
    -- Hitung jumlah reservasi aktif yang bertabrakan tanggalnya
    SELECT COUNT(*) INTO v_konflik
    FROM reservasi
    WHERE id_kamar = p_id_kamar
      AND status_reservasi NOT IN ('Batal', 'Selesai')
      AND (
          (tanggal_checkin <= p_tgl_checkout AND tanggal_checkout >= p_tgl_checkin)
      );

    IF v_konflik > 0 THEN
        RETURN FALSE;
    ELSE
        RETURN TRUE;
    END IF;
END //
DELIMITER ;

-- ---------------------------------------------------------------------
-- 4. STORED PROCEDURE (SP)
-- ---------------------------------------------------------------------

-- SP 1: Prosedur Pembuatan Reservasi Baru Secara Aman (ACID Transaction)
DELIMITER //
CREATE PROCEDURE sp_buat_reservasi_baru(
    IN p_id_reservasi VARCHAR(16),
    IN p_id_tamu VARCHAR(10),
    IN p_id_kamar VARCHAR(10),
    IN p_kode_voucher VARCHAR(20),
    IN p_tgl_checkin DATE,
    IN p_tgl_checkout DATE,
    IN p_jumlah_tamu INT,
    IN p_catatan TEXT,
    IN p_metode_bayar VARCHAR(50),
    OUT p_status_hasil VARCHAR(50)
)
BEGIN
    DECLARE v_tersedia BOOLEAN;
    DECLARE v_harga_malam DECIMAL(12,2);
    DECLARE v_malam INT;
    DECLARE v_diskon_persen INT DEFAULT 0;
    DECLARE v_subtotal DECIMAL(12,2);
    DECLARE v_potongan DECIMAL(12,2);
    DECLARE v_layanan DECIMAL(12,2);
    DECLARE v_ppn DECIMAL(12,2);
    DECLARE v_total DECIMAL(12,2);

    -- 1. Validasi Ketersediaan Kamar via Stored Function
    SET v_tersedia = sf_cek_ketersediaan_kamar(p_id_kamar, p_tgl_checkin, p_tgl_checkout);
    
    IF v_tersedia = FALSE THEN
        SET p_status_hasil = 'GAGAL: Kamar tidak tersedia pada tanggal tersebut';
    ELSE
        -- 2. Hitung Jumlah Malam
        SET v_malam = DATEDIFF(p_tgl_checkout, p_tgl_checkin);
        IF v_malam <= 0 THEN
            SET v_malam = 1;
        END IF;

        -- 3. Ambil Tarif Kamar
        SELECT harga_per_malam INTO v_harga_malam 
        FROM kamar WHERE id_kamar = p_id_kamar;

        -- 4. Ambil Persentase Diskon Voucher jika ada
        IF p_kode_voucher IS NOT NULL AND p_kode_voucher != '' THEN
            SELECT COALESCE(persentase_diskon, 0) INTO v_diskon_persen
            FROM voucher_promo 
            WHERE kode_voucher = p_kode_voucher AND status_aktif = TRUE;
        END IF;

        -- 5. Hitung Komponen Biaya
        SET v_subtotal = v_harga_malam * v_malam;
        SET v_potongan = v_subtotal * (v_diskon_persen / 100.0);
        SET v_layanan = (v_subtotal - v_potongan) * 0.05;
        SET v_ppn = (v_subtotal - v_potongan) * 0.10;
        SET v_total = (v_subtotal - v_potongan) + v_layanan + v_ppn;

        -- 6. Insert Transaksi Reservasi
        INSERT INTO reservasi (
            id_reservasi, id_tamu, id_kamar, kode_voucher,
            tanggal_checkin, tanggal_checkout, jumlah_malam, jumlah_tamu,
            catatan_khusus, subtotal_tarif, potongan_diskon, biaya_layanan,
            pajak_ppn, total_tagihan, status_reservasi
        ) VALUES (
            p_id_reservasi, p_id_tamu, p_id_kamar, p_kode_voucher,
            p_tgl_checkin, p_tgl_checkout, v_malam, p_jumlah_tamu,
            p_catatan, v_subtotal, v_potongan, v_layanan,
            v_ppn, v_total, 'Dikonfirmasi'
        );

        -- 7. Insert Data Pembayaran
        INSERT INTO pembayaran (
            id_pembayaran, id_reservasi, metode_pembayaran,
            jumlah_bayar, status_pembayaran, nomor_referensi
        ) VALUES (
            CONCAT('PAY-', SUBSTRING(p_id_reservasi, 5)),
            p_id_reservasi, p_metode_bayar,
            v_total, 'Lunas', CONCAT('REF-', UUID_SHORT())
        );

        SET p_status_hasil = 'SUKSES: Reservasi dan Pembayaran Berhasil Dibuat';
    END IF;
END //
DELIMITER ;

-- SP 2: Prosedur Proses Check-Out dan Pelepasan Kamar
DELIMITER //
CREATE PROCEDURE sp_proses_check_out(
    IN p_id_reservasi VARCHAR(16),
    OUT p_pesan VARCHAR(100)
)
BEGIN
    DECLARE v_id_kamar VARCHAR(10);
    DECLARE v_status_sekarang VARCHAR(20);

    SELECT id_kamar, status_reservasi INTO v_id_kamar, v_status_sekarang
    FROM reservasi WHERE id_reservasi = p_id_reservasi;

    IF v_id_kamar IS NULL THEN
        SET p_pesan = 'Reservasi tidak ditemukan.';
    ELSE
        -- Update status reservasi menjadi selesai
        UPDATE reservasi 
        SET status_reservasi = 'Selesai' 
        WHERE id_reservasi = p_id_reservasi;

        -- Kembalikan status kamar menjadi Tersedia
        UPDATE kamar 
        SET status_ketersediaan = 'Tersedia' 
        WHERE id_kamar = v_id_kamar;

        SET p_pesan = CONCAT('Check-Out selesai untuk kamar ', v_id_kamar);
    END IF;
END //
DELIMITER ;

-- ---------------------------------------------------------------------
-- 5. TRIGGER (TRIGER)
-- ---------------------------------------------------------------------

-- Trigger 1: Otomatis Catat Log Audit Saat Status Reservasi Berubah
DELIMITER //
CREATE TRIGGER trg_log_perubahan_reservasi
AFTER UPDATE ON reservasi
FOR EACH ROW
BEGIN
    IF OLD.status_reservasi <> NEW.status_reservasi THEN
        INSERT INTO log_audit_reservasi (
            id_reservasi, status_lama, status_baru, diubah_pada, keterangan
        ) VALUES (
            NEW.id_reservasi,
            OLD.status_reservasi,
            NEW.status_reservasi,
            NOW(),
            CONCAT('Status berubah dari ', OLD.status_reservasi, ' menjadi ', NEW.status_reservasi)
        );
    END IF;
END //
DELIMITER ;

-- Trigger 2: Otomatis Ubah Status Kamar Menjadi 'Terisi' Saat Reservasi Baru Dibuat
DELIMITER //
CREATE TRIGGER trg_update_ketersediaan_kamar
AFTER INSERT ON reservasi
FOR EACH ROW
BEGIN
    IF NEW.status_reservasi IN ('Dikonfirmasi', 'Check-In') THEN
        UPDATE kamar 
        SET status_ketersediaan = 'Terisi'
        WHERE id_kamar = NEW.id_kamar;
    END IF;
END //
DELIMITER ;

-- ---------------------------------------------------------------------
-- 6. MULTI-JOIN (JOIN 3 HINGGA 6 TABEL)
-- ---------------------------------------------------------------------

-- Query Multi-Join 1: Laporan Lengkap Riwayat Reservasi (6 Tabel)
-- Menggabungkan: reservasi + tamu + kamar + kategori_kamar + pembayaran + voucher_promo
SELECT 
    r.id_reservasi AS kode_booking,
    t.nama_lengkap AS nama_tamu,
    t.nomor_telepon,
    kk.nama_kategori,
    k.nomor_kamar,
    k.nama_tipe,
    r.tanggal_checkin,
    r.tanggal_checkout,
    r.jumlah_malam,
    COALESCE(v.nama_promo, 'Tanpa Promo') AS promo_digunakan,
    r.subtotal_tarif,
    r.potongan_diskon,
    r.biaya_layanan,
    r.pajak_ppn,
    r.total_tagihan,
    p.metode_pembayaran,
    p.status_pembayaran,
    r.status_reservasi
FROM reservasi r
INNER JOIN tamu t ON r.id_tamu = t.id_tamu
INNER JOIN kamar k ON r.id_kamar = k.id_kamar
INNER JOIN kategori_kamar kk ON k.id_kategori = kk.id_kategori
INNER JOIN pembayaran p ON r.id_reservasi = p.id_reservasi
LEFT JOIN voucher_promo v ON r.kode_voucher = v.kode_voucher
ORDER BY r.tanggal_buat DESC;

-- Query Multi-Join 2: Analisis Total Pendapatan dan Okupansi per Kategori Kamar (3 Tabel)
SELECT 
    kk.nama_kategori,
    COUNT(k.id_kamar) AS total_unit_kamar,
    COUNT(r.id_reservasi) AS total_kali_dipesan,
    COALESCE(SUM(r.total_tagihan), 0) AS total_omset_pendapatan,
    COALESCE(AVG(r.jumlah_malam), 0) AS rata_rata_malam_menginap
FROM kategori_kamar kk
INNER JOIN kamar k ON kk.id_kategori = k.id_kategori
LEFT JOIN reservasi r ON k.id_kamar = r.id_kamar AND r.status_reservasi = 'Selesai'
GROUP BY kk.id_kategori, kk.nama_kategori
ORDER BY total_omset_pendapatan DESC;

-- ---------------------------------------------------------------------
-- 7. SUBQUERY (NESTED, SCALAR, DAN CORRELATED QUERY)
-- ---------------------------------------------------------------------

-- Subquery 1: Scalar Subquery - Menemukan kamar yang harganya di atas rata-rata tarif hotel
SELECT 
    k.nomor_kamar,
    k.nama_tipe,
    k.harga_per_malam,
    (SELECT AVG(harga_per_malam) FROM kamar) AS rata_rata_keseluruhan,
    (k.harga_per_malam - (SELECT AVG(harga_per_malam) FROM kamar)) AS selisih_harga
FROM kamar k
WHERE k.harga_per_malam > (
    SELECT AVG(harga_per_malam) 
    FROM kamar
)
ORDER BY k.harga_per_malam DESC;

-- Subquery 2: Subquery dengan IN / NOT IN - Menemukan kamar yang belum pernah dipesan sama sekali
SELECT 
    k.nomor_kamar,
    k.nama_tipe,
    k.status_ketersediaan
FROM kamar k
WHERE k.id_kamar NOT IN (
    SELECT DISTINCT id_kamar 
    FROM reservasi
    WHERE status_reservasi NOT IN ('Batal')
);

-- Subquery 3: Correlated Subquery dengan EXISTS - Menemukan tamu VIP yang telah membelanjakan total transaksi > Rp 5.000.000
SELECT 
    t.id_tamu,
    t.nama_lengkap,
    t.email,
    t.nomor_telepon
FROM tamu t
WHERE EXISTS (
    SELECT 1 
    FROM reservasi r 
    WHERE r.id_tamu = t.id_tamu 
      AND r.status_reservasi IN ('Dikonfirmasi', 'Selesai')
    GROUP BY r.id_tamu
    HAVING SUM(r.total_tagihan) > 5000000.00
);
