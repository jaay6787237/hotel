<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/models/Admin.php';

class AuthController
{
    public static function isHttps(): bool
    {
        if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
            return true;
        }
        if (strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https') {
            return true;
        }
        $origin = strtolower((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));
        if (str_starts_with($origin, 'https://')) {
            return true;
        }
        $referer = strtolower((string) ($_SERVER['HTTP_REFERER'] ?? ''));
        if (str_starts_with($referer, 'https://')) {
            return true;
        }
        $fwdHost = strtolower((string) ($_SERVER['HTTP_X_FORWARDED_HOST'] ?? ''));
        if ($fwdHost !== '' && !str_starts_with($fwdHost, 'localhost') && !str_starts_with($fwdHost, '127.0.0.1')) {
            return true;
        }
        return false;
    }

    private static function sendCookie(string $name, string $value, int $expires): void
    {
        $https = self::isHttps();
        $maxAge = max(0, $expires - time());
        if ($https) {
            $parts = [
                $name . '=' . rawurlencode($value),
                'Expires=' . gmdate('D, d M Y H:i:s \G\M\T', $expires),
                'Max-Age=' . $maxAge,
                'Path=/',
                'Secure',
                'HttpOnly',
                'SameSite=None',
                'Partitioned',
            ];
            header('Set-Cookie: ' . implode('; ', $parts), false);
            return;
        }

        setcookie($name, $value, [
            'expires'  => $expires,
            'path'     => '/',
            'secure'   => false,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }

    public static function setFlash(string $type, string $message): void
    {
        $payload = json_encode(['type' => $type, 'message' => $message], JSON_UNESCAPED_UNICODE);
        if ($payload === false) {
            return;
        }
        $encoded = rtrim(strtr(base64_encode($payload), '+/', '-_'), '=');
        $sig = hash_hmac('sha256', $encoded, Admin::getAppKey());
        self::sendCookie('brh_flash', $encoded . '.' . $sig, time() + 120);
    }

    /**
     * @return array{type: string, message: string}|null
     */
    public static function consumeFlash(): ?array
    {
        $raw = $_COOKIE['brh_flash'] ?? '';
        if ($raw === '' || !str_contains($raw, '.')) {
            return null;
        }

        // Hapus cookie flash agar tampil sekali saja
        self::sendCookie('brh_flash', '', time() - 3600);

        [$encoded, $sig] = explode('.', $raw, 2);
        $expected = hash_hmac('sha256', $encoded, Admin::getAppKey());
        if (!hash_equals($expected, $sig)) {
            return null;
        }

        $padded = strtr($encoded, '-_', '+/');
        $mod = strlen($padded) % 4;
        if ($mod > 0) {
            $padded .= str_repeat('=', 4 - $mod);
        }
        $decoded = base64_decode($padded, true);
        if ($decoded === false) {
            return null;
        }
        $data = json_decode($decoded, true);
        if (!is_array($data) || !isset($data['type'], $data['message'])) {
            return null;
        }
        return [
            'type'    => (string) $data['type'],
            'message' => (string) $data['message'],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getAuthenticatedAdmin(): ?array
    {
        $token = $_COOKIE[Admin::COOKIE_NAME] ?? null;
        return Admin::verifySignedToken(is_string($token) ? $token : null);
    }

    /**
     * @return array<string, mixed>
     */
    public function requireAdmin(): array
    {
        $session = $this->getAuthenticatedAdmin();
        if ($session === null) {
            self::setFlash('error', 'Silakan masuk terlebih dahulu untuk mengakses Dashboard Front Office.');
            header('Location: /admin/login');
            exit;
        }
        return $session;
    }

    public function showLogin(): void
    {
        if ($this->getAuthenticatedAdmin() !== null) {
            header('Location: /admin/dashboard');
            exit;
        }

        $flash = self::consumeFlash();
        $defaultAdminUser = Admin::getConfiguredUsername();
        $isDefaultPassword = Admin::getConfiguredPassword() === 'BukitRandu2026!';
        require dirname(__DIR__) . '/views/admin/login.php';
    }

    public function login(): void
    {
        $username = trim((string) ($_POST['username'] ?? $_POST['email'] ?? ''));
        $password = (string) ($_POST['password'] ?? '');

        if ($username === '' || $password === '') {
            self::setFlash('error', 'Email/Username dan Kata Sandi wajib diisi.');
            header('Location: /admin/login');
            exit;
        }

        if (!Admin::verifyCredentials($username, $password)) {
            self::setFlash('error', 'Kredensial tidak valid. Periksa kembali akun Admin Front Office Anda.');
            header('Location: /admin/login');
            exit;
        }

        $token = Admin::generateSignedToken($username);
        self::sendCookie(Admin::COOKIE_NAME, $token, time() + Admin::SESSION_TTL_SECONDS);

        self::setFlash('success', 'Selamat datang kembali di Portal Operasional Front Office Bukit Randu.');
        header('Location: /admin/dashboard');
        exit;
    }

    public function logout(): void
    {
        self::sendCookie(Admin::COOKIE_NAME, '', time() - 3600);
        self::setFlash('success', 'Anda telah keluar dari sesi Admin dengan aman.');
        header('Location: /admin/login');
        exit;
    }
}
