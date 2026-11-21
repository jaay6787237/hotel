<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/core/abstracts/TagihanAbstract.php';

class TagihanKamar extends TagihanAbstract
{
    public function getBiayaTambahanKhusus(): float
    {
        return 0.0;
    }

    /**
     * @return array<string, mixed>
     */
    public function cetakKwitansi(): array
    {
        $base = parent::cetakKwitansi();
        $base['tipe_tagihan'] = 'Kamar Standar & Deluxe';
        $base['fasilitas_tambahan'] = 'Sarapan Prasmanan & Akses Infinity Pool';
        return $base;
    }
}
