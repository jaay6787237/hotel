<?php
declare(strict_types=1);

class KamarPenuhException extends \Exception
{
    public function __construct(
        string $message = 'Kamar sedang terisi atau tidak tersedia pada tanggal yang dipilih.',
        int $code = 409,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }
}

class KamarKotorException extends \Exception
{
    public function __construct(
        string $message = 'Check-In ditolak: Unit kamar masih berstatus Pemeliharaan (sedang dibersihkan housekeeping).',
        int $code = 422,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }
}

class VoucherTidakValidException extends \Exception
{
    public function __construct(
        string $message = 'Kode voucher promo tidak ditemukan, tidak aktif, atau sudah kedaluwarsa.',
        int $code = 400,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }
}
