<?php
declare(strict_types=1);

// Mendukung PHP Built-in Server (php -S 0.0.0.0:3000 -t public public/index.php)
// sekaligus Laragon Apache lokal dengan mod_rewrite (.htaccess).
if (PHP_SAPI === 'cli-server') {
    $urlPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    if (is_string($urlPath) && $urlPath !== '/') {
        $filePath = realpath(__DIR__ . $urlPath);
        if ($filePath !== false && str_starts_with($filePath, __DIR__) && is_file($filePath)) {
            return false;
        }
    }
}

require dirname(__DIR__) . '/api/index.php';
