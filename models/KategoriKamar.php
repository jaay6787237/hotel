<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/config/DatabaseConfig.php';

class KategoriKamar
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = DatabaseConfig::getInstance()->getConnection();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getAll(): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM public.kategori_kamar ORDER BY id_kategori ASC');
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findById(int $idKategori): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM public.kategori_kamar WHERE id_kategori = :id LIMIT 1');
        $stmt->execute([':id' => $idKategori]);
        $row = $stmt->fetch();
        return $row !== false ? $row : null;
    }
}
