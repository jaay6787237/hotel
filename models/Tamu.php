<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/core/abstracts/UserAbstract.php';
require_once dirname(__DIR__) . '/config/DatabaseConfig.php';

class Tamu extends UserAbstract
{
    private PDO $pdo;
    private string $noTelepon;
    private string $kotaAsal;

    public function __construct(
        string $nama = '',
        string $email = '',
        string $noTelepon = '',
        string $kotaAsal = 'Bandar Lampung'
    ) {
        parent::__construct($nama, $email, 'tamu');
        $this->noTelepon = trim($noTelepon);
        $this->kotaAsal = trim($kotaAsal) !== '' ? trim($kotaAsal) : 'Bandar Lampung';
        $this->pdo = DatabaseConfig::getInstance()->getConnection();
    }

    public function getNoTelepon(): string
    {
        return $this->noTelepon;
    }

    public function getKotaAsal(): string
    {
        return $this->kotaAsal;
    }

    public function getIdentitasRingkas(): string
    {
        return sprintf('%s (%s · %s)', $this->nama, $this->kotaAsal, $this->noTelepon);
    }

    public function upsert(): int
    {
        $sql = 'INSERT INTO public.tamu (nama_lengkap, email, no_telepon, kota_asal)
                VALUES (:nama, :email, :telepon, :kota)
                ON CONFLICT (email) DO UPDATE SET
                    nama_lengkap = EXCLUDED.nama_lengkap,
                    no_telepon = EXCLUDED.no_telepon,
                    kota_asal = EXCLUDED.kota_asal
                RETURNING id_tamu';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':nama'    => $this->nama,
            ':email'   => $this->email,
            ':telepon' => $this->noTelepon,
            ':kota'    => $this->kotaAsal,
        ]);
        return (int) $stmt->fetchColumn();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getAll(): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM public.tamu ORDER BY created_at DESC');
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findByEmail(string $email): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM public.tamu WHERE LOWER(email) = LOWER(:email) LIMIT 1');
        $stmt->execute([':email' => trim($email)]);
        $row = $stmt->fetch();
        return $row !== false ? $row : null;
    }
}
