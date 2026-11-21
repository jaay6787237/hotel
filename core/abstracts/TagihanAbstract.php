<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/interfaces/PayableInterface.php';

abstract class TagihanAbstract implements PayableInterface
{
    protected float $tarifPerMalam;
    protected int $jumlahMalam;
    protected int $persenDiskon;
    protected float $maksDiskon;
    protected string $kodeBooking;

    public const TARIF_LAYANAN = 0.05;
    public const TARIF_PPN = 0.10;

    public function __construct(
        string $kodeBooking,
        float $tarifPerMalam,
        int $jumlahMalam,
        int $persenDiskon = 0,
        float $maksDiskon = 0.0
    ) {
        $this->kodeBooking = $kodeBooking;
        $this->tarifPerMalam = max(0.0, $tarifPerMalam);
        $this->jumlahMalam = max(1, $jumlahMalam);
        $this->persenDiskon = max(0, min(100, $persenDiskon));
        $this->maksDiskon = max(0.0, $maksDiskon);
    }

    public function hitungSubtotal(): float
    {
        return round($this->tarifPerMalam * $this->jumlahMalam, 2);
    }

    public function hitungPotonganDiskon(): float
    {
        $potongan = round($this->hitungSubtotal() * ($this->persenDiskon / 100.0), 2);
        if ($this->maksDiskon > 0.0 && $potongan > $this->maksDiskon) {
            return round($this->maksDiskon, 2);
        }
        return $potongan;
    }

    public function hitungDasarPengenaan(): float
    {
        return max(0.0, round($this->hitungSubtotal() - $this->hitungPotonganDiskon(), 2));
    }

    public function hitungBiayaLayanan(): float
    {
        return round($this->hitungDasarPengenaan() * self::TARIF_LAYANAN, 2);
    }

    public function hitungPajakPpn(): float
    {
        return round($this->hitungDasarPengenaan() * self::TARIF_PPN, 2);
    }

    abstract public function getBiayaTambahanKhusus(): float;

    public function hitungTotalBayar(): float
    {
        return round(
            $this->hitungDasarPengenaan()
            + $this->hitungBiayaLayanan()
            + $this->hitungPajakPpn()
            + $this->getBiayaTambahanKhusus(),
            2
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function cetakKwitansi(): array
    {
        return [
            'kode_booking'    => $this->kodeBooking,
            'jumlah_malam'    => $this->jumlahMalam,
            'tarif_per_malam' => $this->tarifPerMalam,
            'subtotal'        => $this->hitungSubtotal(),
            'potongan_diskon' => $this->hitungPotonganDiskon(),
            'biaya_layanan'   => $this->hitungBiayaLayanan(),
            'pajak_ppn'       => $this->hitungPajakPpn(),
            'biaya_tambahan'  => $this->getBiayaTambahanKhusus(),
            'total_tagihan'   => $this->hitungTotalBayar(),
        ];
    }
}
