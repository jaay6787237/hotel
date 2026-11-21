<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/models/Kamar.php';
require_once dirname(__DIR__) . '/models/VoucherPromo.php';
require_once dirname(__DIR__) . '/models/Reservasi.php';
require_once dirname(__DIR__) . '/core/exceptions/CustomExceptions.php';
require_once __DIR__ . '/AuthController.php';

class PublicController
{
    public function index(): void
    {
        $kamarModel = new Kamar();
        $promoModel = new VoucherPromo();
        $reservasiModel = new Reservasi();

        $rooms = [];
        $promos = [];
        $dbError = null;
        $kwitansi = null;
        $cekKodeError = null;
        $searchedCode = trim((string) ($_GET['cek_kode'] ?? ''));

        try {
            $rooms = $kamarModel->getAllWithCategory();
            $promos = $promoModel->getActivePromos();

            $kwitansiCode = trim((string) ($_GET['kwitansi'] ?? ''));
            if ($kwitansiCode !== '') {
                $kwitansi = $reservasiModel->findByKodeBooking($kwitansiCode);
                if ($kwitansi === null) {
                    $cekKodeError = "Kode booking '{$kwitansiCode}' tidak ditemukan pada sistem reservasi kami.";
                }
            } elseif ($searchedCode !== '') {
                $kwitansi = $reservasiModel->findByKodeBooking($searchedCode);
                if ($kwitansi === null) {
                    $cekKodeError = "Kode booking '{$searchedCode}' tidak ditemukan. Pastikan format seperti BRH-XXXXXX.";
                }
            }
        } catch (\Throwable $e) {
            $dbError = $e->getMessage();
        }

        $flash = AuthController::consumeFlash();
        $today = new \DateTimeImmutable('today');
        $defaultCheckIn = $today->modify('+7 days')->format('Y-m-d');
        $defaultCheckOut = $today->modify('+9 days')->format('Y-m-d');

        require dirname(__DIR__) . '/views/client/landing.php';
    }

    public function createReservation(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        $raw = file_get_contents('php://input');
        $json = is_string($raw) && $raw !== '' ? json_decode($raw, true) : null;
        $input = is_array($json) ? $json : $_POST;

        try {
            $reservasiModel = new Reservasi();
            $result = $reservasiModel->buatReservasiBaru($input);

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Reservasi berhasil dikunci ke basis data PostgreSQL.',
                'data'    => $result,
            ], JSON_UNESCAPED_UNICODE);
        } catch (KamarPenuhException $e) {
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'type'    => 'KamarPenuhException',
                'error'   => $e->getMessage(),
            ], JSON_UNESCAPED_UNICODE);
        } catch (VoucherTidakValidException $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'type'    => 'VoucherTidakValidException',
                'error'   => $e->getMessage(),
            ], JSON_UNESCAPED_UNICODE);
        } catch (\Throwable $e) {
            $msg = $e->getMessage();
            $status = 500;
            if (str_contains($msg, 'KAMAR_PENUH')) {
                $status = 409;
                $msg = 'Kamar sedang terisi atau dalam pemeliharaan pada rentang tanggal tersebut.';
            } elseif (str_contains($msg, 'VOUCHER_TIDAK_VALID')) {
                $status = 400;
                $msg = 'Kode voucher promo tidak valid atau sudah kedaluwarsa.';
            } elseif ($e instanceof \InvalidArgumentException) {
                $status = 400;
            }
            http_response_code($status);
            echo json_encode([
                'success' => false,
                'error'   => $msg,
            ], JSON_UNESCAPED_UNICODE);
        }
    }

    public function lookupReservation(): void
    {
        header('Content-Type: application/json; charset=utf-8');
        $kode = trim((string) ($_GET['kode'] ?? $_POST['kode_booking'] ?? ''));

        if ($kode === '') {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error'   => 'Mohon masukkan kode booking Anda (cth. BRH-882410).',
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        try {
            $reservasiModel = new Reservasi();
            $data = $reservasiModel->findByKodeBooking($kode);
            if ($data === null) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error'   => "Kode booking '{$kode}' tidak ditemukan dalam catatan kami.",
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            echo json_encode([
                'success' => true,
                'data'    => $data,
            ], JSON_UNESCAPED_UNICODE);
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error'   => $e->getMessage(),
            ], JSON_UNESCAPED_UNICODE);
        }
    }

    public function validatePromo(): void
    {
        header('Content-Type: application/json; charset=utf-8');
        $kode = trim((string) ($_GET['kode'] ?? ''));

        try {
            $promoModel = new VoucherPromo();
            $promo = $promoModel->validateCode($kode);
            echo json_encode([
                'success' => true,
                'data'    => $promo,
            ], JSON_UNESCAPED_UNICODE);
        } catch (VoucherTidakValidException $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error'   => $e->getMessage(),
            ], JSON_UNESCAPED_UNICODE);
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error'   => $e->getMessage(),
            ], JSON_UNESCAPED_UNICODE);
        }
    }
}
