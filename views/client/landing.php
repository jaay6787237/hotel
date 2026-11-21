<?php
declare(strict_types=1);

/** @var array<int, array<string, mixed>> $rooms */
/** @var array<int, array<string, mixed>> $promos */
/** @var array<string, mixed>|null $kwitansi */
/** @var string|null $cekKodeError */
/** @var string $searchedCode */
/** @var string|null $dbError */
/** @var array{type: string, message: string}|null $flash */
/** @var string $defaultCheckIn */
/** @var string $defaultCheckOut */

$e = static fn (mixed $v): string => htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');
$rupiah = static fn (float|int|string $n): string => 'IDR ' . number_format((float) $n, 0, ',', '.');

$roomsPayload = array_map(static function (array $r): array {
    $tarifIdr = (float) ($r['tarif_per_malam'] ?? 0);
    return [
        'id_kamar'            => (int) $r['id_kamar'],
        'kode_kamar'          => (string) $r['kode_kamar'],
        'nomor_kamar'         => (string) $r['nomor_kamar'],
        'name'                => (string) $r['nama_kamar'],
        'tagline'             => (string) ($r['tagline'] ?? ''),
        'description'         => (string) ($r['deskripsi'] ?? ''),
        'categoryCode'        => (string) ($r['kode_kategori'] ?? 'KAT-DLX'),
        'categoryName'        => (string) ($r['nama_kategori'] ?? 'Suite Panorama'),
        'basePriceIdr'        => $tarifIdr,
        'basePriceUsd'        => (int) round($tarifIdr / 15500),
        'maxGuests'           => (int) ($r['kapasitas_tamu'] ?? 2),
        'bedType'             => (string) ($r['tipe_kasur'] ?? 'King Bed'),
        'view'                => (string) ($r['pemandangan'] ?? 'Bukit & Teluk'),
        'sqm'                 => (int) ($r['luas_m2'] ?? 65),
        'image'               => (string) ($r['url_gambar'] ?? '/assets/images/suite_presidential_1794410440213.jpg'),
        'amenities'           => is_array($r['fasilitas_array'] ?? null) ? $r['fasilitas_array'] : [],
        'featured'            => filter_var($r['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN),
        'status_ketersediaan' => (string) ($r['status_ketersediaan'] ?? 'Tersedia'),
    ];
}, $rooms);

$promoMap = [];
foreach ($promos as $p) {
    $promoMap[strtoupper((string) $p['kode_promo'])] = [
        'persen' => (int) $p['persen_diskon'],
        'maks'   => (float) $p['maks_diskon'],
        'nama'   => (string) $p['nama_promo'],
    ];
}
if ($promoMap === []) {
    $promoMap = [
        'HILLTOP15' => ['persen' => 15, 'maks' => 1500000, 'nama' => 'Diskon Spesial Reservasi Online 15%'],
        'BUKITVIP'  => ['persen' => 20, 'maks' => 2000000, 'nama' => 'Eksklusif Member Suite Bukit Randu 20%'],
        'WEEKEND10' => ['persen' => 10, 'maks' => 1000000, 'nama' => 'Promo Staycation Akhir Pekan 10%'],
    ];
}

$experiences = [
    [
        'id'          => 'restoran-bukit-randu',
        'title'       => 'Restoran Bukit Randu Fine Dining',
        'subtitle'    => 'Seni Kuliner Istimewa di Atas Gemerlap Kota',
        'description' => 'Nikmati kelezatan hidangan khas Nusantara autentik dan sajian kuliner internasional kontemporer di teras makan terbuka kami. Saat senja tiba, Bandar Lampung bertransformasi menjadi lautan cahaya berkilau di bawah meja santap Anda.',
        'hours'       => 'Setiap Hari: 06:00 - 23:00',
        'highlight'   => 'Menu Ikonik: Seruit Khas Lampung & Wagyu Ribeye',
        'image'       => '/assets/images/dining_hilltop_1794410440842.jpg',
    ],
    [
        'id'          => 'horizon-pool',
        'title'       => 'Cliffside Horizon Infinity Pool',
        'subtitle'    => 'Berenang di Tengah Sejuknya Udara Pegunungan',
        'description' => 'Kolam renang infinity bertingkat dua yang seolah menyatu dengan lembah perbukitan hijau di bawahnya. Nikmati layanan minuman tepi kolam, lounger jati nyaman di bawah payung resor, dan hembusan angin bukit yang menenangkan.',
        'hours'       => 'Setiap Hari: 06:00 - 20:00',
        'highlight'   => 'Sunken Pool Bar & Mocktail Sunset Segar',
        'image'       => '/assets/images/bukit_randu_hero_1794410439341.jpg',
    ],
    [
        'id'          => 'hilltop-spa',
        'title'       => 'Apsara Hillside Spa & Wellness',
        'subtitle'    => 'Relaksasi Tradisional & Aromaterapi Herbal Alami',
        'description' => 'Kembalikan kesegaran raga dan ketenangan jiwa dengan perawatan signature kami yang memadukan rempah herbal khas Lampung, terapi batu hangat vulkanik, dan pijatan relaksasi mendalam diiringi alunan suara alam.',
        'hours'       => 'Setiap Hari: 09:00 - 21:00',
        'highlight'   => 'Kompres Rempah Hangat & Rendam Kaki Kerajaan',
        'image'       => '/assets/images/villa_panoramic_1794410440783.jpg',
    ],
];

$reviews = [
    [
        'guestName'     => 'Dr. Hartono Sasongko',
        'residenceCity' => 'Jakarta',
        'date'          => 'Menginap Oktober 2026',
        'comment'       => 'Pemandangan dari Bukit Randu tiada duanya di Bandar Lampung. Terbangun menyambut kabut pagi di atas lembah dan sarapan dengan latar Teluk Lampung sungguh menenteramkan. Pelayanan staf sangat hangat dan profesional.',
    ],
    [
        'guestName'     => 'Sarah & David Miller',
        'residenceCity' => 'Singapura',
        'date'          => 'Menginap September 2026',
        'comment'       => 'Kami merayakan ulang tahun pernikahan ke-10 di Hillside Villa. Daybed terbuka di teras menghadap hutan tropis sungguh magis. Santap malam di restoran saat senja dengan pemandangan lampu kota sungguh tak terlupakan.',
    ],
    [
        'guestName'     => 'Dewi Kartika & Keluarga',
        'residenceCity' => 'Bandung',
        'date'          => 'Menginap Agustus 2026',
        'comment'       => 'Keramahan yang luar biasa. Anak-anak sangat menyukai kolam renang infinity dan area tamannya sangat asri terawat. Kami sangat mengapresiasi kemudahan proses booking dan layanan penjemputan bandara yang tepat waktu.',
    ],
];
?>
<!doctype html>
<html lang="id" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bukit Randu Hospitality | Holiday Inn Lampung Bukit Randu</title>
  <meta name="description" content="Pengalaman reservasi dan keramahan resor bukit mewah dengan pemandangan panorama Bandar Lampung." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            serif: ['"Playfair Display"', 'Georgia', 'serif'],
            sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
          },
        },
      },
    };
  </script>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #F8FAFC;
      color: #0F1F17;
      -webkit-font-smoothing: antialiased;
    }
    h1, h2, h3, .font-serif {
      font-family: 'Playfair Display', Georgia, serif;
    }
    .tabular-nums {
      font-variant-numeric: tabular-nums;
    }
    @media print {
      body * { visibility: hidden !important; }
      #printable-voucher, #printable-voucher * { visibility: visible !important; }
      #printable-voucher { position: fixed; inset: 0; padding: 24px; background: #fff; }
    }
  </style>
</head>
<body class="min-h-screen bg-[#F8FAFC] text-[#0F1F17] flex flex-col">

  <!-- HEADER / NAVBAR -->
  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
        <a href="/" class="flex items-baseline gap-1.5 text-xl sm:text-2xl lg:text-3xl font-serif font-semibold tracking-tight text-[#0F1F17] hover:text-[#007A33] transition-colors whitespace-nowrap shrink-0">
          Bukit Randu
          <span class="hidden md:inline text-xs font-sans font-medium uppercase tracking-widest text-[#D4AF37] ml-1">Resort &amp; Spa</span>
        </a>

        <nav class="hidden lg:flex items-center gap-7 text-[14px] font-medium text-slate-700" aria-label="Navigasi Utama">
          <a href="#suites" class="hover:text-[#007A33] transition-colors whitespace-nowrap">Suite &amp; Villa</a>
          <a href="#dining" class="hover:text-[#007A33] transition-colors whitespace-nowrap">Restoran Bukit</a>
          <a href="#experiences" class="hover:text-[#007A33] transition-colors whitespace-nowrap">Kebugaran &amp; Spa</a>
          <a href="#cek-booking" class="hover:text-[#007A33] transition-colors whitespace-nowrap">Cek Booking</a>
          <a href="#location" class="hover:text-[#007A33] transition-colors whitespace-nowrap">Lokasi &amp; Kontak</a>
        </nav>

        <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            id="currency-toggle-btn"
            aria-label="Ubah mata uang, saat ini IDR"
            class="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded text-slate-700 border border-slate-200 hover:border-[#007A33] transition-colors bg-white cursor-pointer"
          >
            <svg class="hidden md:block w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <span id="currency-label">IDR</span>
          </button>

          <a
            href="/admin/login"
            id="navbar-login-btn"
            class="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-[#005A2B] border border-[#007A33]/35 bg-emerald-50/80 hover:bg-emerald-100 rounded transition-colors whitespace-nowrap shrink-0"
          >
            <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span class="sm:hidden">Login</span>
            <span class="hidden sm:inline">Login Admin</span>
          </a>

          <button
            type="button"
            id="navbar-book-btn"
            class="hidden sm:inline-flex items-center gap-1.5 px-3 lg:px-5 py-1.5 sm:py-2 lg:py-2.5 text-xs font-semibold tracking-wider uppercase text-white bg-[#007A33] hover:bg-[#005A2B] rounded shadow-xs transition-colors whitespace-nowrap cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>Pesan Kamar</span>
          </button>

          <button
            type="button"
            id="mobile-menu-toggle"
            class="lg:hidden p-1.5 text-slate-700 hover:text-[#007A33] focus:outline-none cursor-pointer"
            aria-label="Buka menu navigasi"
          >
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Tray -->
    <div id="mobile-menu-tray" class="hidden lg:hidden border-t border-slate-200 bg-white px-4 pt-4 pb-6 space-y-3 shadow-lg">
      <a href="#suites" class="mobile-nav-link block py-2 text-base font-medium text-slate-800 hover:text-[#007A33]">Suite &amp; Villa</a>
      <a href="#dining" class="mobile-nav-link block py-2 text-base font-medium text-slate-800 hover:text-[#007A33]">Restoran Bukit</a>
      <a href="#experiences" class="mobile-nav-link block py-2 text-base font-medium text-slate-800 hover:text-[#007A33]">Kebugaran &amp; Spa</a>
      <a href="#cek-booking" class="mobile-nav-link block py-2 text-base font-medium text-slate-800 hover:text-[#007A33]">Cek Booking</a>
      <a href="#location" class="mobile-nav-link block py-2 text-base font-medium text-slate-800 hover:text-[#007A33]">Lokasi &amp; Kontak</a>
      <a href="/admin/login" class="block py-2 text-base font-semibold text-[#007A33]">Login Portal Admin</a>
      <button
        type="button"
        id="mobile-book-btn"
        class="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold tracking-wider uppercase text-white bg-[#007A33] rounded hover:bg-[#005A2B]"
      >
        <span>Pesan Kamar Sekarang</span>
      </button>
    </div>
  </header>

  <main class="flex-1">
    <?php if ($flash !== null): ?>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div class="p-4 rounded-lg border text-sm font-medium flex items-center justify-between <?= $flash['type'] === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-[#005A2B]' ?>">
          <span><?= $e($flash['message']) ?></span>
        </div>
      </div>
    <?php endif; ?>

    <?php if ($dbError !== null): ?>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div class="p-4 rounded-lg border bg-amber-50 border-amber-300 text-amber-900 text-xs">
          <strong>Peringatan Koneksi Basis Data PostgreSQL:</strong> <?= $e($dbError) ?>
        </div>
      </div>
    <?php endif; ?>

    <!-- HERO SECTION -->
    <section class="relative min-h-[620px] lg:min-h-[720px] flex items-center justify-center overflow-hidden bg-[#0F1F17]">
      <div class="absolute inset-0 z-0">
        <img
          src="/assets/images/bukit_randu_hero_1794410439341.jpg"
          alt="Resor Bukit Randu dengan pemandangan panorama Teluk Bandar Lampung"
          class="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-[#0F1F17] via-[#0F1F17]/50 to-[#0F1F17]/30"></div>
        <div class="absolute inset-0 bg-black/20"></div>
      </div>

      <div class="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center">
        <div class="flex flex-wrap items-center justify-center gap-2 mb-6">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[#D4AF37] text-xs font-semibold uppercase tracking-[0.08em]">
            <svg class="w-3.5 h-3.5 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
            <span>Destinasi Ikonik Puncak Bukit Bandar Lampung</span>
          </div>

          <div class="relative group">
            <button
              type="button"
              id="weather-badge-btn"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
            >
              <svg class="w-3.5 h-3.5 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/></svg>
              <span>24°C Sejuk</span>
              <span class="text-white/40">·</span>
              <span>Angin Lembah 11 km/j</span>
            </button>
            <div id="weather-tooltip" class="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white text-slate-800 rounded-lg shadow-xl text-left text-xs border border-slate-200 z-30">
              <div class="font-semibold text-[#007A33] mb-1">Mikroklimat Puncak Bukit</div>
              <p class="text-[11px] text-slate-600 leading-relaxed">
                Ketinggian 216m menghasilkan suhu udara lebih sejuk 3-4°C dibandingkan kawasan pesisir bawah Bandar Lampung.
              </p>
            </div>
          </div>
        </div>

        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-[1.15] mb-6" style="text-wrap: balance;">
          Kemewahan Tenang di Atas Panorama Teluk Lampung
        </h1>

        <p class="max-w-2xl mx-auto text-base sm:text-lg text-slate-200 font-normal leading-relaxed mb-10">
          Nikmati ketenangan di ketinggian perbukitan. Rasakan kehangatan keramahan khas Nusantara, kolam renang tanpa batas tepi tebing, dan santap malam romantis 216 meter di atas gemerlap kota.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <a href="#reservation-bar" class="w-full sm:w-auto px-8 py-3.5 bg-[#007A33] hover:bg-[#005A2B] text-white font-semibold text-xs tracking-wider uppercase rounded shadow-lg hover:shadow-xl transition-all text-center">
            Cek Ketersediaan Kamar
          </a>
          <a href="#suites" class="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-[#D4AF37] font-semibold text-xs tracking-wider uppercase rounded backdrop-blur-xs transition-all text-center">
            Jelajahi Suite &amp; Villa
          </a>
        </div>

        <div class="mt-14 pt-8 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-12 w-full text-slate-200">
          <div class="flex flex-col items-center">
            <div class="text-white font-serif text-2xl font-bold">216 m</div>
            <span class="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold mt-1">Di Atas Permukaan Laut</span>
            <span class="text-xs text-slate-300 mt-0.5">Hembusan angin bukit nan sejuk</span>
          </div>
          <div class="flex flex-col items-center">
            <div class="text-white font-serif text-2xl font-bold">360°</div>
            <span class="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold mt-1">Panorama Alami</span>
            <span class="text-xs text-slate-300 mt-0.5">Lembah hijau &amp; garis laut Teluk Lampung</span>
          </div>
          <div class="flex flex-col items-center">
            <div class="text-white font-serif text-2xl font-bold">4.9 / 5.0</div>
            <span class="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold mt-1">Kepuasan Tamu</span>
            <span class="text-xs text-slate-300 mt-0.5">Lebih dari 2.400 ulasan terverifikasi</span>
          </div>
        </div>
      </div>
    </section>

    <!-- FLOATING RESERVATION BAR -->
    <div id="reservation-bar" class="relative z-20 -mt-10 sm:-mt-14 max-w-6xl mx-auto px-4 sm:px-6">
      <div class="bg-white rounded-lg shadow-xl border border-slate-200 p-2 sm:p-3 transition-shadow hover:shadow-2xl">
        <div class="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-2 sm:gap-3 items-stretch">
          <!-- Check-In -->
          <div class="lg:col-span-3 bg-[#F8FAFC] hover:bg-[#F2F4F6] border border-slate-200/80 rounded p-3 transition-colors flex flex-col justify-between relative">
            <div class="flex items-center justify-between text-slate-500 mb-1">
              <label for="bar-checkin" class="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Tanggal Check-In</label>
              <svg class="w-3.5 h-3.5 text-[#007A33]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div class="flex items-baseline gap-2">
              <span id="bar-checkin-day" class="text-3xl font-serif font-bold text-[#0F1F17]">--</span>
              <div class="flex flex-col text-xs text-slate-600">
                <span id="bar-checkin-month" class="font-medium text-slate-900 capitalize">--</span>
                <span id="bar-checkin-weekday" class="text-slate-500 capitalize">--</span>
              </div>
            </div>
            <input id="bar-checkin" type="date" value="<?= $e($defaultCheckIn) ?>" min="<?= $e(date('Y-m-d')) ?>" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
          </div>

          <!-- Check-Out -->
          <div class="lg:col-span-3 bg-[#F8FAFC] hover:bg-[#F2F4F6] border border-slate-200/80 rounded p-3 transition-colors flex flex-col justify-between relative">
            <div class="flex items-center justify-between text-slate-500 mb-1">
              <label for="bar-checkout" class="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Tanggal Check-Out</label>
              <svg class="w-3.5 h-3.5 text-[#007A33]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div class="flex items-baseline gap-2">
              <span id="bar-checkout-day" class="text-3xl font-serif font-bold text-[#0F1F17]">--</span>
              <div class="flex flex-col text-xs text-slate-600">
                <span id="bar-checkout-month" class="font-medium text-slate-900 capitalize">--</span>
                <span id="bar-checkout-weekday" class="text-slate-500 capitalize">--</span>
              </div>
            </div>
            <input id="bar-checkout" type="date" value="<?= $e($defaultCheckOut) ?>" min="<?= $e($defaultCheckIn) ?>" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
          </div>

          <!-- Tamu Stepper -->
          <div class="lg:col-span-3 bg-[#F8FAFC] border border-slate-200/80 rounded p-3 flex flex-col justify-between relative">
            <div class="flex items-center justify-between text-slate-500 mb-1">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Tamu &amp; Kamar</span>
              <svg class="w-3.5 h-3.5 text-[#007A33]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <button type="button" id="guest-dropdown-btn" class="text-left flex items-baseline gap-2 w-full cursor-pointer focus:outline-none">
              <span id="bar-guest-pad" class="text-3xl font-serif font-bold text-[#0F1F17] tabular-nums">02</span>
              <div class="flex flex-col text-xs text-slate-600">
                <span id="bar-guest-label" class="font-medium text-slate-900">2 Tamu</span>
                <span class="text-slate-500">1 Kamar / Villa</span>
              </div>
            </button>

            <div id="guest-dropdown-popover" class="hidden absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-slate-200 p-4 z-50">
              <div class="flex items-center justify-between">
                <div class="text-sm">
                  <span class="font-semibold text-slate-900 block">Total Tamu</span>
                  <span class="text-xs text-slate-500">Dewasa &amp; Anak-anak</span>
                </div>
                <div class="flex items-center gap-3">
                  <button type="button" id="guest-dec-btn" class="w-8 h-8 rounded border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 cursor-pointer" aria-label="Kurangi jumlah tamu">-</button>
                  <span id="guest-popover-val" class="font-serif font-bold text-lg w-6 text-center tabular-nums">2</span>
                  <button type="button" id="guest-inc-btn" class="w-8 h-8 rounded border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 cursor-pointer" aria-label="Tambah jumlah tamu">+</button>
                </div>
              </div>
              <div class="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                <button type="button" id="guest-done-btn" class="text-xs font-semibold uppercase tracking-wider text-[#007A33] hover:underline cursor-pointer">Selesai</button>
              </div>
            </div>
          </div>

          <!-- Cek Ketersediaan CTA -->
          <div class="lg:col-span-3 flex flex-col justify-center">
            <button
              type="button"
              id="bar-search-btn"
              class="w-full h-full min-h-[56px] bg-[#007A33] hover:bg-[#005A2B] text-white font-semibold text-xs tracking-wider uppercase rounded shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 px-4 cursor-pointer"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span>Cek Ketersediaan</span>
            </button>
          </div>
        </div>

        <!-- Promo Code Bar -->
        <div class="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs px-1 gap-2">
          <div class="flex items-center gap-2 flex-wrap">
            <svg class="w-3.5 h-3.5 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            <span class="text-slate-600 font-medium">Punya kode promo eksklusif?</span>
            <input
              id="bar-promo-input"
              type="text"
              placeholder="cth. HILLTOP15"
              class="px-2.5 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#007A33] uppercase font-mono"
            />
            <span id="bar-promo-badge" class="hidden items-center gap-1 text-[#007A33] font-semibold"></span>
          </div>

          <div class="flex items-center gap-2 text-slate-500">
            <span>Coba kode istimewa:</span>
            <button
              type="button"
              id="quick-promo-btn"
              data-code="HILLTOP15"
              class="inline-flex items-center gap-1 font-mono font-semibold text-[#007A33] bg-[#007A33]/10 px-2 py-0.5 rounded text-[11px] hover:bg-[#007A33]/20 cursor-pointer"
            >
              <span>HILLTOP15</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- FITUR CEK KODE BOOKING & KWITANSI DIGITAL -->
    <section id="cek-booking" class="pt-14 pb-4 max-w-6xl mx-auto px-4 sm:px-6">
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span class="text-[11px] font-semibold uppercase tracking-widest text-[#D4AF37] block">Layanan Mandiri Tamu · Supabase Real-Time</span>
            <h2 class="text-xl sm:text-2xl font-serif font-bold text-[#0F1F17] mt-0.5">Cek Kode Booking &amp; Kwitansi Digital</h2>
            <p class="text-xs text-slate-600 mt-1">Masukkan kode reservasi Anda (cth. <span class="font-mono font-semibold text-[#007A33]">BRH-882410</span>) untuk melihat status kamar dan mencetak bukti kwitansi digital.</p>
          </div>
          <form method="GET" action="/#cek-booking" class="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              name="cek_kode"
              value="<?= $e($searchedCode) ?>"
              placeholder="Masukkan Kode BRH-XXXXXX"
              class="flex-1 md:w-56 px-3.5 py-2.5 text-xs font-mono uppercase border border-slate-300 rounded focus:outline-none focus:border-[#007A33]"
            />
            <button
              type="submit"
              class="px-5 py-2.5 bg-[#005A2B] hover:bg-[#007A33] text-white text-xs font-semibold uppercase tracking-wider rounded cursor-pointer transition-colors whitespace-nowrap"
            >
              Cek Status
            </button>
          </form>
        </div>

        <?php if ($cekKodeError !== null): ?>
          <div class="mt-4 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            <?= $e($cekKodeError) ?>
          </div>
        <?php endif; ?>

        <?php if ($kwitansi !== null): ?>
          <div id="server-kwitansi-card" class="mt-6 p-6 bg-emerald-50/50 border border-[#007A33]/30 rounded-xl">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-200/80">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-widest text-[#007A33]">Bukti Kwitansi Digital Terverifikasi</span>
                <h3 class="text-xl font-serif font-bold text-[#0F1F17] mt-0.5">
                  <?= $e($kwitansi['nama_kamar']) ?> (Kamar <?= $e($kwitansi['nomor_kamar']) ?>)
                </h3>
                <p class="text-xs text-slate-600 mt-0.5">Tamu: <strong><?= $e($kwitansi['nama_tamu']) ?></strong> · <?= $e($kwitansi['email_tamu']) ?> · <?= $e($kwitansi['telepon_tamu']) ?></p>
              </div>
              <div class="flex items-center gap-3">
                <div class="bg-white px-4 py-2 rounded border border-slate-200 text-right">
                  <span class="text-[10px] uppercase font-semibold text-slate-400 block">Kode Booking</span>
                  <span class="font-mono font-bold text-base text-[#007A33]"><?= $e($kwitansi['kode_booking']) ?></span>
                </div>
                <span class="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#007A33] text-white">
                  <?= $e($kwitansi['status_reservasi']) ?>
                </span>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-xs border-b border-emerald-200/80">
              <div>
                <span class="text-slate-500 block">Check-In</span>
                <strong class="text-slate-900 font-semibold"><?= $e($kwitansi['tgl_checkin']) ?></strong>
              </div>
              <div>
                <span class="text-slate-500 block">Check-Out</span>
                <strong class="text-slate-900 font-semibold"><?= $e($kwitansi['tgl_checkout']) ?> (<?= (int) $kwitansi['jumlah_malam'] ?> Malam)</strong>
              </div>
              <div>
                <span class="text-slate-500 block">Promo Digunakan</span>
                <strong class="text-[#007A33] font-mono"><?= $e($kwitansi['kode_promo']) ?></strong>
              </div>
              <div>
                <span class="text-slate-500 block">Pembayaran (<?= $e($kwitansi['status_pembayaran']) ?>)</span>
                <strong class="text-slate-900"><?= $e($kwitansi['metode_pembayaran']) ?></strong>
              </div>
            </div>

            <div class="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end text-xs">
              <div class="space-y-1 text-slate-600">
                <div class="flex justify-between"><span>Subtotal Kamar:</span><span class="tabular-nums font-medium"><?= $rupiah($kwitansi['subtotal']) ?></span></div>
                <?php if ((float) $kwitansi['potongan_diskon'] > 0): ?>
                  <div class="flex justify-between text-[#007A33]"><span>Potongan Promo:</span><span class="tabular-nums font-semibold">-<?= $rupiah($kwitansi['potongan_diskon']) ?></span></div>
                <?php endif; ?>
                <div class="flex justify-between"><span>Biaya Layanan Resor (5%):</span><span class="tabular-nums"><?= $rupiah($kwitansi['biaya_layanan']) ?></span></div>
                <div class="flex justify-between"><span>PPN Pemerintah (10%):</span><span class="tabular-nums"><?= $rupiah($kwitansi['pajak_ppn']) ?></span></div>
              </div>
              <div class="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                <span class="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Total Tagihan Sah</span>
                <span class="text-2xl font-serif font-bold text-[#007A33] tabular-nums"><?= $rupiah($kwitansi['total_tagihan']) ?></span>
              </div>
            </div>
          </div>
        <?php endif; ?>
      </div>
    </section>

    <!-- SUITES & VILLAS CATALOG SECTION -->
    <section id="suites" class="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto mb-12">
        <div class="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#007A33] mb-3">
          <svg class="w-3.5 h-3.5 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
          <span>Sanctuary Puncak Bukit</span>
        </div>
        <h2 class="text-3xl sm:text-4xl font-serif font-bold text-[#0F1F17] tracking-tight">
          Suite, Paviliun &amp; Villa Pribadi Bukit
        </h2>
        <p class="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
          Dirancang dengan kayu jati nusantara, teras lapang, dan dinding kaca panorama untuk menghadirkan keasrian bukit dan cakrawala Teluk Lampung tepat di samping Anda.
        </p>
      </div>

      <!-- Filter and Sort Bar -->
      <div class="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-4 border-b border-slate-200">
        <div id="category-tabs" class="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button type="button" data-cat="all" class="cat-tab px-3.5 py-1.5 text-xs font-medium rounded bg-[#007A33] text-white shadow-xs cursor-pointer whitespace-nowrap">Semua Akomodasi</button>
          <button type="button" data-cat="KAT-DLX" class="cat-tab px-3.5 py-1.5 text-xs font-medium rounded text-slate-600 hover:text-slate-900 cursor-pointer whitespace-nowrap">Suite Panorama</button>
          <button type="button" data-cat="KAT-EXEC" class="cat-tab px-3.5 py-1.5 text-xs font-medium rounded text-slate-600 hover:text-slate-900 cursor-pointer whitespace-nowrap">Retreat Eksekutif</button>
          <button type="button" data-cat="KAT-PRES" class="cat-tab px-3.5 py-1.5 text-xs font-medium rounded text-slate-600 hover:text-slate-900 cursor-pointer whitespace-nowrap">Presidential Suite</button>
          <button type="button" data-cat="KAT-VILA" class="cat-tab px-3.5 py-1.5 text-xs font-medium rounded text-slate-600 hover:text-slate-900 cursor-pointer whitespace-nowrap">Villa &amp; Residensi</button>
          <button type="button" data-cat="favorites" id="favorites-tab-btn" class="cat-tab px-3.5 py-1.5 text-xs font-medium rounded text-slate-600 hover:text-slate-900 cursor-pointer whitespace-nowrap">Disimpan (<span id="fav-count">0</span>)</button>
        </div>

        <div class="flex items-center gap-3 self-end md:self-auto text-xs">
          <span class="text-slate-500 font-medium">Urutkan:</span>
          <select id="room-sort-select" class="px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-700 font-medium text-xs focus:outline-none focus:border-[#007A33] cursor-pointer">
            <option value="featured">Pilihan Utama</option>
            <option value="price-asc">Tarif: Rendah ke Tinggi</option>
            <option value="price-desc">Tarif: Tinggi ke Rendah</option>
          </select>
        </div>
      </div>

      <!-- Room Cards Grid -->
      <div id="rooms-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"></div>
      <div id="rooms-empty" class="hidden text-center py-16 bg-white rounded-lg border border-slate-200 p-8 max-w-lg mx-auto">
        <p class="text-base font-semibold text-slate-800">Tidak ada unit kamar yang sesuai filter saat ini.</p>
        <p class="text-xs text-slate-500 mt-2">Silakan klik Reset Filter untuk menampilkan seluruh koleksi suite dan villa.</p>
        <button type="button" id="reset-filter-btn" class="mt-5 px-4 py-2 text-xs font-semibold text-[#007A33] border border-[#007A33] rounded hover:bg-[#007A33]/5 cursor-pointer">
          Reset Filter Kategori
        </button>
      </div>
    </section>

    <!-- DINING & EXPERIENCES SECTION -->
    <section id="dining" class="py-20 bg-white border-y border-slate-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-16">
          <div class="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#007A33] mb-3">
            <span>Seni Kuliner Puncak &amp; Kebugaran Alami</span>
          </div>
          <h2 class="text-3xl sm:text-4xl font-serif font-bold text-[#0F1F17] tracking-tight">
            Restoran Bukit Randu &amp; Kebugaran Pegunungan
          </h2>
          <p class="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Berada 216 meter di atas pantai, setiap hidangan di Restoran Bukit Randu dan setiap momen di kolam infinity menawarkan pemandangan spektakuler di atas gemerlap Teluk Lampung.
          </p>
        </div>

        <div class="mb-14 rounded-xl border border-slate-200 bg-[#F8FAFC] overflow-hidden shadow-xs hover:shadow-lg transition-shadow">
          <div class="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div class="lg:col-span-7 relative min-h-[340px] lg:min-h-[460px]">
              <img
                src="/assets/images/dining_hilltop_1794410440842.jpg"
                alt="Teras Makan Malam Romantis Restoran Bukit Randu saat senja"
                class="w-full h-full object-cover"
              />
              <div class="absolute top-4 left-4">
                <span class="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-black/60 backdrop-blur-md text-[#D4AF37] border border-[#D4AF37]/30 rounded-full">
                  Teras Puncak Ikonik
                </span>
              </div>
            </div>

            <div class="lg:col-span-5 p-6 lg:p-10 flex flex-col justify-between">
              <div>
                <span class="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] block mb-1">
                  Seni Gastronomi Nusantara &amp; Barat
                </span>
                <h3 class="text-2xl sm:text-3xl font-serif font-bold text-[#0F1F17] leading-tight">
                  Restoran Bukit Randu
                </h3>
                <p class="text-sm text-slate-600 mt-3 leading-relaxed">
                  Rayakan malam istimewa Anda di restoran puncak bukit terkemuka di Lampung. Nikmati hidangan autentik Seruit khas Lampung, olahan hidangan laut pesisir segar, serta Australian Wagyu Ribeye di bawah hamparan bintang saat kota Bandar Lampung mulai berpendar keemasan.
                </p>

                <div class="mt-6 space-y-2 text-xs text-slate-700">
                  <div>Buka Setiap Hari: 06:00 - 23:00 (Sarapan, Makan Siang &amp; Makan Malam Senja)</div>
                  <div class="text-[#007A33] font-medium">Live Acoustic Jazz setiap Jumat &amp; Sabtu malam</div>
                </div>
              </div>

              <div class="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div>
                  <span class="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">Reservasi Meja</span>
                  <span class="text-xs font-medium text-slate-800">Prioritas reservasi meja bagi tamu menginap</span>
                </div>
                <button
                  type="button"
                  onclick="openExperienceModal('Restoran Bukit Randu Fine Dining')"
                  class="px-5 py-2.5 bg-[#007A33] hover:bg-[#005A2B] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>Pesan Meja</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div id="experiences" class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <?php foreach (array_slice($experiences, 1) as $exp): ?>
            <div class="group bg-[#F8FAFC] rounded-lg border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all">
              <div class="relative aspect-[16/9] overflow-hidden bg-slate-100">
                <img src="<?= $e($exp['image']) ?>" alt="<?= $e($exp['title']) ?>" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent"></div>
                <div class="absolute bottom-3 left-4 right-4 text-white">
                  <span class="text-xs uppercase font-semibold text-[#D4AF37] tracking-wider block"><?= $e($exp['subtitle']) ?></span>
                  <h4 class="text-xl font-serif font-bold text-white mt-0.5"><?= $e($exp['title']) ?></h4>
                </div>
              </div>
              <div class="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <p class="text-xs sm:text-sm text-slate-600 leading-relaxed"><?= $e($exp['description']) ?></p>
                  <div class="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between gap-2">
                    <span><?= $e($exp['hours']) ?></span>
                    <span class="text-[#007A33] font-medium"><?= $e($exp['highlight']) ?></span>
                  </div>
                </div>
                <div class="mt-6 flex justify-end">
                  <button
                    type="button"
                    onclick="openExperienceModal('<?= $e($exp['title']) ?>')"
                    class="px-4 py-2 border border-[#007A33] text-[#007A33] hover:bg-[#007A33] hover:text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Reservasi &amp; Pilih Jam
                  </button>
                </div>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      </div>
    </section>

    <!-- GUEST REVIEWS -->
    <section id="reviews" class="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-2xl mx-auto mb-14">
        <div class="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#007A33] mb-3">
          <span class="text-[#D4AF37]">★</span>
          <span>Ulasan Kehormatan Tamu</span>
        </div>
        <h2 class="text-3xl sm:text-4xl font-serif font-bold text-[#0F1F17] tracking-tight">
          Dicintai oleh Wisatawan Nusantara &amp; Mancanegara
        </h2>
        <p class="mt-3 text-sm text-slate-600 leading-relaxed">
          Temukan alasan para pemimpin bisnis, pasangan, dan keluarga memilih Bukit Randu sebagai suaka liburan penuh ketenteraman di Lampung.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <?php foreach ($reviews as $rev): ?>
          <div class="bg-white p-6 rounded-lg border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-1 mb-4 text-[#D4AF37] text-sm">
                ★★★★★ <span class="text-xs font-semibold text-slate-700 ml-2">5.0 / 5.0</span>
              </div>
              <p class="text-xs sm:text-sm text-slate-700 italic leading-relaxed">"<?= $e($rev['comment']) ?>"</p>
            </div>
            <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <h4 class="font-semibold text-slate-900"><?= $e($rev['guestName']) ?></h4>
                <span class="text-slate-500"><?= $e($rev['residenceCity']) ?></span>
              </div>
              <div class="text-right">
                <div class="text-[11px] font-medium text-[#007A33]">Kunjungan Terverifikasi</div>
                <span class="text-[10px] text-slate-400 block"><?= $e($rev['date']) ?></span>
              </div>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    </section>

    <!-- LOCATION & CONCIERGE SECTION -->
    <section id="location" class="py-20 bg-[#F8FAFC] border-t border-slate-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div class="lg:col-span-7 space-y-6">
            <div>
              <span class="text-xs font-semibold uppercase tracking-[0.08em] text-[#007A33] block mb-2">Lokasi Puncak Bukit yang Menenangkan</span>
              <h2 class="text-3xl sm:text-4xl font-serif font-bold text-[#0F1F17] tracking-tight">Berada di Ketinggian Bandar Lampung</h2>
              <p class="text-sm text-slate-600 mt-3 leading-relaxed">
                Terletak di kawasan Kebon Jeruk hanya beberapa menit dari pusat kota Tanjung Karang. Bukit Randu berada di puncak perbukitan, memadukan ketenangan alami dengan aksesibilitas cepat menuju pusat bisnis dan pantai.
              </p>
            </div>

            <div class="p-4 bg-white rounded-lg border border-slate-200 shadow-xs text-xs text-slate-700">
              <strong class="text-sm font-serif font-bold text-slate-900 block">Bukit Randu Hotel &amp; Resort</strong>
              <span>Jl. Kamboja No. 1-2, Kebon Jeruk, Kec. Tanjung Karang Timur, Kota Bandar Lampung, Lampung 35121, Indonesia</span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div class="p-3 bg-white rounded border border-slate-200">
                <span class="text-[11px] font-semibold text-slate-500 uppercase block">Bandara (TKG)</span>
                <span class="text-base font-serif font-bold text-[#007A33]">35 Menit</span>
                <span class="text-[10px] text-slate-400 block">Antar-Jemput Tersedia</span>
              </div>
              <div class="p-3 bg-white rounded border border-slate-200">
                <span class="text-[11px] font-semibold text-slate-500 uppercase block">Stasiun Kereta</span>
                <span class="text-base font-serif font-bold text-[#007A33]">8 Menit</span>
                <span class="text-[10px] text-slate-400 block">Tanjung Karang</span>
              </div>
              <div class="p-3 bg-white rounded border border-slate-200">
                <span class="text-[11px] font-semibold text-slate-500 uppercase block">Teluk Lampung</span>
                <span class="text-base font-serif font-bold text-[#007A33]">15 Menit</span>
                <span class="text-[10px] text-slate-400 block">Kawasan Teluk Betung</span>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-600">
              <span>+62 721 256811 / +62 811 792 568</span>
              <span>reservation@bukitrandu.com</span>
            </div>
          </div>

          <div class="lg:col-span-5 bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-lg">
            <span class="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] block mb-1">Layanan Pramutamu Resor</span>
            <h3 class="text-2xl font-serif font-bold text-[#0F1F17] mb-2">Ada Pertanyaan atau Permintaan Khusus?</h3>
            <p class="text-xs text-slate-500 mb-6">Tim resepsionis dan pramutamu kami siap melayani Anda 24 jam setiap hari untuk bantuan penjemputan bandara, paket jamuan, maupun reservasi khusus.</p>

            <form id="concierge-form" class="space-y-4 text-xs">
              <div>
                <label class="font-semibold uppercase tracking-wider text-slate-700 block mb-1">Nama Lengkap Anda</label>
                <input type="text" id="inq-name" required placeholder="cth. Budi Santoso" class="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:border-[#007A33] focus:outline-none" />
              </div>
              <div>
                <label class="font-semibold uppercase tracking-wider text-slate-700 block mb-1">Email atau Nomor WhatsApp</label>
                <input type="text" id="inq-contact" required placeholder="cth. budi@example.com / 0812..." class="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:border-[#007A33] focus:outline-none" />
              </div>
              <div>
                <label class="font-semibold uppercase tracking-wider text-slate-700 block mb-1">Pesan atau Pertanyaan Anda</label>
                <textarea rows="3" id="inq-msg" placeholder="Tanyakan mengenai ketersediaan kamar, paket romantis, atau shuttle bandara..." class="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:border-[#007A33] focus:outline-none"></textarea>
              </div>
              <button type="submit" class="w-full py-3 bg-[#007A33] hover:bg-[#005A2B] text-white font-semibold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-xs">
                Kirim Pesan ke Pramutamu
              </button>
            </form>
            <div id="concierge-success" class="hidden p-6 bg-emerald-50 text-center rounded-lg space-y-2">
              <h4 class="font-serif font-bold text-slate-900 text-lg">Pesan Berhasil Terkirim</h4>
              <p class="text-xs text-slate-600">Terima kasih. Tim layanan tamu Bukit Randu akan segera menghubungi Anda.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- FOOTER -->
  <footer class="bg-[#0F1F17] text-slate-300 pt-16 pb-12 border-t border-white/10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        <div class="md:col-span-2 space-y-4">
          <h3 class="text-2xl font-serif font-bold text-white tracking-tight">
            Bukit Randu <span class="text-xs font-sans font-medium uppercase tracking-widest text-[#D4AF37] ml-2">Hospitality</span>
          </h3>
          <p class="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
            Suaka puncak bukit terkemuka di Bandar Lampung. Memadukan ketinggian panorama 216 meter di atas permukaan laut dengan kehangatan keramahan khas Nusantara, seni kuliner autentik, dan ketenangan kolam renang infinity tepi tebing.
          </p>
          <div class="text-xs text-[#D4AF37] font-medium pt-2">
            Anggota Resmi Perhimpunan Hotel dan Restoran Indonesia (PHRI)
          </div>
        </div>
        <div class="space-y-3">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-white">Akomodasi &amp; Portal</h4>
          <ul class="space-y-2 text-xs text-slate-400">
            <li><a href="#suites" class="hover:text-white transition-colors">Royal Presidential Suite</a></li>
            <li><a href="#suites" class="hover:text-white transition-colors">Grand Horizon Hillside Villa</a></li>
            <li><a href="#suites" class="hover:text-white transition-colors">Deluxe Panoramic Sanctuary</a></li>
            <li><a href="#cek-booking" class="hover:text-white transition-colors">Cek Kode Booking</a></li>
            <li><a href="/admin/login" class="hover:text-[#D4AF37] text-emerald-400 font-semibold transition-colors">Portal Admin Front Office</a></li>
          </ul>
        </div>
        <div class="space-y-3">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-white">Kontak &amp; Pramutamu</h4>
          <div class="space-y-2 text-xs text-slate-400">
            <p>Jl. Kamboja No. 1-2, Kebon Jeruk, Bandar Lampung 35121, Indonesia</p>
            <p>+62 721 256811 / +62 811 792 568</p>
            <p>reservation@bukitrandu.com</p>
          </div>
        </div>
      </div>

      <div class="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>© <?= date('Y') ?> Bukit Randu Hotel &amp; Resort. Hak cipta dilindungi undang-undang.</p>
        <div class="flex items-center gap-6">
          <a href="/Dokumentasi_RDBMS_Bukit_Randu.pdf" target="_blank" class="hover:text-slate-300">Dokumentasi SQL (PDF)</a>
          <a href="/admin/login" class="hover:text-slate-300">Admin Portal</a>
        </div>
      </div>
    </div>
  </footer>

  <!-- ROOM DETAIL MODAL (SPLIT-VIEW EDITORIAL) -->
  <div id="room-detail-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="room-detail-title">
    <div id="detail-backdrop" class="fixed inset-0 bg-[#0F1F17]/65 backdrop-blur-xs"></div>
    <div class="relative bg-white w-full max-w-4xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col md:flex-row my-auto max-h-[92vh] md:h-[min(640px,90vh)]">
      <div class="relative w-full md:w-[44%] h-48 sm:h-56 md:h-full bg-slate-900 overflow-hidden shrink-0">
        <img id="detail-img" src="" alt="" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-[#0F1F17]/90 via-[#0F1F17]/25 to-black/20"></div>
        <button type="button" id="detail-close-mobile" class="md:hidden absolute top-3 right-3 z-20 p-2 bg-black/50 hover:bg-black/75 text-white rounded-full cursor-pointer" aria-label="Tutup jendela rincian">✕</button>
        <div class="absolute top-4 left-4 right-14 md:right-4">
          <span id="detail-view" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-[#D4AF37]/40 text-[11px] font-semibold uppercase tracking-wider text-[#F3E5AB]"></span>
        </div>
        <div class="absolute bottom-4 left-5 right-5 text-white">
          <span id="detail-featured-badge" class="hidden inline-block px-2.5 py-0.5 mb-2 text-[10px] font-bold uppercase tracking-widest bg-[#D4AF37] text-[#0F1F17] rounded-xs">Akomodasi Pilihan Resor</span>
          <h2 id="room-detail-title" class="text-xl sm:text-2xl font-serif font-bold leading-snug text-white"></h2>
          <p id="detail-tagline" class="hidden md:block text-xs text-slate-200/90 mt-1.5 leading-relaxed"></p>
        </div>
      </div>

      <div class="flex-1 flex flex-col min-h-0 bg-white">
        <div class="hidden md:flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#F8FAFC] shrink-0">
          <div>
            <span class="text-[11px] font-semibold uppercase tracking-widest text-[#007A33] block">Rincian Akomodasi Puncak Bukit</span>
            <span class="text-xs text-slate-500">Bukit Randu Hotel &amp; Resort · Bandar Lampung</span>
          </div>
          <button type="button" id="detail-close-desktop" class="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-full cursor-pointer" aria-label="Tutup jendela rincian">✕</button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-5">
          <div class="grid grid-cols-3 gap-2.5 p-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-lg text-center">
            <div class="px-1">
              <span class="text-slate-500 uppercase text-[10px] block font-semibold tracking-wider">Luas Hunian</span>
              <div id="detail-sqm" class="mt-1 font-serif text-[#0F1F17] font-bold text-sm sm:text-base"></div>
            </div>
            <div class="px-1 border-x border-slate-200">
              <span class="text-slate-500 uppercase text-[10px] block font-semibold tracking-wider">Tempat Tidur</span>
              <div id="detail-bed" class="mt-1 font-serif text-[#0F1F17] font-bold text-xs sm:text-sm leading-tight"></div>
            </div>
            <div class="px-1">
              <span class="text-slate-500 uppercase text-[10px] block font-semibold tracking-wider">Kapasitas</span>
              <div id="detail-guests" class="mt-1 font-serif text-[#0F1F17] font-bold text-sm sm:text-base"></div>
            </div>
          </div>

          <div class="space-y-1.5">
            <h3 class="text-[11px] font-bold uppercase tracking-widest text-[#007A33]">Pengalaman &amp; Deskripsi Suite</h3>
            <p id="detail-desc" class="text-sm text-slate-700 leading-relaxed"></p>
          </div>

          <div class="space-y-2.5">
            <h3 class="text-[11px] font-bold uppercase tracking-widest text-slate-500">Fasilitas &amp; Keistimewaan Termasuk</h3>
            <div id="detail-amenities" class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-800"></div>
          </div>

          <div class="p-3.5 bg-amber-50/70 border border-[#D4AF37]/35 rounded-lg text-xs text-slate-700 leading-relaxed">
            Termasuk prioritas reservasi meja di <strong>Restoran Bukit Randu</strong> dan akses gratis ke <strong>Cliffside Horizon Infinity Pool</strong>.
          </div>
        </div>

        <div class="p-4 sm:px-6 bg-[#F8FAFC] border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div class="min-w-0">
            <span class="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block">Tarif Terbaik Mulai Dari</span>
            <div class="flex items-baseline gap-1.5 flex-wrap sm:flex-nowrap">
              <span id="detail-price" class="text-lg sm:text-xl font-serif font-bold text-[#0F1F17] tabular-nums whitespace-nowrap"></span>
              <span class="text-xs text-slate-500 whitespace-nowrap">/ malam</span>
            </div>
          </div>
          <div class="flex items-center gap-2.5 shrink-0">
            <button type="button" id="detail-close-footer" class="hidden sm:inline-flex px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer whitespace-nowrap">Tutup</button>
            <button type="button" id="detail-reserve-btn" class="px-4 sm:px-5 py-2.5 bg-[#007A33] hover:bg-[#005A2B] text-white text-xs font-semibold uppercase tracking-wider rounded-md shadow-xs flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0">
              <span>Pesan Suite Ini →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 3-STEP BOOKING MODAL (CALL sp_buat_reservasi_baru) -->
  <div id="booking-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
    <div id="booking-backdrop" class="fixed inset-0 bg-[#0F1F17]/60 backdrop-blur-xs"></div>
    <div class="relative bg-white w-full max-w-4xl rounded-lg shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col my-auto max-h-[92vh]">
      <div class="px-6 py-4 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between shrink-0">
        <div>
          <span id="booking-step-label" class="text-[11px] font-semibold uppercase tracking-wider text-[#007A33]">Langkah 1 dari 3: Rincian Reservasi</span>
          <h3 id="booking-modal-title" class="text-lg font-serif font-bold text-[#0F1F17]"></h3>
        </div>
        <button type="button" id="booking-close-btn" class="p-2 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer" aria-label="Tutup jendela reservasi">✕</button>
      </div>

      <div class="p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
        <!-- STEP 1 -->
        <div id="booking-step-1" class="space-y-6">
          <div class="flex flex-col sm:flex-row gap-4 p-4 bg-[#F8FAFC] rounded-lg border border-slate-200">
            <img id="bm-img" src="" alt="" class="w-full sm:w-36 h-24 object-cover rounded" />
            <div class="flex-1">
              <span id="bm-view" class="text-[11px] font-semibold uppercase tracking-wider text-[#D4AF37]"></span>
              <h4 id="bm-name" class="font-serif font-bold text-slate-900 text-lg"></h4>
              <p id="bm-specs" class="text-xs text-slate-500 mt-0.5"></p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="p-3 border border-slate-200 rounded bg-white">
              <label for="bm-checkin" class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Tanggal Check-In</label>
              <input id="bm-checkin" type="date" class="w-full font-medium text-slate-800 text-sm focus:outline-none" />
            </div>
            <div class="p-3 border border-slate-200 rounded bg-white">
              <label for="bm-checkout" class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Tanggal Check-Out</label>
              <input id="bm-checkout" type="date" class="w-full font-medium text-slate-800 text-sm focus:outline-none" />
            </div>
          </div>

          <div class="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-600">Kode Promo:</span>
              <input id="bm-promo" type="text" placeholder="cth. HILLTOP15" class="px-3 py-1.5 text-xs uppercase bg-white border border-slate-300 rounded focus:border-[#007A33] focus:outline-none font-mono" />
            </div>
            <span id="bm-promo-status" class="text-xs text-slate-500">Gunakan HILLTOP15 (15%), BUKITVIP (20%), atau WEEKEND10 (10%)</span>
          </div>

          <div>
            <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Rincian Tarif Terperinci (<span id="bm-nights-label">2</span> Malam)</h4>
            <div class="border border-slate-200 rounded overflow-hidden text-sm">
              <div class="flex justify-between p-3 bg-white border-b border-slate-100">
                <span class="text-slate-700">Subtotal Tarif Kamar</span>
                <span id="bm-subtotal" class="font-medium text-slate-900 tabular-nums"></span>
              </div>
              <div id="bm-discount-row" class="hidden flex justify-between p-3 bg-[#F8FAFC] border-b border-slate-100 text-[#007A33]">
                <span>Potongan Voucher Promo (<span id="bm-discount-pct">0</span>%)</span>
                <span id="bm-discount" class="font-semibold tabular-nums"></span>
              </div>
              <div class="flex justify-between p-3 bg-white border-b border-slate-100 text-slate-600">
                <span>Biaya Layanan Resor Bukit (5%)</span>
                <span id="bm-service" class="tabular-nums"></span>
              </div>
              <div class="flex justify-between p-3 bg-[#F8FAFC] border-b border-slate-100 text-slate-600">
                <span>Pajak Pemerintah PPN (10%)</span>
                <span id="bm-tax" class="tabular-nums"></span>
              </div>
              <div class="flex justify-between p-4 bg-emerald-50/60 font-semibold text-[#0F1F17] text-base">
                <span>Total Tagihan (Sesuai Stored Function PostgreSQL)</span>
                <span id="bm-total" class="text-xl font-serif font-bold text-[#007A33] tabular-nums"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- STEP 2 -->
        <form id="booking-step-2" class="hidden space-y-4">
          <div id="bm-error-box" class="hidden p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium"></div>
          <div class="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-[#007A33]">
            Reservasi Anda diproses langsung ke database PostgreSQL Supabase melalui Stored Procedure <code class="font-mono font-bold">sp_buat_reservasi_baru</code>.
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="bm-guest-name" class="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1">Nama Lengkap Tamu Utama *</label>
              <input id="bm-guest-name" type="text" required placeholder="cth. Maulana Jaya" class="w-full px-4 py-2.5 text-sm border border-slate-300 rounded focus:border-[#007A33] focus:outline-none" />
            </div>
            <div>
              <label for="bm-guest-city" class="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1">Kota Asal</label>
              <input id="bm-guest-city" type="text" value="Bandar Lampung" class="w-full px-4 py-2.5 text-sm border border-slate-300 rounded focus:border-[#007A33] focus:outline-none" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="bm-guest-email" class="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1">Alamat Email (Untuk Kwitansi) *</label>
              <input id="bm-guest-email" type="email" required placeholder="tamu@example.com" class="w-full px-4 py-2.5 text-sm border border-slate-300 rounded focus:border-[#007A33] focus:outline-none" />
            </div>
            <div>
              <label for="bm-guest-phone" class="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1">Nomor WhatsApp / Ponsel *</label>
              <input id="bm-guest-phone" type="tel" required placeholder="+62 812-3456-7890" class="w-full px-4 py-2.5 text-sm border border-slate-300 rounded focus:border-[#007A33] focus:outline-none" />
            </div>
          </div>

          <div>
            <label for="bm-payment-method" class="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1">Metode Pembayaran</label>
            <select id="bm-payment-method" class="w-full px-4 py-2.5 text-sm border border-slate-300 rounded bg-white focus:border-[#007A33] focus:outline-none">
              <option value="Transfer Virtual Account (BCA/Mandiri)">Transfer Virtual Account (BCA/Mandiri)</option>
              <option value="Kartu Kredit Visa / Mastercard">Kartu Kredit Visa / Mastercard</option>
              <option value="QRIS / Bayar Langsung di Resepsionis">QRIS / Bayar Langsung di Resepsionis</option>
            </select>
          </div>

          <div>
            <label for="bm-notes" class="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1">Permintaan Khusus (Opsional)</label>
            <textarea id="bm-notes" rows="2" placeholder="cth. Lantai tinggi menghadap Teluk Lampung..." class="w-full px-4 py-2.5 text-sm border border-slate-300 rounded focus:border-[#007A33] focus:outline-none"></textarea>
          </div>
        </form>

        <!-- STEP 3: VOUCHER / KWITANSI DIGITAL -->
        <div id="booking-step-3" class="hidden space-y-6">
          <div id="printable-voucher" class="space-y-5">
            <div class="p-6 bg-emerald-50/70 border border-[#007A33]/30 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span class="text-xs font-semibold uppercase tracking-wider text-[#007A33]">Reservasi Terkonfirmasi di Database</span>
                <h4 class="text-2xl font-serif font-bold text-slate-900">Bukti Kwitansi Digital Resmi</h4>
                <p id="voucher-guest-email" class="text-xs text-slate-600 mt-0.5"></p>
              </div>
              <div class="bg-white px-4 py-2.5 rounded border border-slate-200 shadow-xs text-center sm:text-right">
                <span class="text-[10px] uppercase font-semibold text-slate-400 block">Kode Booking</span>
                <span id="voucher-code" class="font-mono font-bold text-lg text-[#007A33]"></span>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-200 rounded-lg p-4 bg-white text-xs">
              <div>
                <span class="font-semibold text-slate-400 uppercase text-[10px] block">Akomodasi Dipesan</span>
                <span id="voucher-room" class="font-serif font-bold text-slate-900 text-sm block mt-1"></span>
              </div>
              <div>
                <span class="font-semibold text-slate-400 uppercase text-[10px] block">Jadwal Menginap</span>
                <span id="voucher-dates" class="font-medium text-slate-900 text-sm block mt-1"></span>
              </div>
              <div>
                <span class="font-semibold text-slate-400 uppercase text-[10px] block">Tamu Utama</span>
                <span id="voucher-guest" class="font-medium text-slate-900 text-sm block mt-1"></span>
              </div>
            </div>

            <div class="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span class="text-xs text-slate-600 font-medium block">Total Pembayaran Sah (Termasuk Pajak 10% &amp; Layanan 5%)</span>
                <span id="voucher-payment" class="text-xs text-slate-400"></span>
              </div>
              <span id="voucher-total" class="text-2xl font-serif font-bold text-[#007A33] tabular-nums"></span>
            </div>
          </div>
        </div>
      </div>

      <div class="px-6 py-4 bg-[#F8FAFC] border-t border-slate-200 flex items-center justify-between shrink-0">
        <button type="button" id="bm-cancel-btn" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer">Batal</button>
        <div class="flex items-center gap-3">
          <button type="button" id="bm-back-btn" class="hidden px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer">Kembali ke Tarif</button>
          <button type="button" id="bm-next-btn" class="px-6 py-2.5 bg-[#007A33] hover:bg-[#005A2B] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-xs cursor-pointer">Lanjut ke Data Tamu →</button>
          <button type="submit" form="booking-step-2" id="bm-submit-btn" class="hidden px-6 py-2.5 bg-[#007A33] hover:bg-[#005A2B] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-xs cursor-pointer">Konfirmasi &amp; Kunci Reservasi ✓</button>
          <button type="button" id="bm-print-btn" onclick="window.print()" class="hidden px-4 py-2 text-xs font-semibold text-[#007A33] border border-[#007A33] rounded cursor-pointer">Cetak Kwitansi</button>
          <button type="button" id="bm-done-btn" class="hidden px-6 py-2.5 bg-[#007A33] hover:bg-[#005A2B] text-white text-xs font-semibold uppercase tracking-wider rounded cursor-pointer">Selesai</button>
        </div>
      </div>
    </div>
  </div>

  <!-- EXPERIENCE / TABLE RESERVATION MODAL -->
  <div id="experience-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
    <div onclick="closeExperienceModal()" class="fixed inset-0 bg-[#0F1F17]/60 backdrop-blur-xs"></div>
    <div class="relative bg-white w-full max-w-lg rounded-lg shadow-2xl border border-slate-200 z-10 overflow-hidden">
      <div class="px-6 py-4 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between">
        <div>
          <span class="text-[11px] font-semibold uppercase tracking-wider text-[#007A33]">Pemesanan Khusus Tamu</span>
          <h3 id="exp-modal-title" class="font-serif font-bold text-slate-900 text-lg"></h3>
        </div>
        <button type="button" onclick="closeExperienceModal()" class="p-1.5 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer">✕</button>
      </div>
      <div class="p-6">
        <form id="exp-form" class="space-y-4 text-xs">
          <div>
            <label class="font-semibold uppercase tracking-wider text-slate-700 block mb-1">Nama Tamu</label>
            <input type="text" required placeholder="cth. Maulana Jaya" class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded focus:border-[#007A33] focus:outline-none" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="font-semibold uppercase tracking-wider text-slate-700 block mb-1">Tanggal</label>
              <input type="date" value="<?= $e($defaultCheckIn) ?>" required class="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:border-[#007A33] focus:outline-none" />
            </div>
            <div>
              <label class="font-semibold uppercase tracking-wider text-slate-700 block mb-1">Waktu</label>
              <select class="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:border-[#007A33] focus:outline-none">
                <option>17:30 (Santap Senja)</option>
                <option>18:30 (Makan Malam Romantis)</option>
                <option>20:00 (Makan Malam Larut)</option>
              </select>
            </div>
          </div>
          <button type="submit" class="w-full py-3 bg-[#007A33] hover:bg-[#005A2B] text-white font-semibold uppercase tracking-wider rounded cursor-pointer">
            Kirim Permintaan Reservasi
          </button>
        </form>
        <div id="exp-success" class="hidden text-center py-6 space-y-3">
          <h4 class="text-xl font-serif font-bold text-slate-900">Reservasi Berhasil Diterima</h4>
          <p class="text-xs text-slate-600">Tim Maître d'hôtel Bukit Randu telah mencatat permintaan meja/fasilitas Anda.</p>
          <button type="button" onclick="closeExperienceModal()" class="px-6 py-2 bg-[#007A33] text-white text-xs font-semibold uppercase rounded cursor-pointer">Tutup</button>
        </div>
      </div>
    </div>
  </div>

  <!-- TOAST CONTAINER -->
  <div id="toast-container" class="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"></div>

  <script>
    const ROOMS_DATA = <?= json_encode($roomsPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?>;
    const PROMO_MAP = <?= json_encode($promoMap, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?>;

    let currency = 'IDR';
    let selectedCategory = 'all';
    let sortBy = 'featured';
    let guestCount = 2;
    let favorites = JSON.parse(localStorage.getItem('brh_favorites') || '[]');
    let activeRoom = null;
    let bookingStep = 1;

    const fmtCurrency = (idrAmount, cur = currency) => {
      if (cur === 'USD') {
        const usd = Math.round(idrAmount / 15500);
        return '$' + usd.toLocaleString('en-US');
      }
      return 'IDR ' + Math.round(idrAmount).toLocaleString('id-ID');
    };

    const getPromoInfo = (code) => {
      const clean = (code || '').trim().toUpperCase();
      return PROMO_MAP[clean] || null;
    };

    const showToast = (title, desc = '') => {
      const container = document.getElementById('toast-container');
      const el = document.createElement('div');
      el.className = 'pointer-events-auto bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-slate-200 p-3.5 flex items-start justify-between gap-3';
      el.innerHTML = `<div><div class="text-xs font-semibold text-[#007A33]">${title}</div>${desc ? `<div class="text-[11px] text-slate-600 mt-0.5">${desc}</div>` : ''}</div>`;
      container.appendChild(el);
      setTimeout(() => el.remove(), 3500);
    };

    const updateDateDisplays = () => {
      const ci = document.getElementById('bar-checkin').value;
      const co = document.getElementById('bar-checkout').value;
      const formatParts = (str) => {
        const d = new Date(str + 'T00:00:00');
        return {
          day: String(d.getDate()).padStart(2, '0'),
          month: d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
          weekday: d.toLocaleDateString('id-ID', { weekday: 'long' }),
        };
      };
      const ciP = formatParts(ci);
      const coP = formatParts(co);
      document.getElementById('bar-checkin-day').textContent = ciP.day;
      document.getElementById('bar-checkin-month').textContent = ciP.month;
      document.getElementById('bar-checkin-weekday').textContent = ciP.weekday;
      document.getElementById('bar-checkout-day').textContent = coP.day;
      document.getElementById('bar-checkout-month').textContent = coP.month;
      document.getElementById('bar-checkout-weekday').textContent = coP.weekday;
    };

    const getNights = (ci, co) => {
      const d1 = new Date(ci);
      const d2 = new Date(co);
      const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 1;
    };

    const renderRooms = () => {
      const grid = document.getElementById('rooms-grid');
      const empty = document.getElementById('rooms-empty');
      document.getElementById('fav-count').textContent = favorites.length;

      const ci = document.getElementById('bar-checkin').value;
      const co = document.getElementById('bar-checkout').value;
      const nights = getNights(ci, co);
      const promoCode = document.getElementById('bar-promo-input').value;
      const promoInfo = getPromoInfo(promoCode);
      const discountPct = promoInfo ? promoInfo.persen : 0;

      let list = ROOMS_DATA.filter((r) => {
        if (selectedCategory === 'favorites') {
          return favorites.includes(r.kode_kamar);
        }
        const matchCat = selectedCategory === 'all' || r.categoryCode === selectedCategory;
        const matchGuests = r.maxGuests >= guestCount;
        return matchCat && matchGuests;
      });

      if (sortBy === 'price-asc') {
        list.sort((a, b) => a.basePriceIdr - b.basePriceIdr);
      } else if (sortBy === 'price-desc') {
        list.sort((a, b) => b.basePriceIdr - a.basePriceIdr);
      }

      if (list.length === 0) {
        grid.innerHTML = '';
        empty.classList.remove('hidden');
        return;
      }

      empty.classList.add('hidden');
      grid.innerHTML = list.map((r) => {
        const isFav = favorites.includes(r.kode_kamar);
        const discountedRate = discountPct > 0 ? Math.round(r.basePriceIdr * (1 - discountPct / 100)) : r.basePriceIdr;
        const amenitiesHtml = (r.amenities || []).slice(0, 3).map((a) => `
          <div class="flex items-center gap-1.5">
            <span class="text-[#D4AF37] font-bold">✓</span>
            <span>${a}</span>
          </div>
        `).join('');
        const statusBadge = r.status_ketersediaan !== 'Tersedia'
          ? `<span class="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${r.status_ketersediaan === 'Terisi' ? 'bg-amber-600' : 'bg-red-700'} text-white rounded-full shadow-xs">${r.status_ketersediaan}</span>`
          : '';

        return `
          <article class="group bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-[#D4AF37]/60 transition-all duration-300 flex flex-col justify-between">
            <div class="relative aspect-[16/10] overflow-hidden bg-slate-100">
              <img src="${r.image}" alt="${r.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
              <div class="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                <div class="flex flex-wrap gap-1.5">
                  <span class="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-white/95 text-[#007A33] border border-[#007A33]/20 rounded-full shadow-xs">${r.view}</span>
                  ${r.featured ? `<span class="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-[#D4AF37] text-white rounded-full shadow-xs">Suite Pilihan</span>` : ''}
                  ${statusBadge}
                </div>
                <button type="button" onclick="toggleFavorite('${r.kode_kamar}')" aria-label="Simpan ${r.name} ke favorit" class="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center cursor-pointer shrink-0">
                  <span class="${isFav ? 'text-rose-400' : 'text-white'}">${isFav ? '♥' : '♡'}</span>
                </button>
              </div>
              <div class="absolute bottom-3 left-3 right-3 flex items-center gap-3 text-xs text-white/95 font-medium flex-wrap">
                <span class="bg-black/45 px-2 py-0.5 rounded">${r.sqm} m²</span>
                <span class="bg-black/45 px-2 py-0.5 rounded">${r.bedType}</span>
                <span class="bg-black/45 px-2 py-0.5 rounded">Hingga ${r.maxGuests} Tamu</span>
              </div>
            </div>

            <div class="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 class="text-xl sm:text-2xl font-serif font-semibold text-[#0F1F17] group-hover:text-[#007A33] transition-colors leading-snug">${r.name}</h3>
                <p class="text-xs sm:text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">${r.tagline}</p>
                <div class="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
                  ${amenitiesHtml}
                </div>
              </div>

              <div class="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Tarif per Malam (No. ${r.nomor_kamar})</span>
                  <div class="flex items-baseline gap-2 mt-0.5">
                    ${discountPct > 0 ? `<span class="text-xs text-slate-500 line-through tabular-nums">${fmtCurrency(r.basePriceIdr)}</span>` : ''}
                    <span class="text-xl font-serif font-bold text-[#0F1F17] tabular-nums">${fmtCurrency(discountedRate)}</span>
                    <span class="text-xs text-slate-600">/ malam</span>
                  </div>
                  ${nights > 1 ? `<span class="text-[11px] text-slate-600 block mt-0.5 tabular-nums">Total ${nights} malam: ${fmtCurrency(discountedRate * nights)}</span>` : ''}
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <button type="button" onclick="openDetailModal(${r.id_kamar})" class="px-3.5 py-2.5 text-xs font-semibold text-[#007A33] border border-[#D4AF37] hover:bg-[#D4AF37]/10 rounded transition-colors cursor-pointer whitespace-nowrap">Detail</button>
                  <button type="button" onclick="openBookingModal(${r.id_kamar})" class="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-[#007A33] hover:bg-[#005A2B] rounded shadow-xs transition-colors cursor-pointer whitespace-nowrap">Pesan →</button>
                </div>
              </div>
            </div>
          </article>
        `;
      }).join('');
    };

    window.toggleFavorite = (kode) => {
      if (favorites.includes(kode)) {
        favorites = favorites.filter((x) => x !== kode);
        showToast('Dihapus dari Favorit');
      } else {
        favorites.push(kode);
        showToast('Disimpan ke Favorit', 'Akomodasi ditambahkan ke daftar pilihan Anda.');
      }
      localStorage.setItem('brh_favorites', JSON.stringify(favorites));
      renderRooms();
    };

    window.openDetailModal = (idKamar) => {
      const room = ROOMS_DATA.find((r) => r.id_kamar === idKamar);
      if (!room) return;
      activeRoom = room;
      document.getElementById('detail-img').src = room.image;
      document.getElementById('detail-img').alt = room.name;
      document.getElementById('detail-view').textContent = room.view;
      document.getElementById('room-detail-title').textContent = room.name;
      document.getElementById('detail-tagline').textContent = room.tagline;
      document.getElementById('detail-sqm').textContent = room.sqm + ' m²';
      document.getElementById('detail-bed').textContent = room.bedType;
      document.getElementById('detail-guests').textContent = room.maxGuests + ' Tamu';
      document.getElementById('detail-desc').textContent = room.description;
      document.getElementById('detail-price').textContent = fmtCurrency(room.basePriceIdr);
      document.getElementById('detail-featured-badge').classList.toggle('hidden', !room.featured);
      document.getElementById('detail-amenities').innerHTML = (room.amenities || []).map((a) => `
        <div class="flex items-center gap-2.5 px-3 py-2 bg-[#F8FAFC] rounded-md border border-slate-200/70">
          <span class="w-4 h-4 rounded-full bg-[#007A33]/15 text-[#007A33] flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
          <span class="leading-snug">${a}</span>
        </div>
      `).join('');
      document.getElementById('room-detail-modal').classList.remove('hidden');
    };

    const closeDetailModal = () => {
      document.getElementById('room-detail-modal').classList.add('hidden');
    };

    const updateBookingSummary = () => {
      if (!activeRoom) return;
      const ci = document.getElementById('bm-checkin').value;
      const co = document.getElementById('bm-checkout').value;
      const nights = getNights(ci, co);
      const promoCode = document.getElementById('bm-promo').value;
      const promoInfo = getPromoInfo(promoCode);

      const subtotal = activeRoom.basePriceIdr * nights;
      let diskon = 0;
      if (promoInfo) {
        diskon = Math.round(subtotal * (promoInfo.persen / 100));
        if (promoInfo.maks > 0 && diskon > promoInfo.maks) {
          diskon = promoInfo.maks;
        }
      }
      const dasar = Math.max(0, subtotal - diskon);
      const layanan = Math.round(dasar * 0.05);
      const ppn = Math.round(dasar * 0.10);
      const total = dasar + layanan + ppn;

      document.getElementById('bm-nights-label').textContent = String(nights);
      document.getElementById('bm-subtotal').textContent = fmtCurrency(subtotal);
      document.getElementById('bm-discount-row').classList.toggle('hidden', diskon <= 0);
      document.getElementById('bm-discount-pct').textContent = String(promoInfo ? promoInfo.persen : 0);
      document.getElementById('bm-discount').textContent = '-' + fmtCurrency(diskon);
      document.getElementById('bm-service').textContent = fmtCurrency(layanan);
      document.getElementById('bm-tax').textContent = fmtCurrency(ppn);
      document.getElementById('bm-total').textContent = fmtCurrency(total);
      document.getElementById('bm-promo-status').textContent = promoInfo
        ? `✓ ${promoInfo.nama} (${promoInfo.persen}%) diterapkan`
        : 'Gunakan HILLTOP15 (15%), BUKITVIP (20%), atau WEEKEND10 (10%)';
    };

    const setBookingStep = (step) => {
      bookingStep = step;
      document.getElementById('booking-step-1').classList.toggle('hidden', step !== 1);
      document.getElementById('booking-step-2').classList.toggle('hidden', step !== 2);
      document.getElementById('booking-step-3').classList.toggle('hidden', step !== 3);

      document.getElementById('bm-cancel-btn').classList.toggle('hidden', step === 3);
      document.getElementById('bm-back-btn').classList.toggle('hidden', step !== 2);
      document.getElementById('bm-next-btn').classList.toggle('hidden', step !== 1);
      document.getElementById('bm-submit-btn').classList.toggle('hidden', step !== 2);
      document.getElementById('bm-print-btn').classList.toggle('hidden', step !== 3);
      document.getElementById('bm-done-btn').classList.toggle('hidden', step !== 3);

      const labelMap = {
        1: 'Langkah 1 dari 3: Rincian Reservasi',
        2: 'Langkah 2 dari 3: Data Tamu & Kontak',
        3: 'Reservasi Terkonfirmasi & Dijamin',
      };
      document.getElementById('booking-step-label').textContent = labelMap[step];
      if (step === 3) {
        document.getElementById('booking-modal-title').textContent = 'Voucher Konfirmasi Reservasi';
      } else if (activeRoom) {
        document.getElementById('booking-modal-title').textContent = activeRoom.name;
      }
    };

    window.openBookingModal = (idKamar) => {
      const room = ROOMS_DATA.find((r) => r.id_kamar === idKamar) || ROOMS_DATA[0];
      if (!room) return;
      activeRoom = room;
      document.getElementById('bm-img').src = room.image;
      document.getElementById('bm-view').textContent = room.view;
      document.getElementById('bm-name').textContent = `${room.name} (No. ${room.nomor_kamar})`;
      document.getElementById('bm-specs').textContent = `${room.bedType} · ${room.sqm} m² · Hingga ${room.maxGuests} tamu`;
      document.getElementById('bm-checkin').value = document.getElementById('bar-checkin').value;
      document.getElementById('bm-checkout').value = document.getElementById('bar-checkout').value;
      document.getElementById('bm-promo').value = document.getElementById('bar-promo-input').value;
      document.getElementById('bm-error-box').classList.add('hidden');

      updateBookingSummary();
      setBookingStep(1);
      document.getElementById('booking-modal').classList.remove('hidden');
    };

    const closeBookingModal = () => {
      document.getElementById('booking-modal').classList.add('hidden');
    };

    window.openExperienceModal = (title) => {
      document.getElementById('exp-modal-title').textContent = title;
      document.getElementById('exp-form').classList.remove('hidden');
      document.getElementById('exp-success').classList.add('hidden');
      document.getElementById('experience-modal').classList.remove('hidden');
    };

    window.closeExperienceModal = () => {
      document.getElementById('experience-modal').classList.add('hidden');
    };

    document.addEventListener('DOMContentLoaded', () => {
      updateDateDisplays();
      renderRooms();

      document.getElementById('mobile-menu-toggle').addEventListener('click', () => {
        document.getElementById('mobile-menu-tray').classList.toggle('hidden');
      });

      document.querySelectorAll('.mobile-nav-link').forEach((link) => {
        link.addEventListener('click', () => {
          document.getElementById('mobile-menu-tray').classList.add('hidden');
        });
      });

      document.getElementById('currency-toggle-btn').addEventListener('click', () => {
        currency = currency === 'IDR' ? 'USD' : 'IDR';
        document.getElementById('currency-label').textContent = currency;
        renderRooms();
        showToast(`Mata uang diubah ke ${currency}`);
      });

      document.getElementById('navbar-book-btn').addEventListener('click', () => openBookingModal(ROOMS_DATA[0]?.id_kamar));
      document.getElementById('mobile-book-btn').addEventListener('click', () => {
        document.getElementById('mobile-menu-tray').classList.add('hidden');
        openBookingModal(ROOMS_DATA[0]?.id_kamar);
      });

      document.getElementById('bar-checkin').addEventListener('change', () => {
        const ci = document.getElementById('bar-checkin').value;
        const coInput = document.getElementById('bar-checkout');
        if (ci >= coInput.value) {
          const next = new Date(ci + 'T00:00:00');
          next.setDate(next.getDate() + 1);
          coInput.value = next.toISOString().split('T')[0];
        }
        coInput.min = ci;
        updateDateDisplays();
        renderRooms();
      });

      document.getElementById('bar-checkout').addEventListener('change', () => {
        updateDateDisplays();
        renderRooms();
      });

      document.getElementById('guest-dropdown-btn').addEventListener('click', () => {
        document.getElementById('guest-dropdown-popover').classList.toggle('hidden');
      });
      document.getElementById('guest-done-btn').addEventListener('click', () => {
        document.getElementById('guest-dropdown-popover').classList.add('hidden');
      });
      const updateGuestUI = () => {
        document.getElementById('bar-guest-pad').textContent = String(guestCount).padStart(2, '0');
        document.getElementById('bar-guest-label').textContent = `${guestCount} Tamu`;
        document.getElementById('guest-popover-val').textContent = String(guestCount);
        renderRooms();
      };
      document.getElementById('guest-dec-btn').addEventListener('click', () => {
        if (guestCount > 1) { guestCount--; updateGuestUI(); }
      });
      document.getElementById('guest-inc-btn').addEventListener('click', () => {
        if (guestCount < 8) { guestCount++; updateGuestUI(); }
      });

      document.getElementById('bar-search-btn').addEventListener('click', () => {
        document.getElementById('suites').scrollIntoView({ behavior: 'smooth' });
        showToast('Ketersediaan Diperbarui', `Menampilkan suite untuk ${guestCount} tamu.`);
      });

      const applyPromoBar = (val) => {
        const promo = getPromoInfo(val);
        const badge = document.getElementById('bar-promo-badge');
        if (promo) {
          badge.textContent = `✓ Diskon ${promo.persen}% Diterapkan!`;
          badge.classList.remove('hidden');
          badge.classList.add('inline-flex');
        } else {
          badge.classList.add('hidden');
        }
        renderRooms();
      };

      document.getElementById('bar-promo-input').addEventListener('input', (e) => applyPromoBar(e.target.value));
      document.getElementById('quick-promo-btn').addEventListener('click', () => {
        const inp = document.getElementById('bar-promo-input');
        inp.value = 'HILLTOP15';
        applyPromoBar('HILLTOP15');
        showToast('Kode Promo HILLTOP15 Diterapkan', 'Anda hemat 15% untuk tarif menginap.');
      });

      document.querySelectorAll('.cat-tab').forEach((btn) => {
        btn.addEventListener('click', () => {
          selectedCategory = btn.dataset.cat;
          document.querySelectorAll('.cat-tab').forEach((b) => {
            b.classList.remove('bg-[#007A33]', 'text-white', 'shadow-xs');
            b.classList.add('text-slate-600');
          });
          btn.classList.add('bg-[#007A33]', 'text-white', 'shadow-xs');
          btn.classList.remove('text-slate-600');
          renderRooms();
        });
      });

      document.getElementById('room-sort-select').addEventListener('change', (e) => {
        sortBy = e.target.value;
        renderRooms();
      });

      document.getElementById('reset-filter-btn').addEventListener('click', () => {
        selectedCategory = 'all';
        document.querySelector('.cat-tab[data-cat="all"]').click();
      });

      // Detail modal bindings
      document.getElementById('detail-backdrop').addEventListener('click', closeDetailModal);
      document.getElementById('detail-close-mobile').addEventListener('click', closeDetailModal);
      document.getElementById('detail-close-desktop').addEventListener('click', closeDetailModal);
      document.getElementById('detail-close-footer').addEventListener('click', closeDetailModal);
      document.getElementById('detail-reserve-btn').addEventListener('click', () => {
        const targetId = activeRoom ? activeRoom.id_kamar : null;
        closeDetailModal();
        if (targetId) openBookingModal(targetId);
      });

      // Booking modal bindings
      document.getElementById('booking-backdrop').addEventListener('click', () => { if (bookingStep !== 3) closeBookingModal(); });
      document.getElementById('booking-close-btn').addEventListener('click', closeBookingModal);
      document.getElementById('bm-cancel-btn').addEventListener('click', closeBookingModal);
      document.getElementById('bm-done-btn').addEventListener('click', () => { closeBookingModal(); window.location.reload(); });
      document.getElementById('bm-next-btn').addEventListener('click', () => setBookingStep(2));
      document.getElementById('bm-back-btn').addEventListener('click', () => setBookingStep(1));
      document.getElementById('bm-checkin').addEventListener('change', updateBookingSummary);
      document.getElementById('bm-checkout').addEventListener('change', updateBookingSummary);
      document.getElementById('bm-promo').addEventListener('input', updateBookingSummary);

      document.getElementById('booking-step-2').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!activeRoom) return;

        const errBox = document.getElementById('bm-error-box');
        errBox.classList.add('hidden');
        const submitBtn = document.getElementById('bm-submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan ke PostgreSQL...';

        try {
          const res = await fetch('/reservasi/buat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_kamar: activeRoom.id_kamar,
              tgl_checkin: document.getElementById('bm-checkin').value,
              tgl_checkout: document.getElementById('bm-checkout').value,
              jumlah_tamu: guestCount,
              kode_promo: document.getElementById('bm-promo').value,
              nama_tamu: document.getElementById('bm-guest-name').value,
              email_tamu: document.getElementById('bm-guest-email').value,
              no_telepon: document.getElementById('bm-guest-phone').value,
              kota_asal: document.getElementById('bm-guest-city').value,
              metode_pembayaran: document.getElementById('bm-payment-method').value,
              catatan_khusus: document.getElementById('bm-notes').value,
            }),
          });
          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.error || 'Gagal menyimpan reservasi.');
          }

          const d = json.data;
          document.getElementById('voucher-code').textContent = d.kode_booking;
          document.getElementById('voucher-guest-email').textContent = 'Kwitansi diterbitkan untuk ' + d.email_tamu;
          document.getElementById('voucher-room').textContent = `${d.nama_kamar} (No. ${d.nomor_kamar})`;
          document.getElementById('voucher-dates').textContent = `${d.tgl_checkin} s/d ${d.tgl_checkout} (${d.jumlah_malam} Malam)`;
          document.getElementById('voucher-guest').textContent = `${d.nama_tamu} · ${d.telepon_tamu}`;
          document.getElementById('voucher-payment').textContent = `${d.metode_pembayaran} · Status: ${d.status_pembayaran}`;
          document.getElementById('voucher-total').textContent = fmtCurrency(Number(d.total_tagihan), 'IDR');

          setBookingStep(3);
          showToast('Reservasi Tersimpan', `Kode booking ${d.kode_booking} berhasil dikunci.`);
        } catch (err) {
          errBox.textContent = err.message;
          errBox.classList.remove('hidden');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Konfirmasi & Kunci Reservasi ✓';
        }
      });

      document.getElementById('exp-form').addEventListener('submit', (e) => {
        e.preventDefault();
        document.getElementById('exp-form').classList.add('hidden');
        document.getElementById('exp-success').classList.remove('hidden');
      });

      document.getElementById('concierge-form').addEventListener('submit', (e) => {
        e.preventDefault();
        document.getElementById('concierge-form').classList.add('hidden');
        document.getElementById('concierge-success').classList.remove('hidden');
        showToast('Pesan Terkirim', 'Pramutamu kami akan segera menghubungi Anda.');
      });

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeDetailModal();
          if (bookingStep !== 3) closeBookingModal();
          closeExperienceModal();
        }
      });
    });
  </script>
</body>
</html>
