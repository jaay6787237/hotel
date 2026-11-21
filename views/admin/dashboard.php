<?php
declare(strict_types=1);

/** @var Admin $adminObj */
/** @var array<string, mixed> $kpi */
/** @var array<int, array<string, mixed>> $reservations */
/** @var array<int, array<string, mixed>> $rooms */
/** @var array<int, array<string, mixed>> $categories */
/** @var array<string, mixed> $subqueryAnalytics */
/** @var array<int, array<string, mixed>> $auditLogs */
/** @var array{type: string, message: string}|null $flash */

$e = static fn (mixed $v): string => htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');
$rupiah = static fn (float|int|string $n): string => 'IDR ' . number_format((float) $n, 0, ',', '.');
?>
<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard Front Office | Bukit Randu Hospitality</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600&family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            serif: ['"Playfair Display"', 'Georgia', 'serif'],
            sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          },
        },
      },
    };
  </script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8FAFC; color: #0F1F17; }
    h1, h2, h3, .font-serif { font-family: 'Playfair Display', Georgia, serif; }
    .tabular-nums { font-variant-numeric: tabular-nums; }
  </style>
</head>
<body class="min-h-screen bg-[#F8FAFC] text-[#0F1F17]">

  <!-- TOP HEADER -->
  <header class="sticky top-0 z-40 bg-[#0F1F17] text-white border-b border-white/10 shadow-md">
    <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
      <div class="flex items-center gap-3 sm:gap-4 min-w-0">
        <a href="/" class="text-base sm:text-xl font-serif font-bold tracking-tight text-white hover:text-[#D4AF37] transition-colors truncate min-w-0">
          Bukit Randu <span class="hidden sm:inline text-[11px] font-sans uppercase tracking-widest text-[#D4AF37] ml-1">Front Office</span>
        </a>
        <span class="hidden md:inline-block text-xs text-slate-300 border-l border-white/15 pl-4 truncate">
          <?= $e($adminObj->getIdentitasRingkas()) ?>
        </span>
      </div>

      <div class="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <a href="/" class="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium text-slate-200 hover:text-white border border-white/20 rounded-md transition-colors whitespace-nowrap shrink-0">
          <span class="hidden sm:inline">Lihat </span>Web Tamu
        </a>
        <form method="POST" action="/admin/logout" class="m-0">
          <button type="submit" class="px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wider bg-red-600/90 hover:bg-red-600 text-white rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0">
            Keluar
          </button>
        </form>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <?php if ($flash !== null): ?>
      <div class="p-4 rounded-xl border text-sm font-medium shadow-xs <?= $flash['type'] === 'error' ? 'bg-red-50 border-red-300 text-red-800' : 'bg-emerald-50 border-emerald-300 text-[#005A2B]' ?>">
        <?= $e($flash['message']) ?>
      </div>
    <?php endif; ?>

    <!-- 4 KARTU METRIK KPI -->
    <section aria-label="Metrik Utama Operasional">
      <div class="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <span class="text-xs font-semibold uppercase tracking-widest text-[#007A33]">Ringkasan Operasional Real-Time</span>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-[#0F1F17]">Dashboard Front Office Resor</h1>
        </div>
        <span class="text-xs text-slate-500">Terhubung langsung ke PostgreSQL (Supabase PDO)</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Tingkat Okupansi Kamar</span>
          <div class="text-3xl font-serif font-bold text-[#007A33] mt-2 tabular-nums"><?= $e($kpi['okupansi_persen']) ?>%</div>
          <p class="text-xs text-slate-500 mt-1"><?= (int) $kpi['kamar_terisi'] ?> dari <?= (int) $kpi['total_kamar'] ?> unit berstatus Terisi</p>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Reservasi &amp; Check-In Aktif</span>
          <div class="text-3xl font-serif font-bold text-[#0F1F17] mt-2 tabular-nums"><?= (int) $kpi['reservasi_aktif'] ?></div>
          <p class="text-xs text-slate-500 mt-1">Status Dikonfirmasi &amp; Check-In berjalan</p>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Total Pendapatan Lunas</span>
          <div class="text-2xl font-serif font-bold text-[#005A2B] mt-2 tabular-nums"><?= $rupiah($kpi['pendapatan_lunas']) ?></div>
          <p class="text-xs text-slate-500 mt-1">Akumulasi tabel pembayaran berstatus Lunas</p>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Kamar Pemeliharaan</span>
          <div class="text-3xl font-serif font-bold text-[#D4AF37] mt-2 tabular-nums"><?= (int) $kpi['kamar_pemeliharaan'] ?></div>
          <p class="text-xs text-slate-500 mt-1">Menunggu pembersihan housekeeping pasca Check-Out</p>
        </div>
      </div>
    </section>

    <!-- TABEL MANAJEMEN RESERVASI (MULTI-JOIN 6 TABEL) -->
    <section class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="px-4 sm:px-6 py-4 bg-[#F8FAFC] border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span class="text-[11px] font-semibold uppercase tracking-wider text-[#007A33]">View Multi-Join 6 Tabel: vw_laporan_reservasi_lengkap</span>
          <h2 class="text-xl font-serif font-bold text-[#0F1F17]">Manajemen Reservasi &amp; Operasional Tamu</h2>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto" role="group" aria-label="Filter status reservasi">
            <?php foreach (['Semua', 'Dikonfirmasi', 'Check-In', 'Selesai', 'Batal'] as $idx => $statusOpt): ?>
              <button
                type="button"
                data-status-filter="<?= $e($statusOpt) ?>"
                class="res-filter-btn px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 <?= $idx === 0 ? 'bg-white text-[#0F1F17] shadow-xs' : 'text-slate-600 hover:text-slate-900' ?>"
              >
                <?= $e($statusOpt) ?>
              </button>
            <?php endforeach; ?>
          </div>

          <div class="relative">
            <label for="reservation-search" class="sr-only">Cari kode booking, nama tamu, atau kamar</label>
            <input
              id="reservation-search"
              type="search"
              placeholder="Cari kode / tamu / kamar..."
              class="w-full sm:w-56 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#007A33]"
            />
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
            <tr>
              <th class="px-4 py-3 font-semibold">Kode &amp; Tamu</th>
              <th class="px-4 py-3 font-semibold">Kamar &amp; Kategori</th>
              <th class="px-4 py-3 font-semibold">Jadwal &amp; Promo</th>
              <th class="px-4 py-3 font-semibold">Total Tagihan</th>
              <th class="px-4 py-3 font-semibold">Status</th>
              <th class="px-4 py-3 font-semibold text-right">Aksi Front Office</th>
            </tr>
          </thead>
          <tbody id="reservations-tbody" class="divide-y divide-slate-100">
            <?php if ($reservations === []): ?>
              <tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">Belum ada data reservasi.</td></tr>
            <?php else: ?>
              <?php foreach ($reservations as $res): ?>
                <?php
                  $st = (string) $res['status_reservasi'];
                  $badgeCls = match ($st) {
                      'Dikonfirmasi' => 'bg-emerald-50 text-[#007A33] border-emerald-200',
                      'Check-In'     => 'bg-blue-50 text-blue-700 border-blue-200',
                      'Selesai'      => 'bg-slate-100 text-slate-700 border-slate-300',
                      'Batal'        => 'bg-red-50 text-red-700 border-red-200',
                      default        => 'bg-amber-50 text-amber-800 border-amber-200',
                  };
                  $searchBlob = strtolower(trim(implode(' ', [
                      (string) $res['kode_booking'],
                      (string) $res['nama_tamu'],
                      (string) $res['nomor_kamar'],
                      (string) $res['nama_kamar'],
                  ])));
                ?>
                <tr class="reservation-row hover:bg-slate-50/70" data-status="<?= $e($st) ?>" data-search="<?= $e($searchBlob) ?>">
                  <td class="px-4 py-3.5">
                    <div class="font-mono font-bold text-[#007A33]"><?= $e($res['kode_booking']) ?></div>
                    <div class="font-semibold text-slate-900 mt-0.5"><?= $e($res['nama_tamu']) ?></div>
                    <div class="text-[11px] text-slate-500"><?= $e($res['telepon_tamu']) ?></div>
                  </td>
                  <td class="px-4 py-3.5">
                    <div class="font-semibold text-slate-900">Kamar <?= $e($res['nomor_kamar']) ?> — <?= $e($res['nama_kamar']) ?></div>
                    <div class="text-[11px] text-slate-500"><?= $e($res['nama_kategori']) ?> · Status Kamar: <strong class="text-slate-700"><?= $e($res['status_kamar']) ?></strong></div>
                  </td>
                  <td class="px-4 py-3.5">
                    <div class="font-medium text-slate-800 tabular-nums"><?= $e($res['tgl_checkin']) ?> → <?= $e($res['tgl_checkout']) ?> (<?= (int) $res['jumlah_malam'] ?> mlm)</div>
                    <div class="text-[11px] text-slate-500">Promo: <span class="font-mono text-[#007A33]"><?= $e($res['kode_promo']) ?></span></div>
                  </td>
                  <td class="px-4 py-3.5">
                    <div class="font-serif font-bold text-sm text-[#0F1F17] tabular-nums"><?= $rupiah($res['total_tagihan']) ?></div>
                    <div class="text-[11px] text-slate-500"><?= $e($res['status_pembayaran']) ?></div>
                  </td>
                  <td class="px-4 py-3.5">
                    <span class="inline-block px-2.5 py-1 rounded border text-[11px] font-semibold whitespace-nowrap <?= $badgeCls ?>">
                      <?= $e($st) ?>
                    </span>
                  </td>
                  <td class="px-4 py-3.5 text-right">
                    <div class="inline-flex items-center gap-1.5 justify-end flex-wrap">
                      <?php if ($st === 'Dikonfirmasi'): ?>
                        <form method="POST" action="/admin/reservasi/checkin" class="inline">
                          <input type="hidden" name="id_reservasi" value="<?= (int) $res['id_reservasi'] ?>" />
                          <button type="submit" class="px-2.5 py-1.5 bg-[#007A33] hover:bg-[#005A2B] text-white font-semibold rounded text-[11px] cursor-pointer whitespace-nowrap">Check-In</button>
                        </form>
                      <?php endif; ?>
                      <?php if (in_array($st, ['Dikonfirmasi', 'Check-In'], true)): ?>
                        <form method="POST" action="/admin/reservasi/checkout" class="inline">
                          <input type="hidden" name="id_reservasi" value="<?= (int) $res['id_reservasi'] ?>" />
                          <button type="submit" class="px-2.5 py-1.5 bg-[#D4AF37] hover:bg-[#C29B27] text-[#0F1F17] font-semibold rounded text-[11px] cursor-pointer whitespace-nowrap">Check-Out</button>
                        </form>
                        <form method="POST" action="/admin/reservasi/batal" class="inline">
                          <input type="hidden" name="id_reservasi" value="<?= (int) $res['id_reservasi'] ?>" />
                          <button type="submit" class="px-2.5 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 font-semibold rounded text-[11px] cursor-pointer whitespace-nowrap">Batal</button>
                        </form>
                      <?php endif; ?>
                    </div>
                  </td>
                </tr>
              <?php endforeach; ?>
              <tr id="reservations-empty-filter" class="hidden">
                <td colspan="6" class="px-4 py-8 text-center text-slate-500">Tidak ada reservasi yang cocok dengan filter pencarian saat ini.</td>
              </tr>
            <?php endif; ?>
          </tbody>
        </table>
      </div>
    </section>

    <!-- PANEL CRUD MANAJEMEN UNIT KAMAR -->
    <section id="manajemen-kamar" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Form Tambah Kamar -->
      <div class="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-[#D4AF37] block">Inventaris Properti</span>
        <h2 class="text-xl font-serif font-bold text-[#0F1F17] mt-0.5 mb-4">Tambah Unit Kamar Baru</h2>

        <form method="POST" action="/admin/kamar/tambah" class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="kode_kamar" class="font-semibold text-slate-700 block mb-1">Kode Kamar</label>
              <input id="kode_kamar" name="kode_kamar" type="text" required placeholder="KMR-501" class="w-full px-3 py-2 border border-slate-300 rounded focus:border-[#007A33] focus:outline-none uppercase font-mono" />
            </div>
            <div>
              <label for="nomor_kamar" class="font-semibold text-slate-700 block mb-1">Nomor Kamar</label>
              <input id="nomor_kamar" name="nomor_kamar" type="text" required placeholder="501" class="w-full px-3 py-2 border border-slate-300 rounded focus:border-[#007A33] focus:outline-none" />
            </div>
          </div>

          <div>
            <label for="id_kategori" class="font-semibold text-slate-700 block mb-1">Kategori Kamar</label>
            <select id="id_kategori" name="id_kategori" class="w-full px-3 py-2 border border-slate-300 rounded bg-white focus:border-[#007A33] focus:outline-none">
              <?php foreach ($categories as $cat): ?>
                <option value="<?= (int) $cat['id_kategori'] ?>"><?= $e($cat['kode_kategori']) ?> — <?= $e($cat['nama_kategori']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>

          <div>
            <label for="nama_kamar" class="font-semibold text-slate-700 block mb-1">Nama Unit / Suite</label>
            <input id="nama_kamar" name="nama_kamar" type="text" required placeholder="cth. Randu Horizon Cliff Suite" class="w-full px-3 py-2 border border-slate-300 rounded focus:border-[#007A33] focus:outline-none" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="tarif_per_malam" class="font-semibold text-slate-700 block mb-1">Tarif / Malam (IDR)</label>
              <input id="tarif_per_malam" name="tarif_per_malam" type="number" required min="500000" step="50000" value="2450000" class="w-full px-3 py-2 border border-slate-300 rounded focus:border-[#007A33] focus:outline-none" />
            </div>
            <div>
              <label for="kapasitas_tamu" class="font-semibold text-slate-700 block mb-1">Kapasitas Tamu</label>
              <input id="kapasitas_tamu" name="kapasitas_tamu" type="number" required min="1" max="10" value="2" class="w-full px-3 py-2 border border-slate-300 rounded focus:border-[#007A33] focus:outline-none" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="luas_m2" class="font-semibold text-slate-700 block mb-1">Luas (m²)</label>
              <input id="luas_m2" name="luas_m2" type="number" required min="25" value="80" class="w-full px-3 py-2 border border-slate-300 rounded focus:border-[#007A33] focus:outline-none" />
            </div>
            <div>
              <label for="url_gambar" class="font-semibold text-slate-700 block mb-1">Gambar Resor</label>
              <select id="url_gambar" name="url_gambar" class="w-full px-3 py-2 border border-slate-300 rounded bg-white focus:border-[#007A33] focus:outline-none">
                <option value="/assets/images/suite_presidential_1794410440213.jpg">Presidential Suite</option>
                <option value="/assets/images/villa_panoramic_1794410440783.jpg">Panoramic Villa</option>
                <option value="/assets/images/bukit_randu_hero_1794410439341.jpg">Hilltop Infinity</option>
              </select>
            </div>
          </div>

          <button type="submit" class="w-full py-2.5 bg-[#007A33] hover:bg-[#005A2B] text-white font-semibold uppercase tracking-wider rounded cursor-pointer transition-colors">
            Simpan Kamar Baru
          </button>
        </form>
      </div>

      <!-- Tabel Unit Kamar -->
      <div class="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="px-4 sm:px-6 py-4 bg-[#F8FAFC] border-b border-slate-200">
          <h2 class="text-xl font-serif font-bold text-[#0F1F17]">Daftar Unit Kamar &amp; Kontrol Housekeeping</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
              <tr>
                <th class="px-4 py-3 font-semibold">Kamar</th>
                <th class="px-4 py-3 font-semibold">Kategori &amp; Tarif</th>
                <th class="px-4 py-3 font-semibold">Ubah Status</th>
                <th class="px-4 py-3 font-semibold text-right">Hapus</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <?php foreach ($rooms as $rm): ?>
                <tr>
                  <td class="px-4 py-3">
                    <div class="font-mono font-bold text-[#007A33]"><?= $e($rm['kode_kamar']) ?> (No. <?= $e($rm['nomor_kamar']) ?>)</div>
                    <div class="font-semibold text-slate-900"><?= $e($rm['nama_kamar']) ?></div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="text-slate-600"><?= $e($rm['nama_kategori']) ?></div>
                    <div class="font-serif font-bold text-[#0F1F17] tabular-nums"><?= $rupiah($rm['tarif_per_malam']) ?></div>
                  </td>
                  <td class="px-4 py-3">
                    <form method="POST" action="/admin/kamar/status" class="flex items-center gap-2">
                      <input type="hidden" name="id_kamar" value="<?= (int) $rm['id_kamar'] ?>" />
                      <select name="status_ketersediaan" aria-label="Status ketersediaan kamar <?= $e($rm['nomor_kamar']) ?>" class="px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs">
                        <?php foreach (['Tersedia', 'Terisi', 'Pemeliharaan'] as $opt): ?>
                          <option value="<?= $opt ?>" <?= $rm['status_ketersediaan'] === $opt ? 'selected' : '' ?>><?= $opt ?></option>
                        <?php endforeach; ?>
                      </select>
                      <button type="submit" class="px-2.5 py-1.5 bg-[#005A2B] text-white rounded text-[11px] font-semibold cursor-pointer whitespace-nowrap">Simpan</button>
                    </form>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <form method="POST" action="/admin/kamar/hapus" onsubmit="return confirm('Hapus unit kamar ini?');">
                      <input type="hidden" name="id_kamar" value="<?= (int) $rm['id_kamar'] ?>" />
                      <button type="submit" aria-label="Hapus kamar <?= $e($rm['nomor_kamar']) ?>" class="px-2.5 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 rounded text-[11px] font-semibold cursor-pointer whitespace-nowrap">Hapus</button>
                    </form>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ANALITIK SUBQUERY & FEED AUDIT LOG TRIGGER -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
      <!-- Panel Analitik Scalar Subquery -->
      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-[#007A33] block">Scalar Subquery PostgreSQL</span>
        <h2 class="text-xl font-serif font-bold text-[#0F1F17] mt-0.5">Kamar di Atas Rata-Rata Tarif Hotel</h2>
        <p class="text-xs text-slate-600 mt-1 mb-4">
          Rata-rata tarif seluruh properti saat ini: <strong class="text-[#007A33] font-serif text-sm"><?= $rupiah($subqueryAnalytics['rata_rata_tarif'] ?? 0) ?></strong> / malam
        </p>

        <div class="space-y-2.5">
          <?php foreach (($subqueryAnalytics['kamar_premium'] ?? []) as $kp): ?>
            <div class="p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg flex items-center justify-between text-xs">
              <div>
                <span class="font-mono font-bold text-[#007A33]"><?= $e($kp['kode_kamar']) ?></span>
                <strong class="text-slate-900 ml-1"><?= $e($kp['nama_kamar']) ?></strong>
                <span class="text-slate-500 block text-[11px]"><?= $e($kp['nama_kategori']) ?> · Status: <?= $e($kp['status_ketersediaan']) ?></span>
              </div>
              <span class="font-serif font-bold text-sm text-[#0F1F17] tabular-nums"><?= $rupiah($kp['tarif_per_malam']) ?></span>
            </div>
          <?php endforeach; ?>
        </div>
      </div>

      <!-- Feed Riwayat Audit Otomatis dari Trigger -->
      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-[#D4AF37] block">Trigger Otomatis: log_audit_reservasi</span>
        <h2 class="text-xl font-serif font-bold text-[#0F1F17] mt-0.5 mb-4">Feed Riwayat Audit Reservasi</h2>

        <div class="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          <?php if ($auditLogs === []): ?>
            <p class="text-xs text-slate-500">Belum ada catatan aktivitas dari Trigger.</p>
          <?php else: ?>
            <?php foreach ($auditLogs as $log): ?>
              <div class="p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs">
                <div class="flex items-center justify-between">
                  <span class="font-mono font-bold text-[#007A33]"><?= $e($log['kode_booking'] ?: ('RES-' . $log['id_reservasi'])) ?></span>
                  <span class="text-[10px] text-slate-400"><?= $e($log['waktu_perubahan']) ?></span>
                </div>
                <div class="mt-1 font-medium text-slate-800">
                  <?= $e($log['status_lama']) ?> → <span class="text-[#007A33] font-semibold"><?= $e($log['status_baru']) ?></span>
                </div>
                <p class="text-[11px] text-slate-500 mt-0.5"><?= $e($log['keterangan']) ?></p>
              </div>
            <?php endforeach; ?>
          <?php endif; ?>
        </div>
      </div>
    </section>
  </main>

  <script>
    (function () {
      const searchInput = document.getElementById('reservation-search');
      const filterBtns = Array.from(document.querySelectorAll('.res-filter-btn'));
      const rows = Array.from(document.querySelectorAll('.reservation-row'));
      const emptyRow = document.getElementById('reservations-empty-filter');
      let activeStatus = 'Semua';

      function applyReservationFilter() {
        const q = (searchInput?.value || '').trim().toLowerCase();
        let visibleCount = 0;

        rows.forEach((row) => {
          const rowStatus = row.getAttribute('data-status') || '';
          const rowSearch = row.getAttribute('data-search') || '';
          const matchesStatus = activeStatus === 'Semua' || rowStatus === activeStatus;
          const matchesQuery = q === '' || rowSearch.includes(q);
          const show = matchesStatus && matchesQuery;
          row.classList.toggle('hidden', !show);
          if (show) visibleCount++;
        });

        if (emptyRow) {
          emptyRow.classList.toggle('hidden', visibleCount > 0 || rows.length === 0);
        }
      }

      filterBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          activeStatus = btn.getAttribute('data-status-filter') || 'Semua';
          filterBtns.forEach((b) => {
            const isActive = b === btn;
            b.classList.toggle('bg-white', isActive);
            b.classList.toggle('text-[#0F1F17]', isActive);
            b.classList.toggle('shadow-xs', isActive);
            b.classList.toggle('text-slate-600', !isActive);
          });
          applyReservationFilter();
        });
      });

      searchInput?.addEventListener('input', applyReservationFilter);
    })();
  </script>
</body>
</html>
