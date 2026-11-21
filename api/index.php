<?php
declare(strict_types=1);

date_default_timezone_set('Asia/Jakarta');

$rootDir = dirname(__DIR__);
require_once $rootDir . '/config/DatabaseConfig.php';
require_once $rootDir . '/controllers/PublicController.php';
require_once $rootDir . '/controllers/AuthController.php';
require_once $rootDir . '/controllers/AdminController.php';

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH);
$path = is_string($path) ? rtrim($path, '/') : '';
if ($path === '') {
    $path = '/';
}

// Pastikan file statis di /public (mis. gambar atau PDF) dilayani dengan benar jika masuk ke router
if (
    str_starts_with($path, '/assets/') ||
    $path === '/Dokumentasi_RDBMS_Bukit_Randu.pdf'
) {
    $candidate = realpath($rootDir . '/public' . $path);
    $publicRoot = realpath($rootDir . '/public');
    if ($candidate !== false && $publicRoot !== false && str_starts_with($candidate, $publicRoot) && is_file($candidate)) {
        $ext = strtolower(pathinfo($candidate, PATHINFO_EXTENSION));
        $mimeTypes = [
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png'  => 'image/png',
            'webp' => 'image/webp',
            'svg'  => 'image/svg+xml',
            'pdf'  => 'application/pdf',
            'css'  => 'text/css',
            'js'   => 'application/javascript',
        ];
        header('Content-Type: ' . ($mimeTypes[$ext] ?? 'application/octet-stream'));
        header('Content-Length: ' . filesize($candidate));
        readfile($candidate);
        exit;
    }
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

$publicController = new PublicController();
$authController   = new AuthController();
$adminController  = new AdminController();

switch (true) {
    // Halaman Publik Tamu
    case ($path === '/' && $method === 'GET'):
        $publicController->index();
        break;

    // Endpoint API Reservasi & Promo Publik
    case ($path === '/reservasi/buat' && $method === 'POST'):
    case ($path === '/api/reservations' && $method === 'POST'):
        $publicController->createReservation();
        break;

    case ($path === '/reservasi/cek' && ($method === 'GET' || $method === 'POST')):
    case ($path === '/api/reservations/cek' && $method === 'GET'):
        $publicController->lookupReservation();
        break;

    case ($path === '/promo/cek' && $method === 'GET'):
        $publicController->validatePromo();
        break;

    // Health Check PostgreSQL
    case ($path === '/api/health' && $method === 'GET'):
        header('Content-Type: application/json; charset=utf-8');
        try {
            $pdo = DatabaseConfig::getInstance()->getConnection();
            $stmt = $pdo->prepare('SELECT COUNT(*) FROM public.kamar');
            $stmt->execute();
            echo json_encode([
                'status'     => 'healthy',
                'runtime'    => 'PHP ' . PHP_VERSION . ' Native OOP MVC',
                'database'   => 'PostgreSQL (PDO PgSQL)',
                'totalKamar' => (int) $stmt->fetchColumn(),
            ], JSON_UNESCAPED_UNICODE);
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 'unhealthy',
                'error'  => $e->getMessage(),
            ], JSON_UNESCAPED_UNICODE);
        }
        break;

    // Rute Autentikasi Admin (Stateless Signed HTTP-Only Cookie)
    case (($path === '/admin/login' || $path === '/login') && $method === 'GET'):
        $authController->showLogin();
        break;

    case ($path === '/masuk' && $method === 'GET'):
        header('Location: /admin/login');
        exit;

    case (($path === '/admin/login' || $path === '/login') && $method === 'POST'):
        $authController->login();
        break;

    case (($path === '/admin/logout' || $path === '/logout') && ($method === 'POST' || $method === 'GET')):
        $authController->logout();
        break;

    // Rute Dashboard Operasional Front Office Admin
    case ($path === '/admin' && $method === 'GET'):
    case ($path === '/admin/dashboard' && $method === 'GET'):
        $adminController->dashboard();
        break;

    case ($path === '/admin/reservasi/checkin' && $method === 'POST'):
        $adminController->checkIn();
        break;

    case ($path === '/admin/reservasi/checkout' && $method === 'POST'):
        $adminController->checkOut();
        break;

    case ($path === '/admin/reservasi/batal' && $method === 'POST'):
        $adminController->cancelReservation();
        break;

    case ($path === '/admin/kamar/tambah' && $method === 'POST'):
        $adminController->storeRoom();
        break;

    case ($path === '/admin/kamar/status' && $method === 'POST'):
        $adminController->updateRoomStatus();
        break;

    case ($path === '/admin/kamar/hapus' && $method === 'POST'):
        $adminController->deleteRoom();
        break;

    default:
        http_response_code(404);
        echo '<!doctype html><html lang="id"><head><meta charset="utf-8"><title>404 — Halaman Tidak Ditemukan</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#F8FAFC] text-[#0F1F17] min-h-screen flex items-center justify-center p-6"><div class="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 text-center shadow-lg"><p class="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">Bukit Randu Hospitality</p><h1 class="text-3xl font-bold mt-2">404</h1><p class="text-sm text-slate-600 mt-2">Halaman yang Anda cari tidak tersedia.</p><a href="/" class="inline-block mt-6 px-5 py-2.5 bg-[#007A33] text-white text-xs font-semibold uppercase tracking-wider rounded">Kembali ke Beranda</a></div></body></html>';
        break;
}
