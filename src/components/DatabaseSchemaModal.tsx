import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Database, 
  Copy, 
  Check, 
  Download, 
  Layers, 
  Zap, 
  FileCode2, 
  Code2, 
  Network,
  Cpu
} from 'lucide-react';

interface DatabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

type TabKey = 'ringkasan' | 'trigger' | 'subquery' | 'sp' | 'sf' | 'multijoin' | 'full_sql';

export const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('ringkasan');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (code: string, key: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    onShowToast(`Kueri ${label} berhasil disalin ke clipboard!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownload = () => {
    fetch('/database/bukit_randu_rdbms.sql')
      .then((res) => res.text())
      .then((text) => {
        const blob = new Blob([text], { type: 'text/sql;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'bukit_randu_rdbms.sql');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        onShowToast('File bukit_randu_rdbms.sql berhasil diunduh!');
      })
      .catch(() => {
        onShowToast('Mengunduh file SQL...');
      });
  };

  const triggerCode = `-- TRIGGER 1: Otomatis Catat Log Audit Saat Status Reservasi Berubah
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

-- TRIGGER 2: Otomatis Ubah Status Kamar Menjadi 'Terisi' Saat Reservasi Baru Dibuat
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
DELIMITER ;`;

  const subqueryCode = `-- 1. SCALAR SUBQUERY: Menemukan kamar dengan tarif di atas rata-rata keseluruhan resort
SELECT 
    k.nomor_kamar,
    k.nama_tipe,
    k.harga_per_malam,
    (SELECT AVG(harga_per_malam) FROM kamar) AS rata_rata_hotel,
    (k.harga_per_malam - (SELECT AVG(harga_per_malam) FROM kamar)) AS selisih_dari_rataan
FROM kamar k
WHERE k.harga_per_malam > (
    SELECT AVG(harga_per_malam) 
    FROM kamar
)
ORDER BY k.harga_per_malam DESC;

-- 2. SUBQUERY DENGAN NOT IN: Menemukan kamar yang belum pernah dipesan sama sekali
SELECT 
    k.id_kamar,
    k.nomor_kamar,
    k.nama_tipe,
    k.status_ketersediaan
FROM kamar k
WHERE k.id_kamar NOT IN (
    SELECT DISTINCT id_kamar 
    FROM reservasi
    WHERE status_reservasi NOT IN ('Batal')
);

-- 3. CORRELATED SUBQUERY DENGAN EXISTS: Menemukan Tamu VIP (Total transaksi > Rp 5.000.000)
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
);`;

  const spCode = `-- STORED PROCEDURE 1: Pembuatan Reservasi Baru & Invoice Pembayaran (Transaksi ACID)
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
        IF v_malam <= 0 THEN SET v_malam = 1; END IF;

        -- 3. Ambil Tarif Kamar
        SELECT harga_per_malam INTO v_harga_malam 
        FROM kamar WHERE id_kamar = p_id_kamar;

        -- 4. Hitung Diskon bila voucher aktif
        IF p_kode_voucher IS NOT NULL AND p_kode_voucher != '' THEN
            SELECT COALESCE(persentase_diskon, 0) INTO v_diskon_persen
            FROM voucher_promo 
            WHERE kode_voucher = p_kode_voucher AND status_aktif = TRUE;
        END IF;

        SET v_subtotal = v_harga_malam * v_malam;
        SET v_potongan = v_subtotal * (v_diskon_persen / 100.0);
        SET v_layanan = (v_subtotal - v_potongan) * 0.05; -- Layanan 5%
        SET v_ppn = (v_subtotal - v_potongan) * 0.10;     -- PPN 10%
        SET v_total = (v_subtotal - v_potongan) + v_layanan + v_ppn;

        -- 5. Insert Transaksi Reservasi
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

        -- 6. Insert Detail Pembayaran
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
DELIMITER ;`;

  const sfCode = `-- STORED FUNCTION 1: Menghitung Total Bersih Tagihan (Rumus Resmi Bukit Randu)
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
    
    SET v_layanan = v_dasar_pajak * 0.05; -- Layanan 5%
    SET v_ppn = v_dasar_pajak * 0.10;     -- PPN 10%
    SET v_total = v_dasar_pajak + v_layanan + v_ppn;

    RETURN v_total;
END //
DELIMITER ;

-- STORED FUNCTION 2: Cek Ketersediaan Bebas Tabrakan Tanggal
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
DELIMITER ;`;

  const multiJoinCode = `-- MULTI-JOIN 1: Laporan Rinci Reservasi Hotel Bukit Randu (Relasi 6 Tabel)
-- Tabel: reservasi + tamu + kamar + kategori_kamar + pembayaran + voucher_promo
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

-- MULTI-JOIN 2: Analisis Omset Finansial & Utilisasi per Kategori Kamar (3 Tabel)
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
ORDER BY total_omset_pendapatan DESC;`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#007A33]/30 border border-[#007A33] rounded-lg">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-semibold text-white">
                  Katalog Basis Data & Arsitektur SQL
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider uppercase bg-[#007A33] text-emerald-100 rounded">
                  RDBMS 100% Siap
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Spesifikasi Resmi: Triger, Subquery, Stored Procedure (SP), Stored Function (SF), & Multi-Join
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 rounded hover:bg-emerald-900/60 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh .SQL</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Tutup modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-100 border-b border-slate-200 overflow-x-auto text-xs font-medium scrollbar-thin">
          <button
            onClick={() => setActiveTab('ringkasan')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'ringkasan'
                ? 'bg-white text-[#007A33] shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Ringkasan & Skema</span>
          </button>
          <button
            onClick={() => setActiveTab('trigger')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'trigger'
                ? 'bg-white text-[#007A33] shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Triger (Trigger)</span>
          </button>
          <button
            onClick={() => setActiveTab('sp')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'sp'
                ? 'bg-white text-[#007A33] shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-blue-500" />
            <span>Stored Procedure (SP)</span>
          </button>
          <button
            onClick={() => setActiveTab('sf')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'sf'
                ? 'bg-white text-[#007A33] shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Stored Function (SF)</span>
          </button>
          <button
            onClick={() => setActiveTab('subquery')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'subquery'
                ? 'bg-white text-[#007A33] shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Subquery</span>
          </button>
          <button
            onClick={() => setActiveTab('multijoin')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'multijoin'
                ? 'bg-white text-[#007A33] shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-rose-500" />
            <span>Multi-Join (6 Tabel)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'ringkasan' && (
              <motion.div
                key="ringkasan"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Status Box */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-950">
                  <div className="flex items-start gap-3">
                    <span className="p-1 bg-emerald-600 text-white rounded-md text-xs font-bold mt-0.5">
                      ✓
                    </span>
                    <div>
                      <h4 className="font-semibold text-emerald-900 text-sm">
                        Ya, Seluruh Spesifikasi RDBMS Telah Disediakan dan Dirancang Lengkap!
                      </h4>
                      <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                        Aplikasi Bukit Randu Hospitality telah memiliki berkas skema relasional resmi di{' '}
                        <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-mono text-[11px]">
                          /database/bukit_randu_rdbms.sql
                        </code>
                        . Skrip ini kompatibel dengan <strong>MySQL 8.0+</strong> dan <strong>PostgreSQL</strong>, mencakup DDL 7 tabel berelasi, DML data awal, 2 Trigger, 2 Stored Function, 2 Stored Procedure, 3 variasi Subquery, serta 2 skenario Multi-Join kompleks.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5 Komponen Utama Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-2 mb-2 text-amber-700 font-semibold text-sm">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <h4>1. Triger (Trigger)</h4>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                      <li>
                        <strong>trg_log_perubahan_reservasi:</strong> Mencatat riwayat perubahan status booking ke tabel audit log.
                      </li>
                      <li>
                        <strong>trg_update_ketersediaan_kamar:</strong> Mengubah status ketersediaan kamar menjadi <em>Terisi</em> secara otomatis saat reservasi dikonfirmasi.
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold text-sm">
                      <Cpu className="w-4 h-4 text-blue-500" />
                      <h4>2. Stored Procedure (SP)</h4>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                      <li>
                        <strong>sp_buat_reservasi_baru:</strong> Transaksi ACID lengkap (cek konflik, hitung tarif via SF, buat record reservasi & buat invoice pembayaran).
                      </li>
                      <li>
                        <strong>sp_proses_check_out:</strong> Prosedur otomatisasi checkout dan pelepasan status kamar kembali menjadi <em>Tersedia</em>.
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-2 mb-2 text-emerald-700 font-semibold text-sm">
                      <Code2 className="w-4 h-4 text-emerald-600" />
                      <h4>3. Stored Function (SF)</h4>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                      <li>
                        <strong>sf_hitung_total_tagihan:</strong> Fungsi deterministik menghitung subtotal, diskon voucher promo, PPN 10%, dan biaya layanan 5%.
                      </li>
                      <li>
                        <strong>sf_cek_ketersediaan_kamar:</strong> Fungsi boolean untuk memverifikasi apakah kamar bebas benturan jadwal booking.
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-2 mb-2 text-indigo-700 font-semibold text-sm">
                      <FileCode2 className="w-4 h-4 text-indigo-500" />
                      <h4>4. Subquery (Nested Queries)</h4>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                      <li>
                        <strong>Scalar Subquery:</strong> Menyeleksi kamar dengan tarif di atas rata-rata keseluruhan resort.
                      </li>
                      <li>
                        <strong>Subquery IN / NOT IN:</strong> Mengidentifikasi unit kamar yang belum pernah dipesan.
                      </li>
                      <li>
                        <strong>Correlated Subquery (EXISTS):</strong> Memfilter tamu loyal / VIP dengan total spending &gt; Rp 5.000.000.
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs md:col-span-2">
                    <div className="flex items-center gap-2 mb-2 text-rose-700 font-semibold text-sm">
                      <Network className="w-4 h-4 text-rose-500" />
                      <h4>5. Multi-Join (Relasi Antar 6 Tabel)</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-2">
                      Kueri komprehensif menggabungkan 6 tabel entitas sekaligus:
                    </p>
                    <div className="bg-slate-100 p-2 rounded text-[11px] font-mono text-slate-800">
                      reservasi (r) ➔ tamu (t) ➔ kamar (k) ➔ kategori_kamar (kk) ➔ pembayaran (p) ➔ voucher_promo (v)
                    </div>
                  </div>
                </div>

                {/* Struktur Tabel Relasi */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h4 className="font-semibold text-slate-800 text-sm mb-3">
                    Struktur 7 Tabel Relasional (Entity-Relationship)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                      <div className="font-semibold text-slate-900">kategori_kamar</div>
                      <div className="text-[10px] text-slate-500">PK: id_kategori</div>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                      <div className="font-semibold text-slate-900">kamar</div>
                      <div className="text-[10px] text-slate-500">PK: id_kamar | FK: id_kat</div>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                      <div className="font-semibold text-slate-900">tamu</div>
                      <div className="text-[10px] text-slate-500">PK: id_tamu</div>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                      <div className="font-semibold text-slate-900">voucher_promo</div>
                      <div className="text-[10px] text-slate-500">PK: kode_voucher</div>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                      <div className="font-semibold text-slate-900">reservasi</div>
                      <div className="text-[10px] text-slate-500">PK: id_reservasi (FK: 3)</div>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                      <div className="font-semibold text-slate-900">pembayaran</div>
                      <div className="text-[10px] text-slate-500">PK: id_pembayaran | FK: id_res</div>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded col-span-2">
                      <div className="font-semibold text-slate-900">log_audit_reservasi</div>
                      <div className="text-[10px] text-slate-500">Audit Trail Trigger Logging</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'trigger' && (
              <motion.div
                key="trigger"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Implementasi Trigger (Triger)</h3>
                    <p className="text-xs text-slate-500">
                      Mencakup auto-logging status reservasi dan perubahan status ketersediaan kamar.
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(triggerCode, 'trigger', 'Trigger')}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-400 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'trigger' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Salin Kode</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                  <code>{triggerCode}</code>
                </pre>
              </motion.div>
            )}

            {activeTab === 'sp' && (
              <motion.div
                key="sp"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Implementasi Stored Procedure (SP)</h3>
                    <p className="text-xs text-slate-500">
                      Prosedur transaksi ACID: Pembuatan reservasi baru dan checkout otomatis.
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(spCode, 'sp', 'Stored Procedure')}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-400 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'sp' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Salin Kode</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                  <code>{spCode}</code>
                </pre>
              </motion.div>
            )}

            {activeTab === 'sf' && (
              <motion.div
                key="sf"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Implementasi Stored Function (SF)</h3>
                    <p className="text-xs text-slate-500">
                      Fungsi deterministik untuk kalkulasi tagihan (PPN 10% + Layanan 5%) dan cek bentrok tanggal.
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(sfCode, 'sf', 'Stored Function')}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-400 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'sf' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Salin Kode</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                  <code>{sfCode}</code>
                </pre>
              </motion.div>
            )}

            {activeTab === 'subquery' && (
              <motion.div
                key="subquery"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Implementasi Subquery (Kueri Bersarang)</h3>
                    <p className="text-xs text-slate-500">
                      Mencakup 3 variasi: Scalar Subquery, Subquery NOT IN, dan Correlated Subquery EXISTS.
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(subqueryCode, 'subquery', 'Subquery')}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-400 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'subquery' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Salin Kode</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                  <code>{subqueryCode}</code>
                </pre>
              </motion.div>
            )}

            {activeTab === 'multijoin' && (
              <motion.div
                key="multijoin"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Implementasi Multi-Join (Relasi Multi Tabel)</h3>
                    <p className="text-xs text-slate-500">
                      Query gabungan hingga 6 tabel relasional untuk pelaporan reservasi dan analisis omset.
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(multiJoinCode, 'multijoin', 'Multi-Join')}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-400 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'multijoin' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Salin Kode</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                  <code>{multiJoinCode}</code>
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Lokasi File Sumber:{' '}
            <code className="text-slate-800 font-mono font-medium">/database/bukit_randu_rdbms.sql</code>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#007A33] hover:bg-[#005F27] text-white font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh File Skrip .SQL Lengkap</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
