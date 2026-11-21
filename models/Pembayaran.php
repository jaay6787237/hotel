<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/config/DatabaseConfig.php';

class Pembayaran
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = DatabaseConfig::getInstance()->getConnection();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findByReservasiId(int $idReservasi): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM public.pembayaran WHERE id_reservasi = :id LIMIT 1'
        );
        $stmt->execute([':id' => $idReservasi]);
        $row = $stmt->fetch();
        return $row !== false ? $row : null;
    }

    public function getTotalPendapatanLunas(): float
    {
        $stmt = $this->pdo->prepare(
            "SELECT COALESCE(SUM(jumlah_bayar), 0) AS total
             FROM public.pembayaran
             WHERE status_pembayaran = 'Lunas'"
        );
        $stmt->execute();
        return (float) ($stmt->fetchColumn() ?: 0);
    }
}
