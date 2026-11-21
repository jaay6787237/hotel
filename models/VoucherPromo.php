<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/config/DatabaseConfig.php';
require_once dirname(__DIR__) . '/core/exceptions/CustomExceptions.php';

class VoucherPromo
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = DatabaseConfig::getInstance()->getConnection();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getActivePromos(): array
    {
        $sql = 'SELECT * FROM public.voucher_promo
                WHERE is_active = TRUE AND berlaku_hingga >= CURRENT_DATE
                ORDER BY persen_diskon DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * @return array<string, mixed>
     * @throws VoucherTidakValidException
     */
    public function validateCode(string $kodePromo): array
    {
        $clean = strtoupper(trim($kodePromo));
        if ($clean === '') {
            throw new VoucherTidakValidException('Kode promo tidak boleh kosong.');
        }

        $sql = 'SELECT * FROM public.voucher_promo
                WHERE UPPER(kode_promo) = :kode
                  AND is_active = TRUE
                  AND berlaku_hingga >= CURRENT_DATE
                LIMIT 1';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':kode' => $clean]);
        $promo = $stmt->fetch();

        if ($promo === false) {
            throw new VoucherTidakValidException("Kode promo '{$clean}' tidak valid, nonaktif, atau sudah kedaluwarsa.");
        }

        return $promo;
    }
}
