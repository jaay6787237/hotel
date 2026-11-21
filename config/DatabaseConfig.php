<?php
declare(strict_types=1);

class DatabaseConfig
{
    private static ?DatabaseConfig $instance = null;
    private ?PDO $pdo = null;
    private static bool $envLoaded = false;

    private function __construct()
    {
        self::loadEnv();
        $this->connect();
    }

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection(): PDO
    {
        if ($this->pdo === null) {
            $this->connect();
        }
        return $this->pdo;
    }

    public static function loadEnv(): void
    {
        if (self::$envLoaded) {
            return;
        }
        self::$envLoaded = true;

        $envPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env';
        if (!is_file($envPath) || !is_readable($envPath)) {
            return;
        }

        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return;
        }

        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || str_starts_with($trimmed, '#')) {
                continue;
            }
            $pos = strpos($trimmed, '=');
            if ($pos === false) {
                continue;
            }
            $key = trim(substr($trimmed, 0, $pos));
            $val = trim(substr($trimmed, $pos + 1));
            $val = trim($val, "\"'");
            if ($key !== '' && getenv($key) === false && !isset($_ENV[$key])) {
                putenv("$key=$val");
                $_ENV[$key] = $val;
            }
        }
    }

    public static function env(string $key, string $default = ''): string
    {
        self::loadEnv();
        $val = $_ENV[$key] ?? getenv($key);
        if ($val === false || $val === null || $val === '') {
            return $default;
        }
        return (string) $val;
    }

    private function connect(): void
    {
        $dbHost = self::env('DB_HOST');
        $dbPort = self::env('DB_PORT', '5432');
        $dbName = self::env('DB_NAME', 'postgres');
        $dbUser = self::env('DB_USER', 'postgres');
        $dbPass = self::env('DB_PASS', '');

        // Fallback otomatis untuk pengembangan/pratinjau Cloud SQL lokal bila DB_HOST belum diisi
        if ($dbHost === '' || str_contains($dbHost, 'your-project-id')) {
            $sqlHost = self::env('SQL_HOST');
            $sqlDb   = self::env('SQL_DB_NAME');
            $sqlUser = self::env('SQL_USER');
            $sqlPass = self::env('SQL_PASSWORD');

            if ($sqlHost !== '' && $sqlDb !== '' && $sqlUser !== '') {
                $dbHost = $sqlHost;
                $dbPort = '5432';
                $dbName = $sqlDb;
                $dbUser = $sqlUser;
                $dbPass = $sqlPass;
            } else {
                $dbHost = '127.0.0.1';
            }
        }

        $isUnixSocket = str_starts_with($dbHost, '/');
        $isLocal = $isUnixSocket || in_array($dbHost, ['localhost', '127.0.0.1'], true);
        $sslMode = $isLocal ? 'prefer' : 'require';

        if ($isUnixSocket) {
            $dsn = sprintf('pgsql:host=%s;port=%s;dbname=%s', $dbHost, $dbPort, $dbName);
        } else {
            $dsn = sprintf(
                'pgsql:host=%s;port=%s;dbname=%s;sslmode=%s',
                $dbHost,
                $dbPort,
                $dbName,
                $sslMode
            );
        }

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            // Wajib true agar kompatibel dengan Supabase Transaction Pooler (6543) & Session Pooler (5432)
            PDO::ATTR_EMULATE_PREPARES   => true,
        ];

        $this->pdo = new PDO($dsn, $dbUser, $dbPass, $options);
        $this->ensureSchemaInitialized();
    }

    private function ensureSchemaInitialized(): void
    {
        if ($this->pdo === null) {
            return;
        }

        try {
            $check = $this->pdo->query("SELECT to_regclass('public.kamar') IS NOT NULL");
            $ready = $check !== false && filter_var($check->fetchColumn(), FILTER_VALIDATE_BOOLEAN);
            if ($ready) {
                return;
            }

            $schemaPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'supabase_schema.sql';
            if (!is_file($schemaPath) || !is_readable($schemaPath)) {
                return;
            }

            $sql = file_get_contents($schemaPath);
            if (is_string($sql) && trim($sql) !== '') {
                $this->pdo->exec($sql);
            }
        } catch (\Throwable $e) {
            // Pada Cloud SQL dengan user non-owner, DDL dikelola oleh migrasi skema.
        }
    }

    private function __clone()
    {
    }

    public function __wakeup(): void
    {
        throw new \RuntimeException('Singleton DatabaseConfig tidak boleh di-unserialize.');
    }
}
