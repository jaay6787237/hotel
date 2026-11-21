<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/config/DatabaseConfig.php';
require_once __DIR__ . '/Kamar.php';
require_once __DIR__ . '/Pembayaran.php';

class LaporanHotel
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = DatabaseConfig::getInstance()->getConnection();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getLaporanMultiJoin(): array
    {
        try {
            $stmt = $this->pdo->prepare('SELECT * FROM public.vw_laporan_reservasi_lengkap');
            $stmt->execute();
            return $stmt->fetchAll();
        } catch (\PDOException $e) {
            if ($e->getCode() !== '42P01') {
                throw $e;
            }
            $sql = "SELECT
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
                    ORDER BY r.created_at DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll();
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getAuditLogs(int $limit = 15): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM public.log_audit_reservasi ORDER BY waktu_perubahan DESC, id_log DESC LIMIT :limit'
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * @return array<string, mixed>
     */
    public function getKpiMetrics(): array
    {
        $kamarStmt = $this->pdo->prepare(
            "SELECT
                COUNT(*) AS total_kamar,
                COUNT(*) FILTER (WHERE status_ketersediaan = 'Terisi') AS kamar_terisi,
                COUNT(*) FILTER (WHERE status_ketersediaan = 'Tersedia') AS kamar_tersedia,
                COUNT(*) FILTER (WHERE status_ketersediaan = 'Pemeliharaan') AS kamar_pemeliharaan
             FROM public.kamar"
        );
        $kamarStmt->execute();
        $kamarStats = $kamarStmt->fetch() ?: [];

        $totalKamar = max(1, (int) ($kamarStats['total_kamar'] ?? 0));
        $kamarTerisi = (int) ($kamarStats['kamar_terisi'] ?? 0);
        $okupansiPersen = round(($kamarTerisi / $totalKamar) * 100, 1);

        $resStmt = $this->pdo->prepare(
            "SELECT COUNT(*) AS aktif
             FROM public.reservasi
             WHERE status_reservasi IN ('Dikonfirmasi', 'Check-In')"
        );
        $resStmt->execute();
        $reservasiAktif = (int) ($resStmt->fetchColumn() ?: 0);

        $pembayaranModel = new Pembayaran();
        $pendapatanLunas = $pembayaranModel->getTotalPendapatanLunas();

        return [
            'total_kamar'        => (int) ($kamarStats['total_kamar'] ?? 0),
            'kamar_terisi'       => $kamarTerisi,
            'kamar_tersedia'     => (int) ($kamarStats['kamar_tersedia'] ?? 0),
            'kamar_pemeliharaan' => (int) ($kamarStats['kamar_pemeliharaan'] ?? 0),
            'okupansi_persen'    => $okupansiPersen,
            'reservasi_aktif'    => $reservasiAktif,
            'pendapatan_lunas'   => $pendapatanLunas,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function getAnalitikSubquery(): array
    {
        $kamarModel = new Kamar();
        return $kamarModel->getAboveAverageTariff();
    }
}
