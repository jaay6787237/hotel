<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/core/abstracts/TagihanAbstract.php';

class TagihanSuite extends TagihanAbstract
{
    private float $biayaButlerPrivat;

    public function __construct(
        string $kodeBooking,
        float $tarifPerMalam,
        int $jumlahMalam,
        int $persenDiskon = 0,
        float $maksDiskon = 0.0,
        float $biayaButlerPrivat = 0.0
    ) {
        parent::__construct($kodeBooking, $tarifPerMalam, $jumlahMalam, $persenDiskon, $maksDiskon);
        $this->biayaButlerPrivat = max(0.0, $biayaButlerPrivat);
    }

    public function getBiayaTambahanKhusus(): float
    {
        return round($this->biayaButlerPrivat, 2);
    }

    /**
     * @return array<string, mixed>
     */
    public function cetakKwitansi(): array
    {
        $base = parent::cetakKwitansi();
        $base['tipe_tagihan'] = 'Presidential Suite & Villa Bukit';
        $base['fasilitas_tambahan'] = 'Butler 24 Jam, VIP Lounge & Prioritas Restoran Bukit';
        return $base;
    }
}
