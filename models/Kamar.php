<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/config/DatabaseConfig.php';

class Kamar
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = DatabaseConfig::getInstance()->getConnection();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getAllWithCategory(): array
    {
        $sql = 'SELECT k.*, kk.kode_kategori, kk.nama_kategori, kk.tipe_pemandangan
                FROM public.kamar k
                INNER JOIN public.kategori_kamar kk ON k.id_kategori = kk.id_kategori
                ORDER BY k.nomor_kamar ASC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        foreach ($rows as &$row) {
            $decoded = json_decode((string) ($row['fasilitas'] ?? '[]'), true);
            $row['fasilitas_array'] = is_array($decoded) ? $decoded : [];
        }
        unset($row);

        return $rows;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findById(int $idKamar): ?array
    {
        $sql = 'SELECT k.*, kk.kode_kategori, kk.nama_kategori
                FROM public.kamar k
                INNER JOIN public.kategori_kamar kk ON k.id_kategori = kk.id_kategori
                WHERE k.id_kamar = :id
                LIMIT 1';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':id' => $idKamar]);
        $row = $stmt->fetch();
        if ($row === false) {
            return null;
        }
        $decoded = json_decode((string) ($row['fasilitas'] ?? '[]'), true);
        $row['fasilitas_array'] = is_array($decoded) ? $decoded : [];
        return $row;
    }

    public function cekKetersediaan(int $idKamar, string $tglCheckin, string $tglCheckout): bool
    {
        try {
            $stmt = $this->pdo->prepare(
                'SELECT public.sf_cek_ketersediaan_kamar(:id_kamar, :checkin::date, :checkout::date) AS tersedia'
            );
            $stmt->execute([
                ':id_kamar' => $idKamar,
                ':checkin'  => $tglCheckin,
                ':checkout' => $tglCheckout,
            ]);
            $res = $stmt->fetch();
            return isset($res['tersedia']) && filter_var($res['tersedia'], FILTER_VALIDATE_BOOLEAN);
        } catch (\PDOException $e) {
            if ($e->getCode() !== '42883') {
                throw $e;
            }
            $kStmt = $this->pdo->prepare('SELECT status_ketersediaan FROM public.kamar WHERE id_kamar = :id');
            $kStmt->execute([':id' => $idKamar]);
            $statusKamar = $kStmt->fetchColumn();
            if ($statusKamar === false || $statusKamar === 'Pemeliharaan') {
                return false;
            }
            $bStmt = $this->pdo->prepare(
                "SELECT COUNT(*) FROM public.reservasi
                 WHERE id_kamar = :id_kamar
                   AND status_reservasi NOT IN ('Batal', 'Selesai')
                   AND (tgl_checkin < :checkout::date AND tgl_checkout > :checkin::date)"
            );
            $bStmt->execute([
                ':id_kamar' => $idKamar,
                ':checkin'  => $tglCheckin,
                ':checkout' => $tglCheckout,
            ]);
            return ((int) $bStmt->fetchColumn()) === 0;
        }
    }

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): int
    {
        $sql = 'INSERT INTO public.kamar (
                    kode_kamar, id_kategori, nomor_kamar, nama_kamar, tagline, deskripsi,
                    tarif_per_malam, kapasitas_tamu, luas_m2, tipe_kasur, pemandangan,
                    fasilitas, url_gambar, is_featured, status_ketersediaan
                ) VALUES (
                    :kode_kamar, :id_kategori, :nomor_kamar, :nama_kamar, :tagline, :deskripsi,
                    :tarif, :kapasitas, :luas, :kasur, :pemandangan,
                    :fasilitas, :gambar, :featured, :status
                ) RETURNING id_kamar';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':kode_kamar'  => strtoupper(trim((string) $data['kode_kamar'])),
            ':id_kategori' => (int) $data['id_kategori'],
            ':nomor_kamar' => trim((string) $data['nomor_kamar']),
            ':nama_kamar'  => trim((string) $data['nama_kamar']),
            ':tagline'     => trim((string) ($data['tagline'] ?? 'Kamar panorama eksklusif di puncak Bukit Randu')),
            ':deskripsi'   => trim((string) ($data['deskripsi'] ?? 'Nikmati kenyamanan suite modern dengan pemandangan Bukit Randu dan Teluk Lampung.')),
            ':tarif'       => (float) $data['tarif_per_malam'],
            ':kapasitas'   => (int) ($data['kapasitas_tamu'] ?? 2),
            ':luas'        => (int) ($data['luas_m2'] ?? 65),
            ':kasur'       => trim((string) ($data['tipe_kasur'] ?? 'King Bed')),
            ':pemandangan' => trim((string) ($data['pemandangan'] ?? 'Bukit & Teluk Lampung')),
            ':fasilitas'   => json_encode($data['fasilitas'] ?? ['Wi-Fi Cepat', 'Sarapan Prasmanan', 'Balkon Panorama'], JSON_UNESCAPED_UNICODE),
            ':gambar'      => trim((string) ($data['url_gambar'] ?? '/assets/images/suite_presidential_1794410440213.jpg')),
            ':featured'    => !empty($data['is_featured']) ? 'true' : 'false',
            ':status'      => in_array(($data['status_ketersediaan'] ?? 'Tersedia'), ['Tersedia', 'Terisi', 'Pemeliharaan'], true)
                ? $data['status_ketersediaan']
                : 'Tersedia',
        ]);
        return (int) $stmt->fetchColumn();
    }

    public function updateStatus(int $idKamar, string $status): bool
    {
        if (!in_array($status, ['Tersedia', 'Terisi', 'Pemeliharaan'], true)) {
            throw new \InvalidArgumentException('Status kamar tidak valid.');
        }

        $stmt = $this->pdo->prepare(
            'UPDATE public.kamar SET status_ketersediaan = :status WHERE id_kamar = :id'
        );
        return $stmt->execute([
            ':status' => $status,
            ':id'     => $idKamar,
        ]);
    }

    public function delete(int $idKamar): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM public.kamar WHERE id_kamar = :id');
        return $stmt->execute([':id' => $idKamar]);
    }

    /**
     * Scalar Subquery: Menampilkan kamar dengan tarif di atas rata-rata tarif seluruh hotel
     * @return array<string, mixed>
     */
    public function getAboveAverageTariff(): array
    {
        $avgStmt = $this->pdo->prepare('SELECT ROUND(AVG(tarif_per_malam), 2) AS rata_rata FROM public.kamar');
        $avgStmt->execute();
        $rataRata = (float) ($avgStmt->fetchColumn() ?: 0);

        $sql = 'SELECT k.id_kamar, k.kode_kamar, k.nomor_kamar, k.nama_kamar, k.tarif_per_malam,
                       k.status_ketersediaan, kk.nama_kategori
                FROM public.kamar k
                INNER JOIN public.kategori_kamar kk ON k.id_kategori = kk.id_kategori
                WHERE k.tarif_per_malam > (SELECT AVG(tarif_per_malam) FROM public.kamar)
                ORDER BY k.tarif_per_malam DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();

        return [
            'rata_rata_tarif' => $rataRata,
            'kamar_premium'   => $stmt->fetchAll(),
        ];
    }
}
