<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/core/abstracts/UserAbstract.php';
require_once dirname(__DIR__) . '/config/DatabaseConfig.php';

class Admin extends UserAbstract
{
    private string $jabatan;
    private string $departemen;

    public const COOKIE_NAME = 'brh_admin_session';
    public const SESSION_TTL_SECONDS = 43200; // 12 jam

    public function __construct(
        string $nama = 'Front Office Manager',
        string $email = 'admin@bukitrandu.com',
        string $jabatan = 'Duty Manager',
        string $departemen = 'Front Office'
    ) {
        parent::__construct($nama, $email, 'admin');
        $this->jabatan = $jabatan;
        $this->departemen = $departemen;
    }

    public function getJabatan(): string
    {
        return $this->jabatan;
    }

    public function getDepartemen(): string
    {
        return $this->departemen;
    }

    public function getIdentitasRingkas(): string
    {
        return sprintf('%s — %s (%s)', $this->nama, $this->jabatan, $this->departemen);
    }

    public static function getAppKey(): string
    {
        return DatabaseConfig::env('APP_KEY', 'bukit-randu-hospitality-lampung-secret-key-2026-hmac');
    }

    public static function getConfiguredUsername(): string
    {
        return DatabaseConfig::env('ADMIN_USER', 'admin@bukitrandu.com');
    }

    public static function getConfiguredPassword(): string
    {
        return DatabaseConfig::env('ADMIN_PASS', 'BukitRandu2026!');
    }

    public static function verifyCredentials(string $username, string $password): bool
    {
        $expectedUser = self::getConfiguredUsername();
        $expectedPass = self::getConfiguredPassword();

        return hash_equals(strtolower(trim($expectedUser)), strtolower(trim($username)))
            && hash_equals($expectedPass, $password);
    }

    public static function generateSignedToken(string $username): string
    {
        $payload = json_encode([
            'user' => $username,
            'role' => 'admin',
            'exp'  => time() + self::SESSION_TTL_SECONDS,
        ], JSON_THROW_ON_ERROR);

        $encodedPayload = rtrim(strtr(base64_encode($payload), '+/', '-_'), '=');
        $signature = hash_hmac('sha256', $encodedPayload, self::getAppKey());

        return $encodedPayload . '.' . $signature;
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function verifySignedToken(?string $token): ?array
    {
        if ($token === null || $token === '' || !str_contains($token, '.')) {
            return null;
        }

        $parts = explode('.', $token, 2);
        if (count($parts) !== 2) {
            return null;
        }

        [$encodedPayload, $providedSignature] = $parts;
        $expectedSignature = hash_hmac('sha256', $encodedPayload, self::getAppKey());

        if (!hash_equals($expectedSignature, $providedSignature)) {
            return null;
        }

        $padded = strtr($encodedPayload, '-_', '+/');
        $mod = strlen($padded) % 4;
        if ($mod > 0) {
            $padded .= str_repeat('=', 4 - $mod);
        }

        $decoded = base64_decode($padded, true);
        if ($decoded === false) {
            return null;
        }

        $data = json_decode($decoded, true);
        if (!is_array($data) || !isset($data['user'], $data['exp'])) {
            return null;
        }

        if ((int) $data['exp'] < time()) {
            return null;
        }

        return $data;
    }
}
