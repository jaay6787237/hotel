<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/config/DatabaseConfig.php';
require_once dirname(__DIR__) . '/core/exceptions/CustomExceptions.php';
require_once __DIR__ . '/Kamar.php';
require_once __DIR__ . '/VoucherPromo.php';
require_once __DIR__ . '/TagihanKamar.php';
require_once __DIR__ . '/TagihanSuite.php';

class Reservasi
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = DatabaseConfig::getInstance()->getConnection();
    }

    public static function generateKodeBooking(): string
    {
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $suffix = '';
        for ($i = 0; $i < 6; $i++) {
            $suffix .= $chars[random_int(0, strlen($chars) - 1)];
        }
        return 'BRH-' . $suffix;
    }

    /**
     * Membuat reservasi baru dengan validasi OOP + Stored Function + CALL sp_buat_reservasi_baru(...)
     *
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     * @throws KamarPenuhException
     * @throws VoucherTidakValidException
     */
    public function buatReservasiBaru(array $input): array
    {
        $idKamar = (int) ($input['id_kamar'] ?? 0);
        $tglCheckin = trim((string) ($input['tgl_checkin'] ?? ''));
        $tglCheckout = trim((string) ($input['tgl_checkout'] ?? ''));
        $namaTamu = trim((string) ($input['nama_tamu'] ?? ''));
        $emailTamu = trim((string) ($input['email_tamu'] ?? ''));
        $noTelepon = trim((string) ($input['no_telepon'] ?? ''));
        $kotaAsal = trim((string) ($input['kota_asal'] ?? 'Bandar Lampung'));
        $jumlahTamu = max(1, (int) ($input['jumlah_tamu'] ?? 2));
        $kodePromo = strtoupper(trim((string) ($input['kode_promo'] ?? '')));
        $catatan = trim((string) ($input['catatan_khusus'] ?? ''));
        $metodeBayar = trim((string) ($input['metode_pembayaran'] ?? 'Transfer Virtual Account (BCA/Mandiri)'));

        if ($idKamar <= 0 || $tglCheckin === '' || $tglCheckout === '' || $namaTamu === '' || $emailTamu === '' || $noTelepon === '') {
            throw new \InvalidArgumentException('Semua kolom wajib reservasi harus dilengkapi.');
        }

        $d1 = new \DateTimeImmutable($tglCheckin);
        $d2 = new \DateTimeImmutable($tglCheckout);
        if ($d2 <= $d1) {
            throw new \InvalidArgumentException('Tanggal Check-Out harus setelah tanggal Check-In.');
        }
        $jumlahMalam = max(1, (int) $d1->diff($d2)->days);

        $kamarModel = new Kamar();
        $kamar = $kamarModel->findById($idKamar);
        if ($kamar === null) {
            throw new \RuntimeException('Kamar yang dipilih tidak ditemukan.');
        }

        if (!$kamarModel->cekKetersediaan($idKamar, $tglCheckin, $tglCheckout)) {
            throw new KamarPenuhException(
                "Kamar {$kamar['nomor_kamar']} ({$kamar['nama_kamar']}) sedang terisi atau dalam pemeliharaan pada tanggal tersebut."
            );
        }

        $persenDiskon = 0;
        $maksDiskon = 0.0;
        if ($kodePromo !== '') {
            $voucherModel = new VoucherPromo();
            $promo = $voucherModel->validateCode($kodePromo);
            $persenDiskon = (int) $promo['persen_diskon'];
            $maksDiskon = (float) $promo['maks_diskon'];
        }

        $kodeBooking = self::generateKodeBooking();

        // Hitung rincian kwitansi OOP untuk verifikasi silang dengan Stored Function PostgreSQL
        $kodeKat = (string) ($kamar['kode_kategori'] ?? '');
        $tagihanObj = in_array($kodeKat, ['KAT-PRES', 'KAT-VILA'], true)
            ? new TagihanSuite($kodeBooking, (float) $kamar['tarif_per_malam'], $jumlahMalam, $persenDiskon, $maksDiskon)
            : new TagihanKamar($kodeBooking, (float) $kamar['tarif_per_malam'], $jumlahMalam, $persenDiskon, $maksDiskon);
        $kwitansiPreview = $tagihanObj->cetakKwitansi();

        try {
            $sqlCall = 'CALL public.sp_buat_reservasi_baru(
                :kode_booking,
                :nama_tamu,
                :email_tamu,
                :no_telepon,
                :kota_asal,
                :id_kamar,
                :tgl_checkin::date,
                :tgl_checkout::date,
                :jumlah_tamu,
                :kode_promo,
                :catatan_khusus,
                :metode_pembayaran
            )';

            $stmt = $this->pdo->prepare($sqlCall);
            $stmt->execute([
                ':kode_booking'      => $kodeBooking,
                ':nama_tamu'         => $namaTamu,
                ':email_tamu'        => $emailTamu,
                ':no_telepon'        => $noTelepon,
                ':kota_asal'         => $kotaAsal !== '' ? $kotaAsal : 'Bandar Lampung',
                ':id_kamar'          => $idKamar,
                ':tgl_checkin'       => $tglCheckin,
                ':tgl_checkout'      => $tglCheckout,
                ':jumlah_tamu'       => $jumlahTamu,
                ':kode_promo'        => $kodePromo !== '' ? $kodePromo : null,
                ':catatan_khusus'    => $catatan !== '' ? $catatan : null,
                ':metode_pembayaran' => $metodeBayar !== '' ? $metodeBayar : 'Transfer Virtual Account (BCA/Mandiri)',
            ]);
        } catch (\PDOException $e) {
            if ($e->getCode() !== '42883') {
                throw $e;
            }

            $this->pdo->beginTransaction();
            try {
                $idVoucher = null;
                if ($kodePromo !== '') {
                    $vStmt = $this->pdo->prepare('SELECT id_voucher FROM public.voucher_promo WHERE UPPER(kode_promo) = UPPER(:k) LIMIT 1');
                    $vStmt->execute([':k' => $kodePromo]);
                    $vId = $vStmt->fetchColumn();
                    $idVoucher = $vId !== false ? (int) $vId : null;
                }

                $tStmt = $this->pdo->prepare(
                    "INSERT INTO public.tamu (nama_lengkap, email, no_telepon, kota_asal)
                     VALUES (:nama, LOWER(TRIM(:email)), :telp, :kota)
                     ON CONFLICT (email) DO UPDATE SET
                        nama_lengkap = EXCLUDED.nama_lengkap,
                        no_telepon = EXCLUDED.no_telepon,
                        kota_asal = EXCLUDED.kota_asal
                     RETURNING id_tamu"
                );
                $tStmt->execute([
                    ':nama'  => $namaTamu,
                    ':email' => $emailTamu,
                    ':telp'  => $noTelepon,
                    ':kota'  => $kotaAsal !== '' ? $kotaAsal : 'Bandar Lampung',
                ]);
                $idTamu = (int) $tStmt->fetchColumn();

                $rStmt = $this->pdo->prepare(
                    "INSERT INTO public.reservasi (
                        kode_booking, id_tamu, id_kamar, id_voucher,
                        tgl_checkin, tgl_checkout, jumlah_malam, jumlah_tamu,
                        catatan_khusus, subtotal, potongan_diskon, biaya_layanan,
                        pajak_ppn, total_tagihan, status_reservasi
                    ) VALUES (
                        :kode, :tamu, :kamar, :voucher,
                        :checkin::date, :checkout::date, :malam, :jml_tamu,
                        :catatan, :subtotal, :diskon, :layanan,
                        :ppn, :total, 'Dikonfirmasi'
                    ) RETURNING id_reservasi"
                );
                $rStmt->execute([
                    ':kode'     => $kodeBooking,
                    ':tamu'     => $idTamu,
                    ':kamar'    => $idKamar,
                    ':voucher'  => $idVoucher,
                    ':checkin'  => $tglCheckin,
                    ':checkout' => $tglCheckout,
                    ':malam'    => $jumlahMalam,
                    ':jml_tamu' => $jumlahTamu,
                    ':catatan'  => $catatan !== '' ? $catatan : null,
                    ':subtotal' => $kwitansiPreview['subtotal'],
                    ':diskon'   => $kwitansiPreview['potongan_diskon'],
                    ':layanan'  => $kwitansiPreview['biaya_layanan'],
                    ':ppn'      => $kwitansiPreview['pajak_ppn'],
                    ':total'    => $kwitansiPreview['total_tagihan'],
                ]);
                $idReservasi = (int) $rStmt->fetchColumn();

                $pStmt = $this->pdo->prepare(
                    "INSERT INTO public.pembayaran (id_reservasi, metode_pembayaran, jumlah_bayar, status_pembayaran, nomor_referensi)
                     VALUES (:res_id, :metode, :jumlah, 'Lunas', :ref)"
                );
                $pStmt->execute([
                    ':res_id' => $idReservasi,
                    ':metode' => $metodeBayar !== '' ? $metodeBayar : 'Transfer Virtual Account (BCA/Mandiri)',
                    ':jumlah' => $kwitansiPreview['total_tagihan'],
                    ':ref'    => 'PAY-' . $kodeBooking,
                ]);

                $this->pdo->prepare("UPDATE public.kamar SET status_ketersediaan = 'Terisi' WHERE id_kamar = :id")
                    ->execute([':id' => $idKamar]);

                $this->pdo->prepare(
                    "INSERT INTO public.log_audit_reservasi (id_reservasi, kode_booking, status_lama, status_baru, keterangan)
                     VALUES (:res_id, :kode, 'Baru', 'Dikonfirmasi', 'Reservasi baru dibuat dan status kamar otomatis diperbarui menjadi Terisi.')"
                )->execute([':res_id' => $idReservasi, ':kode' => $kodeBooking]);

                $this->pdo->commit();
            } catch (\Throwable $txErr) {
                $this->pdo->rollBack();
                throw $txErr;
            }
        }

        $detail = $this->findByKodeBooking($kodeBooking);
        if ($detail !== null) {
            $detail['tipe_tagihan_oop'] = $kwitansiPreview['tipe_tagihan'];
            return $detail;
        }

        return $kwitansiPreview;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findByKodeBooking(string $kodeBooking): ?array
    {
        try {
            $sql = 'SELECT * FROM public.vw_laporan_reservasi_lengkap WHERE UPPER(kode_booking) = UPPER(:kode) LIMIT 1';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':kode' => trim($kodeBooking)]);
            $row = $stmt->fetch();
            return $row !== false ? $row : null;
        } catch (\PDOException $e) {
            if ($e->getCode() !== '42P01') {
                throw $e;
            }
            $sql = "SELECT
                        r.id_reservasi, r.kode_booking,
                        t.nama_lengkap AS nama_tamu, t.email AS email_tamu, t.no_telepon AS telepon_tamu, t.kota_asal,
                        k.id_kamar, k.kode_kamar, k.nomor_kamar, k.nama_kamar, k.status_ketersediaan AS status_kamar,
                        kk.kode_kategori, kk.nama_kategori,
                        COALESCE(vp.kode_promo, '-') AS kode_promo, COALESCE(vp.nama_promo, 'Tanpa Promo') AS nama_promo, COALESCE(vp.persen_diskon, 0) AS persen_diskon,
                        r.tgl_checkin, r.tgl_checkout, r.jumlah_malam, r.jumlah_tamu, r.catatan_khusus,
                        r.subtotal, r.potongan_diskon, r.biaya_layanan, r.pajak_ppn, r.total_tagihan, r.status_reservasi,
                        COALESCE(p.metode_pembayaran, 'Bayar di Resepsionis') AS metode_pembayaran,
                        COALESCE(p.status_pembayaran, 'Belum Lunas') AS status_pembayaran,
                        COALESCE(p.nomor_referensi, '-') AS nomor_referensi,
                        r.created_at
                    FROM public.reservasi r
                    INNER JOIN public.tamu t ON r.id_tamu = t.id_tamu
                    INNER JOIN public.kamar k ON r.id_kamar = k.id_kamar
                    INNER JOIN public.kategori_kamar kk ON k.id_kategori = kk.id_kategori
                    LEFT JOIN public.pembayaran p ON r.id_reservasi = p.id_reservasi
                    LEFT JOIN public.voucher_promo vp ON r.id_voucher = vp.id_voucher
                    WHERE UPPER(r.kode_booking) = UPPER(:kode)
                    LIMIT 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':kode' => trim($kodeBooking)]);
            $row = $stmt->fetch();
            return $row !== false ? $row : null;
        }
    }

    private function recordAuditIfNoTrigger(int $idReservasi, string $kodeBooking, string $statusLama, string $statusBaru, string $note): void
    {
        $hasTrigger = $this->pdo->query(
            "SELECT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_log_perubahan_reservasi')"
        )->fetchColumn();
        if (!filter_var($hasTrigger, FILTER_VALIDATE_BOOLEAN)) {
            $stmt = $this->pdo->prepare(
                'INSERT INTO public.log_audit_reservasi (id_reservasi, kode_booking, status_lama, status_baru, keterangan)
                 VALUES (:id_res, :kode, :lama, :baru, :ket)'
            );
            $stmt->execute([
                ':id_res' => $idReservasi,
                ':kode'   => $kodeBooking,
                ':lama'   => $statusLama,
                ':baru'   => $statusBaru,
                ':ket'    => $note,
            ]);
        }
    }

    /**
     * @throws KamarKotorException
     */
    public function prosesCheckIn(int $idReservasi): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT r.id_reservasi, r.kode_booking, r.id_kamar, r.status_reservasi, k.nomor_kamar, k.status_ketersediaan
             FROM public.reservasi r
             INNER JOIN public.kamar k ON r.id_kamar = k.id_kamar
             WHERE r.id_reservasi = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $idReservasi]);
        $row = $stmt->fetch();

        if ($row === false) {
            throw new \RuntimeException('Data reservasi tidak ditemukan.');
        }

        if ($row['status_ketersediaan'] === 'Pemeliharaan') {
            throw new KamarKotorException(
                "Check-In ditolak! Kamar {$row['nomor_kamar']} masih berstatus Pemeliharaan (kotor/housekeeping belum selesai)."
            );
        }

        $updRes = $this->pdo->prepare(
            "UPDATE public.reservasi SET status_reservasi = 'Check-In', updated_at = NOW() WHERE id_reservasi = :id"
        );
        $updRes->execute([':id' => $idReservasi]);

        $updKamar = $this->pdo->prepare(
            "UPDATE public.kamar SET status_ketersediaan = 'Terisi' WHERE id_kamar = :id_kamar"
        );
        $ok = $updKamar->execute([':id_kamar' => (int) $row['id_kamar']]);

        $this->recordAuditIfNoTrigger(
            $idReservasi,
            (string) $row['kode_booking'],
            (string) $row['status_reservasi'],
            'Check-In',
            "Tamu melakukan Check-In ke Kamar {$row['nomor_kamar']}."
        );

        return $ok;
    }

    public function prosesCheckOut(int $idReservasi): bool
    {
        try {
            $stmt = $this->pdo->prepare('CALL public.sp_proses_check_out(:id)');
            return $stmt->execute([':id' => $idReservasi]);
        } catch (\PDOException $e) {
            if ($e->getCode() !== '42883') {
                throw $e;
            }

            $q = $this->pdo->prepare('SELECT id_kamar, kode_booking, status_reservasi FROM public.reservasi WHERE id_reservasi = :id LIMIT 1');
            $q->execute([':id' => $idReservasi]);
            $row = $q->fetch();
            if ($row === false) {
                throw new \RuntimeException('Data reservasi tidak ditemukan.');
            }

            $this->pdo->beginTransaction();
            try {
                $this->pdo->prepare("UPDATE public.reservasi SET status_reservasi = 'Selesai', updated_at = NOW() WHERE id_reservasi = :id")
                    ->execute([':id' => $idReservasi]);
                $this->pdo->prepare("UPDATE public.kamar SET status_ketersediaan = 'Pemeliharaan' WHERE id_kamar = :id_kamar")
                    ->execute([':id_kamar' => (int) $row['id_kamar']]);
                $this->recordAuditIfNoTrigger(
                    $idReservasi,
                    (string) $row['kode_booking'],
                    (string) $row['status_reservasi'],
                    'Selesai',
                    'Check-Out diproses; kamar masuk status Pemeliharaan untuk pembersihan.'
                );
                $this->pdo->commit();
                return true;
            } catch (\Throwable $txErr) {
                $this->pdo->rollBack();
                throw $txErr;
            }
        }
    }

    public function batalkanReservasi(int $idReservasi): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT id_kamar, kode_booking, status_reservasi FROM public.reservasi WHERE id_reservasi = :id LIMIT 1'
        );
        $stmt->execute([':id' => $idReservasi]);
        $row = $stmt->fetch();

        if ($row === false) {
            throw new \RuntimeException('Data reservasi tidak ditemukan.');
        }

        $upd = $this->pdo->prepare(
            "UPDATE public.reservasi SET status_reservasi = 'Batal', updated_at = NOW() WHERE id_reservasi = :id"
        );
        $upd->execute([':id' => $idReservasi]);

        $updKamar = $this->pdo->prepare(
            "UPDATE public.kamar SET status_ketersediaan = 'Tersedia' WHERE id_kamar = :id_kamar AND status_ketersediaan = 'Terisi'"
        );
        $ok = $updKamar->execute([':id_kamar' => (int) $row['id_kamar']]);

        $this->recordAuditIfNoTrigger(
            $idReservasi,
            (string) $row['kode_booking'],
            (string) $row['status_reservasi'],
            'Batal',
            'Reservasi dibatalkan oleh Admin Front Office.'
        );

        return $ok;
    }
}
