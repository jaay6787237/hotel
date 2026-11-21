<?php
declare(strict_types=1);

interface PayableInterface
{
    public function hitungTotalBayar(): float;

    /**
     * @return array<string, mixed>
     */
    public function cetakKwitansi(): array;
}
