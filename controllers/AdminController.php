<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/models/Admin.php';
require_once dirname(__DIR__) . '/models/Kamar.php';
require_once dirname(__DIR__) . '/models/KategoriKamar.php';
require_once dirname(__DIR__) . '/models/Reservasi.php';
require_once dirname(__DIR__) . '/models/LaporanHotel.php';
require_once dirname(__DIR__) . '/core/exceptions/CustomExceptions.php';
require_once __DIR__ . '/AuthController.php';

class AdminController
{
    private AuthController $auth;

    public function __construct()
    {
        $this->auth = new AuthController();
    }

    public function dashboard(): void
    {
        $adminSession = $this->auth->requireAdmin();
        $adminObj = new Admin('Duty Manager', (string) $adminSession['user']);

        $laporanModel = new LaporanHotel();
        $kamarModel = new Kamar();
        $kategoriModel = new KategoriKamar();

        $kpi = $laporanModel->getKpiMetrics();
        $reservations = $laporanModel->getLaporanMultiJoin();
        $rooms = $kamarModel->getAllWithCategory();
        $categories = $kategoriModel->getAll();
        $subqueryAnalytics = $laporanModel->getAnalitikSubquery();
        $auditLogs = $laporanModel->getAuditLogs(20);
        $flash = AuthController::consumeFlash();

        require dirname(__DIR__) . '/views/admin/dashboard.php';
    }

    public function checkIn(): void
    {
        $this->auth->requireAdmin();
        $idReservasi = (int) ($_POST['id_reservasi'] ?? 0);

        try {
            $reservasiModel = new Reservasi();
            $reservasiModel->prosesCheckIn($idReservasi);
            AuthController::setFlash('success', "Check-In reservasi #{$idReservasi} berhasil diproses.");
        } catch (KamarKotorException $e) {
            AuthController::setFlash('error', $e->getMessage());
        } catch (\Throwable $e) {
            AuthController::setFlash('error', 'Gagal memproses Check-In: ' . $e->getMessage());
        }

        header('Location: /admin/dashboard');
        exit;
    }

    public function checkOut(): void
    {
        $this->auth->requireAdmin();
        $idReservasi = (int) ($_POST['id_reservasi'] ?? 0);

        try {
            $reservasiModel = new Reservasi();
            $reservasiModel->prosesCheckOut($idReservasi);
            AuthController::setFlash(
                'success',
                "Check-Out reservasi #{$idReservasi} selesai (Stored Procedure sp_proses_check_out). Kamar kini berstatus Pemeliharaan."
            );
        } catch (\Throwable $e) {
            AuthController::setFlash('error', 'Gagal memproses Check-Out: ' . $e->getMessage());
        }

        header('Location: /admin/dashboard');
        exit;
    }

    public function cancelReservation(): void
    {
        $this->auth->requireAdmin();
        $idReservasi = (int) ($_POST['id_reservasi'] ?? 0);

        try {
            $reservasiModel = new Reservasi();
            $reservasiModel->batalkanReservasi($idReservasi);
            AuthController::setFlash('success', "Reservasi #{$idReservasi} dibatalkan dan dicatat oleh Trigger Audit.");
        } catch (\Throwable $e) {
            AuthController::setFlash('error', 'Gagal membatalkan reservasi: ' . $e->getMessage());
        }

        header('Location: /admin/dashboard');
        exit;
    }

    public function storeRoom(): void
    {
        $this->auth->requireAdmin();

        try {
            $kamarModel = new Kamar();
            $kamarModel->create([
                'kode_kamar'          => $_POST['kode_kamar'] ?? '',
                'id_kategori'         => $_POST['id_kategori'] ?? 1,
                'nomor_kamar'         => $_POST['nomor_kamar'] ?? '',
                'nama_kamar'          => $_POST['nama_kamar'] ?? '',
                'tarif_per_malam'     => $_POST['tarif_per_malam'] ?? 1850000,
                'kapasitas_tamu'      => $_POST['kapasitas_tamu'] ?? 2,
                'luas_m2'             => $_POST['luas_m2'] ?? 65,
                'tipe_kasur'          => $_POST['tipe_kasur'] ?? 'King Bed',
                'pemandangan'         => $_POST['pemandangan'] ?? 'Bukit & Teluk Lampung',
                'url_gambar'          => $_POST['url_gambar'] ?? '/assets/images/suite_presidential_1794410440213.jpg',
                'status_ketersediaan' => $_POST['status_ketersediaan'] ?? 'Tersedia',
                'is_featured'         => !empty($_POST['is_featured']),
            ]);
            AuthController::setFlash('success', 'Unit kamar baru berhasil ditambahkan ke inventaris resort.');
        } catch (\Throwable $e) {
            AuthController::setFlash('error', 'Gagal menambah kamar baru: ' . $e->getMessage());
        }

        header('Location: /admin/dashboard#manajemen-kamar');
        exit;
    }

    public function updateRoomStatus(): void
    {
        $this->auth->requireAdmin();
        $idKamar = (int) ($_POST['id_kamar'] ?? 0);
        $status = (string) ($_POST['status_ketersediaan'] ?? 'Tersedia');

        try {
            $kamarModel = new Kamar();
            $kamarModel->updateStatus($idKamar, $status);
            AuthController::setFlash('success', "Status unit kamar #{$idKamar} diperbarui menjadi '{$status}'.");
        } catch (\Throwable $e) {
            AuthController::setFlash('error', 'Gagal memperbarui status kamar: ' . $e->getMessage());
        }

        header('Location: /admin/dashboard#manajemen-kamar');
        exit;
    }

    public function deleteRoom(): void
    {
        $this->auth->requireAdmin();
        $idKamar = (int) ($_POST['id_kamar'] ?? 0);

        try {
            $kamarModel = new Kamar();
            $kamarModel->delete($idKamar);
            AuthController::setFlash('success', "Unit kamar #{$idKamar} berhasil dihapus.");
        } catch (\Throwable $e) {
            AuthController::setFlash(
                'error',
                'Kamar tidak dapat dihapus karena sudah terikat dengan data riwayat reservasi (Integrity Constraint).'
            );
        }

        header('Location: /admin/dashboard#manajemen-kamar');
        exit;
    }
}
