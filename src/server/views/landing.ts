import type { FlashMessage } from '../auth.ts';
import type { PromoRow, ReservationReportRow, RoomRow } from '../hotelService.ts';
import { escapeHtml, formatRupiah, mapRoomToClientDto, safeJson } from './helpers.ts';
import { renderRdbmsArchitectureSection } from './rdbmsSection.ts';

export interface LandingViewProps {
  rooms: RoomRow[];
  promos: PromoRow[];
  kwitansi: ReservationReportRow | null;
  cekKodeError: string | null;
  searchedCode: string;
  dbError: string | null;
  flash: FlashMessage | null;
  defaultCheckIn: string;
  defaultCheckOut: string;
}

const EXPERIENCES = [
  {
    id: 'restoran-bukit-randu',
    title: 'Restoran Bukit Randu Fine Dining',
    subtitle: 'Seni Kuliner Istimewa di Atas Gemerlap Kota',
    description:
      'Nikmati kelezatan hidangan khas Nusantara autentik dan sajian kuliner internasional kontemporer di teras makan terbuka kami. Saat senja tiba, Bandar Lampung bertransformasi menjadi lautan cahaya berkilau di bawah meja santap Anda.',
    hours: 'Setiap Hari: 06:00 - 23:00',
    highlight: 'Menu Ikonik: Seruit Khas Lampung & Wagyu Ribeye',
    image: '/assets/images/dining_hilltop_1794410440842.jpg',
  },
  {
    id: 'horizon-pool',
    title: 'Cliffside Horizon Infinity Pool',
    subtitle: 'Berenang di Tengah Sejuknya Udara Pegunungan',
    description:
      'Kolam renang infinity bertingkat dua yang seolah menyatu dengan lembah perbukitan hijau di bawahnya. Nikmati layanan minuman tepi kolam, lounger jati nyaman di bawah payung resor, dan hembusan angin bukit yang menenangkan.',
    hours: 'Setiap Hari: 06:00 - 20:00',
    highlight: 'Sunken Pool Bar & Mocktail Sunset Segar',
    image: '/assets/images/bukit_randu_hero_1794410439341.jpg',
  },
  {
    id: 'hilltop-spa',
    title: 'Apsara Hillside Spa & Wellness',
    subtitle: 'Relaksasi Tradisional & Aromaterapi Herbal Alami',
    description:
      'Kembalikan kesegaran raga dan ketenangan jiwa dengan perawatan signature kami yang memadukan rempah herbal khas Lampung, terapi batu hangat vulkanik, dan pijatan relaksasi mendalam diiringi alunan suara alam.',
    hours: 'Setiap Hari: 09:00 - 21:00',
    highlight: 'Kompres Rempah Hangat & Rendam Kaki Kerajaan',
    image: '/assets/images/villa_panoramic_1794410440783.jpg',
  },
];

const REVIEWS = [
  {
    guestName: 'Dr. Hartono Sasongko',
    residenceCity: 'Jakarta',
    date: 'Menginap Oktober 2026',
    comment:
      'Pemandangan dari Bukit Randu tiada duanya di Bandar Lampung. Terbangun menyambut kabut pagi di atas lembah dan sarapan dengan latar Teluk Lampung sungguh menenteramkan. Pelayanan staf sangat hangat dan profesional.',
  },
  {
    guestName: 'Sarah & David Miller',
    residenceCity: 'Singapura',
    date: 'Menginap September 2026',
    comment:
      'Kami merayakan ulang tahun pernikahan ke-10 di Hillside Villa. Daybed terbuka di teras menghadap hutan tropis sungguh magis. Santap malam di restoran saat senja dengan pemandangan lampu kota sungguh tak terlupakan.',
  },
  {
    guestName: 'Dewi Kartika & Keluarga',
    residenceCity: 'Bandung',
    date: 'Menginap Agustus 2026',
    comment:
      'Keramahan yang luar biasa. Anak-anak sangat menyukai kolam renang infinity dan area tamannya sangat asri terawat. Kami sangat mengapresiasi kemudahan proses booking dan layanan penjemputan bandara yang tepat waktu.',
  },
];

export function renderLandingPage(props: LandingViewProps): string {
  const {
    rooms,
    promos,
    kwitansi,
    cekKodeError,
    searchedCode,
    dbError,
    flash,
    defaultCheckIn,
    defaultCheckOut,
  } = props;

  const roomsPayload = rooms.map(mapRoomToClientDto);

  const promoMap: Record<string, { persen: number; maks: number; nama: string }> = {};
  for (const p of promos) {
    promoMap[String(p.kode_promo).toUpperCase()] = {
      persen: Number(p.persen_diskon),
      maks: Number(p.maks_diskon),
      nama: String(p.nama_promo),
    };
  }
  if (Object.keys(promoMap).length === 0) {
    promoMap.HILLTOP15 = { persen: 15, maks: 1500000, nama: 'Diskon Spesial Reservasi Online 15%' };
    promoMap.BUKITVIP = { persen: 20, maks: 2000000, nama: 'Eksklusif Member Suite Bukit Randu 20%' };
    promoMap.WEEKEND10 = { persen: 10, maks: 1000000, nama: 'Promo Staycation Akhir Pekan 10%' };
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentYear = new Date().getFullYear();

  const flashHtml = flash
    ? `<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div role="alert" class="p-4 rounded-lg border text-sm font-medium flex items-center justify-between ${
          flash.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-emerald-50 border-emerald-200 text-[#005A2B]'
        }">
          <span>${escapeHtml(flash.message)}</span>
        </div>
      </div>`
    : '';

  const dbErrorHtml = dbError
    ? `<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div class="p-4 rounded-lg border bg-amber-50 border-amber-300 text-amber-900 text-xs">
          <strong>Peringatan Koneksi Basis Data PostgreSQL:</strong> ${escapeHtml(dbError)}
        </div>
      </div>`
    : '';

  const cekKodeErrorHtml = cekKodeError
    ? `<div class="mt-4 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">${escapeHtml(cekKodeError)}</div>`
    : '';

  const kwitansiHtml = kwitansi
    ? `<div id="server-kwitansi-card" class="mt-6 p-6 bg-emerald-50/50 border border-[#007A33]/30 rounded-xl">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-200/80">
          <div>
            <span class="text-[11px] font-bold uppercase tracking-widest text-[#007A33]">Bukti Kwitansi Digital Terverifikasi</span>
            <h3 class="text-xl font-serif font-bold text-[#0F1F17] mt-0.5">
              ${escapeHtml(kwitansi.nama_kamar)} (Kamar ${escapeHtml(kwitansi.nomor_kamar)})
            </h3>
            <p class="text-xs text-slate-600 mt-0.5">Tamu: <strong>${escapeHtml(kwitansi.nama_tamu)}</strong> &middot; ${escapeHtml(kwitansi.email_tamu)} &middot; ${escapeHtml(kwitansi.telepon_tamu)}</p>
          </div>
          <div class="flex items-center gap-3">
            <div class="bg-white px-4 py-2 rounded border border-slate-200 text-right">
              <span class="text-[10px] uppercase font-semibold text-slate-400 block">Kode Booking</span>
              <span class="font-mono font-bold text-base text-[#007A33]">${escapeHtml(kwitansi.kode_booking)}</span>
            </div>
            <span class="px-3 py-1.5 rounded text-xs font-semibold bg-[#007A33] text-white">
              ${escapeHtml(kwitansi.status_reservasi)}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-xs border-b border-emerald-200/80">
          <div>
            <span class="text-slate-500 block">Check-In</span>
            <strong class="text-slate-900 font-semibold">${escapeHtml(kwitansi.tgl_checkin)}</strong>
          </div>
          <div>
            <span class="text-slate-500 block">Check-Out</span>
            <strong class="text-slate-900 font-semibold">${escapeHtml(kwitansi.tgl_checkout)} (${kwitansi.jumlah_malam} Malam)</strong>
          </div>
          <div>
            <span class="text-slate-500 block">Promo Digunakan</span>
            <strong class="text-[#007A33] font-mono">${escapeHtml(kwitansi.kode_promo)}</strong>
          </div>
          <div>
            <span class="text-slate-500 block">Pembayaran (${escapeHtml(kwitansi.status_pembayaran)})</span>
            <strong class="text-slate-900">${escapeHtml(kwitansi.metode_pembayaran)}</strong>
          </div>
        </div>

        <div class="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end text-xs">
          <div class="space-y-1 text-slate-600">
            <div class="flex justify-between"><span>Subtotal Kamar:</span><span class="tabular-nums font-medium">${escapeHtml(formatRupiah(kwitansi.subtotal))}</span></div>
            ${
              Number(kwitansi.potongan_diskon) > 0
                ? `<div class="flex justify-between text-[#007A33]"><span>Potongan Promo:</span><span class="tabular-nums font-semibold">-${escapeHtml(formatRupiah(kwitansi.potongan_diskon))}</span></div>`
                : ''
            }
            <div class="flex justify-between"><span>Biaya Layanan Resor (5%):</span><span class="tabular-nums">${escapeHtml(formatRupiah(kwitansi.biaya_layanan))}</span></div>
            <div class="flex justify-between"><span>PPN Pemerintah (10%):</span><span class="tabular-nums">${escapeHtml(formatRupiah(kwitansi.pajak_ppn))}</span></div>
          </div>
          <div class="flex sm:flex-col items-center sm:items-end justify-between gap-2">
            <div class="text-left sm:text-right">
              <span class="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">Total Tagihan Sah</span>
              <span class="text-2xl font-serif font-bold text-[#007A33] tabular-nums">${escapeHtml(formatRupiah(kwitansi.total_tagihan))}</span>
            </div>
            <button
              type="button"
              id="server-print-btn"
              onclick="printSection('server-kwitansi-card')"
              class="no-print inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#007A33] bg-white border border-[#007A33] hover:bg-[#007A33] hover:text-white rounded shadow-xs transition-all cursor-pointer"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              <span>Cetak Kwitansi</span>
            </button>
          </div>
        </div>
      </div>`
    : '';

  const secondaryExperiencesHtml = EXPERIENCES.slice(1)
    .map(
      (exp) => `<div class="reveal-on-scroll group bg-[#F8FAFC] rounded-lg border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
        <div class="relative aspect-[16/9] overflow-hidden bg-slate-100">
          <img src="${escapeHtml(exp.image)}" alt="${escapeHtml(exp.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent"></div>
          <div class="absolute bottom-3 left-4 right-4 text-white">
            <span class="text-xs uppercase font-semibold text-[#D4AF37] tracking-wider block">${escapeHtml(exp.subtitle)}</span>
            <h4 class="text-xl font-serif font-bold text-white mt-0.5">${escapeHtml(exp.title)}</h4>
          </div>
        </div>
        <div class="p-6 flex-1 flex flex-col justify-between">
          <div>
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">${escapeHtml(exp.description)}</p>
            <div class="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between gap-2">
              <span>${escapeHtml(exp.hours)}</span>
              <span class="text-[#007A33] font-medium">${escapeHtml(exp.highlight)}</span>
            </div>
          </div>
          <div class="mt-6 flex justify-end">
            <button
              type="button"
              onclick="openExperienceModal(${escapeHtml(JSON.stringify(exp.title))})"
              class="px-4 py-2 border border-[#007A33] text-[#007A33] hover:bg-[#007A33] hover:text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Reservasi &amp; Pilih Jam
            </button>
          </div>
        </div>
      </div>`
    )
    .join('');

  const reviewsHtml = REVIEWS.map(
    (rev) => `<div class="reveal-on-scroll bg-white p-6 rounded-lg border border-slate-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
      <div>
        <div class="flex items-center gap-1 mb-4 text-[#D4AF37] text-sm">
          ★★★★★ <span class="text-xs font-semibold text-slate-700 ml-2">5.0 / 5.0</span>
        </div>
        <p class="text-xs sm:text-sm text-slate-700 italic leading-relaxed">"${escapeHtml(rev.comment)}"</p>
      </div>
      <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
        <div>
          <h4 class="font-semibold text-slate-900">${escapeHtml(rev.guestName)}</h4>
          <span class="text-slate-500">${escapeHtml(rev.residenceCity)}</span>
        </div>
        <div class="text-right">
          <div class="text-[11px] font-medium text-[#007A33]">Kunjungan Terverifikasi</div>
          <span class="text-[10px] text-slate-400 block">${escapeHtml(rev.date)}</span>
        </div>
      </div>
    </div>`
  ).join('');

  return `<!doctype html>
<html lang="id" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bukit Randu Hospitality | Holiday Inn Lampung Bukit Randu</title>
  <meta name="description" content="Pengalaman reservasi dan keramahan resor bukit mewah dengan pemandangan panorama Bandar Lampung." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            serif: ['"Playfair Display"', 'Georgia', 'serif'],
            sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
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

    @keyframes heroFadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes heroSlowZoom {
      0% { transform: scale(1.02); }
      100% { transform: scale(1.08); }
    }
    @keyframes cardPopIn {
      from { opacity: 0; transform: translateY(16px) scale(0.985); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes modalPopIn {
      from { opacity: 0; transform: translateY(16px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes backdropFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes toastSlideIn {
      from { opacity: 0; transform: translateX(24px) scale(0.95); }
      to { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes toastSlideOut {
      from { opacity: 1; transform: translateX(0) scale(1); }
      to { opacity: 0; transform: translateX(24px) scale(0.95); }
    }
    @keyframes heartPop {
      0% { transform: scale(1); }
      35% { transform: scale(1.38); }
      70% { transform: scale(0.9); }
      100% { transform: scale(1); }
    }
    @keyframes spinQuick {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes btnRippleWave {
      to { transform: scale(2.8); opacity: 0; }
    }

    .hero-anim { animation: heroFadeUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .hero-d1 { animation-delay: 60ms; }
    .hero-d2 { animation-delay: 140ms; }
    .hero-d3 { animation-delay: 220ms; }
    .hero-d4 { animation-delay: 300ms; }
    .hero-d5 { animation-delay: 380ms; }
    .hero-bg-zoom { animation: heroSlowZoom 22s ease-in-out infinite alternate; }

    .reveal-on-scroll {
      opacity: 0;
      transform: translateY(16px);
      transition: opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .reveal-on-scroll.is-visible {
      opacity: 1;
      transform: translateY(0);
    }

    .room-card-enter {
      animation: cardPopIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .modal-dialog-enter {
      animation: modalPopIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .modal-backdrop-enter {
      animation: backdropFadeIn 0.22s ease-out both;
    }
    .toast-enter {
      animation: toastSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .toast-exit {
      animation: toastSlideOut 0.22s ease-in forwards;
    }
    .heart-pop {
      animation: heartPop 0.38s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .spin-once {
      animation: spinQuick 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    }

    button, a.btn-press {
      position: relative;
      overflow: hidden;
      transition: transform 140ms cubic-bezier(0.16, 1, 0.3, 1), background-color 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease;
    }
    button:active:not(:disabled), a.btn-press:active {
      transform: scale(0.96);
    }
    .btn-ripple-wave {
      position: absolute;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.35);
      pointer-events: none;
      transform: scale(0);
      animation: btnRippleWave 0.5s ease-out forwards;
    }
    .btn-ripple-dark .btn-ripple-wave {
      background: rgba(0, 122, 51, 0.18);
    }

    @media (prefers-reduced-motion: reduce) {
      .hero-anim, .hero-bg-zoom, .room-card-enter, .modal-dialog-enter, .modal-backdrop-enter, .toast-enter {
        animation: none !important;
      }
      .reveal-on-scroll {
        opacity: 1 !important;
        transform: none !important;
        transition: none !important;
      }
      button:active:not(:disabled), a.btn-press:active {
        transform: none !important;
      }
    }

    @media print {
      body * { visibility: hidden !important; }
      body.print-mode .print-target,
      body.print-mode .print-target * { visibility: visible !important; }
      body.print-mode .print-target {
        position: fixed;
        inset: 0;
        padding: 24px;
        background: #fff;
        z-index: 9999;
      }
      body.print-mode .no-print { display: none !important; }
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
          <a href="#dining" class="hover:text-[#007A33] transition-colors whitespace-nowrap">Fasilitas</a>
          <a href="#cek-booking" class="hover:text-[#007A33] transition-colors whitespace-nowrap">Cek Booking</a>
          <a href="#arsitektur-db" class="hover:text-[#007A33] transition-colors whitespace-nowrap">Arsitektur SQL</a>
          <a href="#location" class="hover:text-[#007A33] transition-colors whitespace-nowrap">Lokasi</a>
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
            class="btn-press btn-ripple-dark inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-[#005A2B] border border-[#007A33]/35 bg-emerald-50/80 hover:bg-emerald-100 rounded transition-colors whitespace-nowrap shrink-0"
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
            class="btn-ripple-dark lg:hidden p-1.5 text-slate-700 hover:text-[#007A33] focus:outline-none cursor-pointer rounded"
            aria-label="Buka menu navigasi"
            aria-expanded="false"
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
      <a href="#arsitektur-db" aria-hidden="true" tabindex="-1" class="mobile-nav-link hidden py-2 text-base font-medium text-slate-800 hover:text-[#007A33]">Arsitektur SQL (SP, SF, Trigger)</a>
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
    ${flashHtml}
    ${dbErrorHtml}

    <!-- HERO SECTION -->
    <section class="relative min-h-[620px] lg:min-h-[720px] flex items-center justify-center overflow-hidden bg-[#0F1F17]">
      <div class="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/assets/images/bukit_randu_hero_1794410439341.jpg"
          alt="Resor Bukit Randu dengan pemandangan panorama Teluk Bandar Lampung"
          class="w-full h-full object-cover object-center hero-bg-zoom"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-[#0F1F17] via-[#0F1F17]/50 to-[#0F1F17]/30"></div>
        <div class="absolute inset-0 bg-black/20"></div>
      </div>

      <div class="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center">
        <div class="hero-anim hero-d1 flex flex-wrap items-center justify-center gap-2 mb-6">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[#D4AF37] text-xs font-semibold uppercase tracking-[0.08em]">
            <svg class="w-3.5 h-3.5 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
            <span>Destinasi Ikonik Puncak Bukit Bandar Lampung</span>
          </div>

          <div class="relative group" id="weather-badge-wrapper">
            <button
              type="button"
              id="weather-badge-btn"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
            >
              <svg class="w-3.5 h-3.5 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/></svg>
              <span>24&deg;C Sejuk</span>
              <span class="text-white/40">&middot;</span>
              <span>Angin Lembah 11 km/j</span>
            </button>
            <div id="weather-tooltip" class="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white text-slate-800 rounded-lg shadow-xl text-left text-xs border border-slate-200 z-30">
              <div class="font-semibold text-[#007A33] mb-1">Mikroklimat Puncak Bukit</div>
              <p class="text-[11px] text-slate-600 leading-relaxed">
                Ketinggian 216m menghasilkan suhu udara lebih sejuk 3-4&deg;C dibandingkan kawasan pesisir bawah Bandar Lampung.
              </p>
            </div>
          </div>
        </div>

        <h1 class="hero-anim hero-d2 text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-[1.15] mb-6" style="text-wrap: balance;">
          Kemewahan Tenang di Atas Panorama Teluk Lampung
        </h1>

        <p class="hero-anim hero-d3 max-w-2xl mx-auto text-base sm:text-lg text-slate-200 font-normal leading-relaxed mb-10">
          Nikmati ketenangan di ketinggian perbukitan. Rasakan kehangatan keramahan khas Nusantara, kolam renang tanpa batas tepi tebing, dan santap malam romantis 216 meter di atas gemerlap kota.
        </p>

        <div class="hero-anim hero-d4 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <a href="#reservation-bar" class="btn-press w-full sm:w-auto px-8 py-3.5 bg-[#007A33] hover:bg-[#005A2B] text-white font-semibold text-xs tracking-wider uppercase rounded shadow-lg hover:shadow-xl transition-all text-center">
            Cek Ketersediaan Kamar
          </a>
          <a href="#suites" class="btn-press w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-[#D4AF37] font-semibold text-xs tracking-wider uppercase rounded backdrop-blur-xs transition-all text-center">
            Jelajahi Suite &amp; Villa
          </a>
        </div>

        <div class="hero-anim hero-d5 mt-14 pt-8 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-12 w-full text-slate-200">
          <div class="flex flex-col items-center">
            <div class="text-white font-serif text-2xl font-bold">216 m</div>
            <span class="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold mt-1">Di Atas Permukaan Laut</span>
            <span class="text-xs text-slate-300 mt-0.5">Hembusan angin bukit nan sejuk</span>
          </div>
          <div class="flex flex-col items-center">
            <div class="text-white font-serif text-2xl font-bold">360&deg;</div>
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
            <input id="bar-checkin" type="date" value="${escapeHtml(defaultCheckIn)}" min="${escapeHtml(todayStr)}" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
          </div>

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
            <input id="bar-checkout" type="date" value="${escapeHtml(defaultCheckOut)}" min="${escapeHtml(defaultCheckIn)}" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
          </div>

          <div id="guest-dropdown-wrapper" class="lg:col-span-3 bg-[#F8FAFC] border border-slate-200/80 rounded p-3 flex flex-col justify-between relative">
            <div class="flex items-center justify-between text-slate-500 mb-1">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Tamu &amp; Kamar</span>
              <svg class="w-3.5 h-3.5 text-[#007A33]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <button type="button" id="guest-dropdown-btn" class="btn-ripple-dark text-left flex items-baseline gap-2 w-full cursor-pointer focus:outline-none">
              <span id="bar-guest-pad" class="text-3xl font-serif font-bold text-[#0F1F17] tabular-nums">02</span>
              <div class="flex flex-col text-xs text-slate-600">
                <span id="bar-guest-label" class="font-medium text-slate-900">2 Tamu</span>
                <span class="text-slate-500">1 Kamar / Villa</span>
              </div>
            </button>

            <div id="guest-dropdown-popover" class="hidden modal-dialog-enter absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-slate-200 p-4 z-50">
              <div class="flex items-center justify-between">
                <div class="text-sm">
                  <span class="font-semibold text-slate-900 block">Total Tamu</span>
                  <span class="text-xs text-slate-500">Dewasa &amp; Anak-anak</span>
                </div>
                <div class="flex items-center gap-3">
                  <button type="button" id="guest-dec-btn" class="btn-ripple-dark w-8 h-8 rounded border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 cursor-pointer" aria-label="Kurangi jumlah tamu">-</button>
                  <span id="guest-popover-val" class="font-serif font-bold text-lg w-6 text-center tabular-nums">2</span>
                  <button type="button" id="guest-inc-btn" class="btn-ripple-dark w-8 h-8 rounded border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 cursor-pointer" aria-label="Tambah jumlah tamu">+</button>
                </div>
              </div>
              <div class="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                <button type="button" id="guest-done-btn" class="btn-ripple-dark text-xs font-semibold uppercase tracking-wider text-[#007A33] hover:underline cursor-pointer px-2 py-1 rounded">Selesai</button>
              </div>
            </div>
          </div>

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
              class="btn-ripple-dark inline-flex items-center gap-1 font-mono font-semibold text-[#007A33] bg-[#007A33]/10 px-2.5 py-1 rounded text-[11px] hover:bg-[#007A33]/20 cursor-pointer transition-colors"
            >
              <span>HILLTOP15</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- FITUR CEK KODE BOOKING & KWITANSI DIGITAL -->
    <section id="cek-booking" class="pt-14 pb-4 max-w-6xl mx-auto px-4 sm:px-6 reveal-on-scroll">
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 hover:shadow-md transition-shadow">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span class="text-[11px] font-semibold uppercase tracking-widest text-[#D4AF37] block">Layanan Mandiri Tamu &middot; PostgreSQL Real-Time</span>
            <h2 class="text-xl sm:text-2xl font-serif font-bold text-[#0F1F17] mt-0.5">Cek Kode Booking &amp; Kwitansi Digital</h2>
            <p class="text-xs text-slate-600 mt-1">Masukkan kode reservasi Anda (cth. <span class="font-mono font-semibold text-[#007A33]">BRH-882410</span>) untuk melihat status kamar dan mencetak bukti kwitansi digital.</p>
          </div>
          <form id="cek-kode-form" method="GET" action="/#cek-booking" class="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              name="cek_kode"
              value="${escapeHtml(searchedCode)}"
              placeholder="Masukkan Kode BRH-XXXXXX"
              class="flex-1 md:w-56 px-3.5 py-2.5 text-xs font-mono uppercase border border-slate-300 rounded focus:outline-none focus:border-[#007A33]"
            />
            <button
              type="submit"
              id="cek-kode-submit-btn"
              class="px-5 py-2.5 bg-[#005A2B] hover:bg-[#007A33] text-white text-xs font-semibold uppercase tracking-wider rounded cursor-pointer transition-colors whitespace-nowrap"
            >
              Cek Status
            </button>
          </form>
        </div>

        ${cekKodeErrorHtml}
        ${kwitansiHtml}
      </div>
    </section>

    <!-- SUITES & VILLAS CATALOG SECTION -->
    <section id="suites" class="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal-on-scroll">
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
    <section id="dining" class="py-20 bg-white border-y border-slate-200 reveal-on-scroll">
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

        <div class="reveal-on-scroll mb-14 rounded-xl border border-slate-200 bg-[#F8FAFC] overflow-hidden shadow-xs hover:shadow-lg transition-shadow">
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
          ${secondaryExperiencesHtml}
        </div>
      </div>
    </section>

    <!-- GUEST REVIEWS -->
    <section id="reviews" class="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal-on-scroll">
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
        ${reviewsHtml}
      </div>
    </section>

    <!-- LOCATION & CONCIERGE SECTION -->
    <section id="location" class="py-20 bg-[#F8FAFC] border-t border-slate-200 reveal-on-scroll">
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
            <div id="concierge-success" class="hidden p-6 bg-emerald-50 border border-emerald-200 text-center rounded-lg space-y-3 modal-dialog-enter">
              <div class="w-10 h-10 rounded-full bg-[#007A33]/15 text-[#007A33] flex items-center justify-center mx-auto font-bold text-lg">&#10003;</div>
              <h4 class="font-serif font-bold text-slate-900 text-lg">Pesan Berhasil Terkirim</h4>
              <p class="text-xs text-slate-600">Terima kasih. Tim layanan tamu Bukit Randu akan segera menghubungi Anda.</p>
              <button
                type="button"
                id="concierge-reset-btn"
                class="btn-ripple-dark inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#007A33] bg-white border border-[#007A33] hover:bg-[#007A33] hover:text-white rounded cursor-pointer transition-colors"
              >
                Kirim Pesan Lain
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ARSITEKTUR BASIS DATA: TRIGGER, SP, SF, MULTI-JOIN & SUBQUERY -->
    ${renderRdbmsArchitectureSection()}
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
            <li><a href="#arsitektur-db" class="hover:text-white transition-colors">Penjelasan SP, SF, Trigger &amp; Join</a></li>
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
        <p>&copy; ${currentYear} Bukit Randu Hotel &amp; Resort. Hak cipta dilindungi undang-undang.</p>
        <div class="flex items-center gap-6">
          <a href="/Dokumentasi_RDBMS_Bukit_Randu.pdf" target="_blank" class="hover:text-slate-300">Dokumentasi SQL (PDF)</a>
          <a href="/admin/login" class="hover:text-slate-300">Admin Portal</a>
        </div>
      </div>
    </div>
  </footer>

  <!-- ROOM DETAIL MODAL -->
  <div id="room-detail-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="room-detail-title">
    <div id="detail-backdrop" class="modal-backdrop-enter fixed inset-0 bg-[#0F1F17]/65 backdrop-blur-xs"></div>
    <div class="modal-dialog-enter relative bg-white w-full max-w-4xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col md:flex-row my-auto max-h-[92vh] md:h-[min(640px,90vh)]">
      <div class="relative w-full md:w-[44%] h-48 sm:h-56 md:h-full bg-slate-900 overflow-hidden shrink-0">
        <img id="detail-img" src="" alt="" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-[#0F1F17]/90 via-[#0F1F17]/25 to-black/20"></div>
        <button type="button" id="detail-close-mobile" class="md:hidden absolute top-3 right-3 z-20 p-2 bg-black/50 hover:bg-black/75 text-white rounded-full cursor-pointer" aria-label="Tutup jendela rincian">&#10005;</button>
        <div class="absolute top-4 left-4 right-14 md:right-4">
          <span id="detail-view" class="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-black/55 backdrop-blur-md border border-[#D4AF37]/40 text-[11px] font-semibold uppercase tracking-wider text-[#F3E5AB]"></span>
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
            <span class="text-xs text-slate-500">Bukit Randu Hotel &amp; Resort &middot; Bandar Lampung</span>
          </div>
          <button type="button" id="detail-close-desktop" class="btn-ripple-dark p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-full cursor-pointer" aria-label="Tutup jendela rincian">&#10005;</button>
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
            <button type="button" id="detail-close-footer" class="btn-ripple-dark hidden sm:inline-flex px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer whitespace-nowrap rounded">Tutup</button>
            <button type="button" id="detail-reserve-btn" class="px-4 sm:px-5 py-2.5 bg-[#007A33] hover:bg-[#005A2B] text-white text-xs font-semibold uppercase tracking-wider rounded-md shadow-xs flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0">
              <span>Pesan Suite Ini &rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 3-STEP BOOKING MODAL -->
  <div id="booking-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
    <div id="booking-backdrop" class="modal-backdrop-enter fixed inset-0 bg-[#0F1F17]/60 backdrop-blur-xs"></div>
    <div class="modal-dialog-enter relative bg-white w-full max-w-4xl rounded-lg shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col my-auto max-h-[92vh]">
      <div class="px-6 py-4 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between shrink-0">
        <div>
          <span id="booking-step-label" class="text-[11px] font-semibold uppercase tracking-wider text-[#007A33]">Langkah 1 dari 3: Rincian Reservasi</span>
          <h3 id="booking-modal-title" class="text-lg font-serif font-bold text-[#0F1F17]"></h3>
        </div>
        <button type="button" id="booking-close-btn" class="btn-ripple-dark p-2 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer" aria-label="Tutup jendela reservasi">&#10005;</button>
      </div>

      <div class="p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
        <div id="bm-error-box" role="alert" class="hidden p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium"></div>
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
              <input id="bm-checkin" type="date" min="${escapeHtml(todayStr)}" class="w-full font-medium text-slate-800 text-sm focus:outline-none" />
            </div>
            <div class="p-3 border border-slate-200 rounded bg-white">
              <label for="bm-checkout" class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Tanggal Check-Out</label>
              <input id="bm-checkout" type="date" min="${escapeHtml(todayStr)}" class="w-full font-medium text-slate-800 text-sm focus:outline-none" />
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
                <span>Total Tagihan (Termasuk Layanan &amp; Pajak)</span>
                <span id="bm-total" class="text-xl font-serif font-bold text-[#007A33] tabular-nums"></span>
              </div>
            </div>
          </div>
        </div>

        <form id="booking-step-2" class="hidden space-y-4">
          <div class="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-[#007A33]">
            Reservasi Anda diproses dan dikunci secara atomik di database PostgreSQL.
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

        <div id="booking-step-3" class="hidden space-y-5">
          <div id="printable-voucher" class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div class="bg-[#0F1F17] text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span class="text-[10px] font-semibold uppercase tracking-widest text-[#D4AF37] block">Struk Pembayaran &amp; Konfirmasi Reservasi Resmi</span>
                <h4 class="text-xl font-serif font-bold text-white mt-0.5">Bukit Randu Hotel &amp; Resort</h4>
                <p class="text-[11px] text-slate-300">Jl. Kamboja No. 1-2, Kebon Jeruk, Bandar Lampung</p>
              </div>
              <div class="bg-white/10 border border-white/15 px-3.5 py-2 rounded text-left sm:text-right shrink-0">
                <span class="text-[10px] uppercase font-semibold text-slate-300 block">Kode Booking</span>
                <span id="voucher-code" class="font-mono font-bold text-base text-[#D4AF37]"></span>
              </div>
            </div>

            <div class="p-5 space-y-4 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-dashed border-slate-300">
                <div>
                  <span class="text-[10px] uppercase font-semibold text-slate-400 block">No. Referensi Struk</span>
                  <span id="voucher-ref" class="font-mono font-semibold text-slate-800 block mt-0.5"></span>
                </div>
                <div>
                  <span class="text-[10px] uppercase font-semibold text-slate-400 block">Waktu Terbit</span>
                  <span id="voucher-time" class="text-slate-700 font-medium block mt-0.5 tabular-nums"></span>
                </div>
                <div class="sm:text-right">
                  <span class="text-[10px] uppercase font-semibold text-slate-400 block">Status Transaksi</span>
                  <span id="voucher-status" class="inline-block mt-0.5 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[#007A33] font-bold"></span>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-dashed border-slate-300">
                <div>
                  <span class="font-semibold text-slate-400 uppercase text-[10px] block">Data Tamu Utama</span>
                  <span id="voucher-guest" class="font-semibold text-slate-900 text-sm block mt-0.5"></span>
                  <span id="voucher-guest-email" class="text-[11px] text-slate-500 block mt-0.5"></span>
                </div>
                <div>
                  <span class="font-semibold text-slate-400 uppercase text-[10px] block">Akomodasi &amp; Menginap</span>
                  <span id="voucher-room" class="font-serif font-bold text-slate-900 text-sm block mt-0.5"></span>
                  <span id="voucher-dates" class="text-[11px] text-slate-700 font-medium block mt-0.5"></span>
                  <span id="voucher-guests" class="text-[11px] text-slate-500 block mt-0.5"></span>
                </div>
              </div>

              <div id="voucher-notes-row" class="hidden pb-3 border-b border-dashed border-slate-300">
                <span class="text-[10px] uppercase font-semibold text-slate-400 block">Permintaan Khusus Tamu</span>
                <span id="voucher-notes" class="text-slate-700 italic block mt-0.5"></span>
              </div>

              <div class="space-y-1.5 bg-[#F8FAFC] border border-slate-200 rounded-lg p-4">
                <div class="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">Rincian Biaya Menginap</div>
                <div class="flex justify-between text-slate-700">
                  <span>Subtotal Tarif Kamar</span>
                  <span id="voucher-subtotal" class="tabular-nums font-medium"></span>
                </div>
                <div id="voucher-discount-row" class="hidden flex justify-between text-[#007A33]">
                  <span>Potongan Promo (<span id="voucher-discount-code" class="font-mono"></span>)</span>
                  <span id="voucher-discount" class="tabular-nums font-semibold"></span>
                </div>
                <div class="flex justify-between text-slate-700">
                  <span>Biaya Layanan Resor (5%)</span>
                  <span id="voucher-service" class="tabular-nums font-medium"></span>
                </div>
                <div class="flex justify-between text-slate-700">
                  <span>Pajak Pemerintah PPN (10%)</span>
                  <span id="voucher-tax" class="tabular-nums font-medium"></span>
                </div>
                <div class="pt-2.5 mt-2 border-t border-dashed border-slate-300 flex items-center justify-between gap-3">
                  <div>
                    <span class="text-xs font-bold text-[#0F1F17] block">Total Pembayaran Sah</span>
                    <span id="voucher-payment" class="text-[11px] text-slate-500 block mt-0.5"></span>
                  </div>
                  <span id="voucher-total" class="text-2xl font-serif font-bold text-[#007A33] tabular-nums shrink-0"></span>
                </div>
              </div>

              <p class="text-[11px] text-slate-500 text-center pt-1">
                Tunjukkan kode booking ini di meja Front Office saat Check-In. Simpan atau cetak struk ini sebagai bukti reservasi sah.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="px-6 py-4 bg-[#F8FAFC] border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <button type="button" id="bm-cancel-btn" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer">Batal</button>
        <div class="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <button type="button" id="bm-back-btn" class="hidden px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer">Kembali ke Tarif</button>
          <button type="button" id="bm-next-btn" class="px-6 py-2.5 bg-[#007A33] hover:bg-[#005A2B] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-xs cursor-pointer">Lanjut ke Data Tamu &rarr;</button>
          <button type="submit" form="booking-step-2" id="bm-submit-btn" class="hidden px-6 py-2.5 bg-[#007A33] hover:bg-[#005A2B] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-xs cursor-pointer">Konfirmasi &amp; Kunci Reservasi &#10003;</button>
          <a id="bm-receipt-link" href="#" target="_blank" rel="noopener noreferrer" class="btn-press btn-ripple-dark hidden px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 bg-white hover:bg-slate-50 rounded whitespace-nowrap">Buka Struk Lengkap</a>
          <button type="button" id="bm-print-btn" onclick="printSection('printable-voucher')" class="btn-ripple-dark hidden px-4 py-2 text-xs font-semibold text-[#007A33] border border-[#007A33] rounded cursor-pointer whitespace-nowrap">Cetak Struk</button>
          <button type="button" id="bm-done-btn" class="hidden px-6 py-2.5 bg-[#007A33] hover:bg-[#005A2B] text-white text-xs font-semibold uppercase tracking-wider rounded cursor-pointer whitespace-nowrap">Selesai</button>
        </div>
      </div>
    </div>
  </div>

  <!-- EXPERIENCE / TABLE RESERVATION MODAL -->
  <div id="experience-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
    <div onclick="closeExperienceModal()" class="modal-backdrop-enter fixed inset-0 bg-[#0F1F17]/60 backdrop-blur-xs"></div>
    <div class="modal-dialog-enter relative bg-white w-full max-w-lg rounded-lg shadow-2xl border border-slate-200 z-10 overflow-hidden">
      <div class="px-6 py-4 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between">
        <div>
          <span class="text-[11px] font-semibold uppercase tracking-wider text-[#007A33]">Pemesanan Khusus Tamu</span>
          <h3 id="exp-modal-title" class="font-serif font-bold text-slate-900 text-lg"></h3>
        </div>
        <button type="button" onclick="closeExperienceModal()" class="p-1.5 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer">&#10005;</button>
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
              <input type="date" value="${escapeHtml(defaultCheckIn)}" required class="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:border-[#007A33] focus:outline-none" />
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
          <p class="text-xs text-slate-600">Tim Ma&icirc;tre d'h&ocirc;tel Bukit Randu telah mencatat permintaan meja/fasilitas Anda.</p>
          <button type="button" onclick="closeExperienceModal()" class="px-6 py-2 bg-[#007A33] text-white text-xs font-semibold uppercase rounded cursor-pointer">Tutup</button>
        </div>
      </div>
    </div>
  </div>

  <!-- TOAST CONTAINER -->
  <div id="toast-container" class="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"></div>

  <script>
    let ROOMS_DATA = ${safeJson(roomsPayload)};
    const PROMO_MAP = ${safeJson(promoMap)};

    let currency = 'IDR';
    let selectedCategory = 'all';
    let sortBy = 'featured';
    let guestCount = 2;
    let favorites = JSON.parse(localStorage.getItem('brh_favorites') || '[]');
    let activeRoom = null;
    let bookingStep = 1;
    let lastFavKode = null;
    let syncSeq = 0;

    const getRoomsSignature = (list) =>
      (list || [])
        .map((r) => [r.id_kamar, r.status_ketersediaan, r.is_bookable, r.basePriceIdr, r.name].join(':'))
        .join('|');

    const getRoomBlockInfo = (room) => {
      if (!room) return { btnText: 'Tidak Tersedia', detailBtnText: 'Tidak Tersedia', badgeCls: 'bg-slate-700', badgeText: 'Tidak Tersedia', toastTitle: 'Kamar Tidak Tersedia', toastDesc: 'Unit kamar tidak ditemukan.' };
      if (room.status_ketersediaan === 'Terisi') {
        return {
          btnText: 'Sedang Terisi',
          detailBtnText: 'Sedang Terisi',
          badgeCls: 'bg-amber-600',
          badgeText: 'Terisi',
          toastTitle: 'Kamar Sedang Terisi',
          toastDesc: 'Unit ini sedang berstatus Terisi oleh tamu dan tidak dapat dipesan saat ini.',
        };
      }
      if (room.status_ketersediaan === 'Pemeliharaan') {
        return {
          btnText: 'Pemeliharaan',
          detailBtnText: 'Dalam Pemeliharaan',
          badgeCls: 'bg-red-700',
          badgeText: 'Pemeliharaan',
          toastTitle: 'Kamar Dalam Pemeliharaan',
          toastDesc: 'Unit ini sedang dirawat teknisi kami. Silakan pilih suite lain yang tersedia.',
        };
      }
      if (room.is_bookable === false || room.status_ketersediaan !== 'Tersedia') {
        return {
          btnText: 'Terpesan di Tanggal Ini',
          detailBtnText: 'Terpesan di Tanggal Ini',
          badgeCls: 'bg-slate-700',
          badgeText: 'Terpesan',
          toastTitle: 'Tanggal Tidak Tersedia',
          toastDesc: 'Kamar sudah dipesan pada rentang tanggal yang dipilih. Silakan pilih tanggal atau suite lain.',
        };
      }
      return null;
    };

    const escHtml = (value) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const parseUtcDate = (str) => {
      if (!str || !/^\\d{4}-\\d{2}-\\d{2}$/.test(str)) return null;
      const d = new Date(str + 'T00:00:00Z');
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const addUtcDays = (str, days) => {
      const d = parseUtcDate(str) || new Date();
      d.setUTCDate(d.getUTCDate() + days);
      return d.toISOString().slice(0, 10);
    };

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

    const showToast = (title, desc = '', isError = false) => {
      const container = document.getElementById('toast-container');
      const el = document.createElement('div');
      el.className = 'toast-enter pointer-events-auto bg-white/95 backdrop-blur-md rounded-lg shadow-xl border p-3.5 flex items-start justify-between gap-3 ' +
        (isError ? 'border-red-300 bg-red-50/95' : 'border-slate-200');
      el.innerHTML =
        '<div class="flex items-start gap-2.5">' +
          '<span class="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ' +
            (isError ? 'bg-red-100 text-red-700' : 'bg-[#007A33]/15 text-[#007A33]') + '">' +
            (isError ? '!' : '✓') +
          '</span>' +
          '<div>' +
            '<div class="text-xs font-semibold ' + (isError ? 'text-red-800' : 'text-[#007A33]') + '">' + escHtml(title) + '</div>' +
            (desc ? '<div class="text-[11px] ' + (isError ? 'text-red-700' : 'text-slate-600') + ' mt-0.5">' + escHtml(desc) + '</div>' : '') +
          '</div>' +
        '</div>';
      container.appendChild(el);
      setTimeout(() => {
        el.classList.remove('toast-enter');
        el.classList.add('toast-exit');
        setTimeout(() => el.remove(), 220);
      }, 3300);
    };

    window.printSection = (targetId) => {
      const el = document.getElementById(targetId);
      if (!el) return;
      document.querySelectorAll('.print-target').forEach((n) => n.classList.remove('print-target'));
      el.classList.add('print-target');
      document.body.classList.add('print-mode');
      const cleanup = () => {
        document.body.classList.remove('print-mode');
        el.classList.remove('print-target');
      };
      window.addEventListener('afterprint', cleanup, { once: true });
      window.print();
      setTimeout(cleanup, 1000);
    };

    const spawnButtonRipple = (target, e) => {
      const rect = target.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const size = Math.max(rect.width, rect.height);
      const clientX = typeof e.clientX === 'number' && e.clientX > 0 ? e.clientX : rect.left + rect.width / 2;
      const clientY = typeof e.clientY === 'number' && e.clientY > 0 ? e.clientY : rect.top + rect.height / 2;
      const wave = document.createElement('span');
      wave.className = 'btn-ripple-wave';
      wave.style.width = size + 'px';
      wave.style.height = size + 'px';
      wave.style.left = (clientX - rect.left - size / 2) + 'px';
      wave.style.top = (clientY - rect.top - size / 2) + 'px';
      target.appendChild(wave);
      setTimeout(() => wave.remove(), 520);
    };

    const updateDateDisplays = () => {
      const ci = document.getElementById('bar-checkin').value;
      const co = document.getElementById('bar-checkout').value;
      const formatParts = (str) => {
        const d = parseUtcDate(str) || new Date();
        return {
          day: String(d.getUTCDate()).padStart(2, '0'),
          month: d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric', timeZone: 'UTC' }),
          weekday: d.toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'UTC' }),
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
      const d1 = parseUtcDate(ci);
      const d2 = parseUtcDate(co);
      if (!d1 || !d2) return 1;
      const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
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

      const list = ROOMS_DATA.filter((r) => {
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
      grid.innerHTML = list.map((r, idx) => {
        const isFav = favorites.includes(r.kode_kamar);
        const block = getRoomBlockInfo(r);
        const rawSubtotal = r.basePriceIdr * nights;
        let diskonTotal = 0;
        if (promoInfo && discountPct > 0) {
          diskonTotal = Math.round(rawSubtotal * (discountPct / 100));
          if (promoInfo.maks > 0 && diskonTotal > promoInfo.maks) {
            diskonTotal = promoInfo.maks;
          }
        }
        const totalAfterDiscount = Math.max(0, rawSubtotal - diskonTotal);
        const effectiveNightly = Math.round(totalAfterDiscount / nights);

        const amenitiesHtml = (r.amenities || []).slice(0, 3).map((a) =>
          '<div class="flex items-center gap-1.5"><span class="text-[#D4AF37] font-bold">✓</span><span>' + escHtml(a) + '</span></div>'
        ).join('');
        const statusBadge = block
          ? '<span class="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ' + block.badgeCls + ' text-white rounded shadow-xs">' + escHtml(block.badgeText) + '</span>'
          : '';
        const heartAnimClass = lastFavKode === r.kode_kamar ? ' heart-pop' : '';
        const actionButtonHtml = block
          ? '<button type="button" aria-disabled="true" data-room-blocked="1" onclick="showToast(' + JSON.stringify(block.toastTitle) + ', ' + JSON.stringify(block.toastDesc) + ', true)" class="btn-ripple-dark px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 rounded cursor-not-allowed whitespace-nowrap">' + escHtml(block.btnText) + '</button>'
          : '<button type="button" onclick="openBookingModal(' + r.id_kamar + ')" class="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-[#007A33] hover:bg-[#005A2B] rounded shadow-xs transition-colors cursor-pointer whitespace-nowrap">Pesan →</button>';

        return (
          '<article data-room-id="' + r.id_kamar + '" data-room-status="' + escHtml(r.status_ketersediaan) + '" data-room-bookable="' + String(Boolean(!block)) + '" class="room-card-enter group bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-[#D4AF37]/60 transition-all duration-300 flex flex-col justify-between" style="animation-delay:' + (idx * 65) + 'ms">' +
            '<div class="relative aspect-[16/10] overflow-hidden bg-slate-100">' +
              '<img src="' + escHtml(r.image) + '" alt="' + escHtml(r.name) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />' +
              '<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>' +
              '<div class="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">' +
                '<div class="flex flex-wrap gap-1.5">' +
                  '<span class="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-white/95 text-[#007A33] border border-[#007A33]/20 rounded shadow-xs">' + escHtml(r.view) + '</span>' +
                  (r.featured ? '<span class="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-[#D4AF37] text-[#0F1F17] rounded shadow-xs">Suite Pilihan</span>' : '') +
                  statusBadge +
                '</div>' +
                '<button type="button" onclick="toggleFavorite(' + r.id_kamar + ')" aria-label="Simpan ' + escHtml(r.name) + ' ke favorit" class="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center cursor-pointer shrink-0' + heartAnimClass + '">' +
                  '<span class="' + (isFav ? 'text-rose-400' : 'text-white') + '">' + (isFav ? '♥' : '♡') + '</span>' +
                '</button>' +
              '</div>' +
              '<div class="absolute bottom-3 left-3 right-3 flex items-center gap-3 text-xs text-white/95 font-medium flex-wrap">' +
                '<span class="bg-black/45 px-2 py-0.5 rounded">' + escHtml(r.sqm) + ' m²</span>' +
                '<span class="bg-black/45 px-2 py-0.5 rounded">' + escHtml(r.bedType) + '</span>' +
                '<span class="bg-black/45 px-2 py-0.5 rounded">Hingga ' + escHtml(r.maxGuests) + ' Tamu</span>' +
              '</div>' +
            '</div>' +
            '<div class="p-5 flex-1 flex flex-col justify-between">' +
              '<div>' +
                '<h3 class="text-xl sm:text-2xl font-serif font-semibold text-[#0F1F17] group-hover:text-[#007A33] transition-colors leading-snug">' + escHtml(r.name) + '</h3>' +
                '<p class="text-xs sm:text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">' + escHtml(r.tagline) + '</p>' +
                '<div class="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">' + amenitiesHtml + '</div>' +
              '</div>' +
              '<div class="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-3.5">' +
                '<div class="flex items-end justify-between gap-3 flex-wrap">' +
                  '<div>' +
                    '<span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block whitespace-nowrap">Tarif per Malam (No. ' + escHtml(r.nomor_kamar) + ')</span>' +
                    '<div class="flex items-baseline gap-1.5 mt-0.5 whitespace-nowrap">' +
                      (diskonTotal > 0 ? '<span class="text-xs text-slate-500 line-through tabular-nums">' + fmtCurrency(r.basePriceIdr) + '</span>' : '') +
                      '<span class="text-xl font-serif font-bold text-[#0F1F17] tabular-nums">' + fmtCurrency(effectiveNightly) + '</span>' +
                      '<span class="text-xs text-slate-600">/ malam</span>' +
                    '</div>' +
                  '</div>' +
                  (nights > 1 ? '<span class="text-[11px] font-medium text-slate-600 tabular-nums whitespace-nowrap">Total ' + nights + ' mlm: ' + fmtCurrency(totalAfterDiscount) + '</span>' : '') +
                '</div>' +
                '<div class="flex items-center gap-2 w-full">' +
                  '<button type="button" onclick="openDetailModal(' + r.id_kamar + ')" class="btn-ripple-dark px-4 py-2.5 text-xs font-semibold text-[#007A33] border border-[#D4AF37] hover:bg-[#D4AF37]/10 rounded transition-colors cursor-pointer whitespace-nowrap">Detail</button>' +
                  '<div class="flex-1 flex justify-end">' + actionButtonHtml + '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</article>'
        );
      }).join('');
      lastFavKode = null;
    };

    window.toggleFavorite = (idKamar) => {
      const room = ROOMS_DATA.find((r) => r.id_kamar === idKamar);
      if (!room) return;
      const kode = room.kode_kamar;
      lastFavKode = kode;
      if (favorites.includes(kode)) {
        favorites = favorites.filter((x) => x !== kode);
        showToast('Dihapus dari Favorit', room.name + ' dihapus dari daftar favorit.');
      } else {
        favorites.push(kode);
        showToast('Disimpan ke Favorit', room.name + ' ditambahkan ke daftar pilihan Anda.');
      }
      localStorage.setItem('brh_favorites', JSON.stringify(favorites));
      renderRooms();
    };

    const syncDetailModalButton = (room) => {
      const reserveBtn = document.getElementById('detail-reserve-btn');
      if (!reserveBtn || !room) return;
      const block = getRoomBlockInfo(room);
      if (block) {
        reserveBtn.textContent = block.detailBtnText;
        reserveBtn.setAttribute('aria-disabled', 'true');
        reserveBtn.className = 'btn-ripple-dark px-4 sm:px-5 py-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold uppercase tracking-wider rounded-md cursor-not-allowed whitespace-nowrap shrink-0';
      } else {
        reserveBtn.innerHTML = '<span>Pesan Suite Ini &rarr;</span>';
        reserveBtn.removeAttribute('aria-disabled');
        reserveBtn.className = 'px-4 sm:px-5 py-2.5 bg-[#007A33] hover:bg-[#005A2B] text-white text-xs font-semibold uppercase tracking-wider rounded-md shadow-xs flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0';
      }
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
      document.getElementById('detail-amenities').innerHTML = (room.amenities || []).map((a) =>
        '<div class="flex items-center gap-2.5 px-3 py-2 bg-[#F8FAFC] rounded-md border border-slate-200/70">' +
          '<span class="w-4 h-4 rounded-full bg-[#007A33]/15 text-[#007A33] flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>' +
          '<span class="leading-snug">' + escHtml(a) + '</span>' +
        '</div>'
      ).join('');
      syncDetailModalButton(room);
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
        ? '✓ ' + promoInfo.nama + ' (' + promoInfo.persen + '%) diterapkan'
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
      document.getElementById('bm-receipt-link').classList.toggle('hidden', step !== 3);
      document.getElementById('bm-print-btn').classList.toggle('hidden', step !== 3);
      document.getElementById('bm-done-btn').classList.toggle('hidden', step !== 3);

      const errBox = document.getElementById('bm-error-box');
      if (errBox && step === 3) {
        errBox.classList.add('hidden');
      }

      const labelMap = {
        1: 'Langkah 1 dari 3: Rincian Reservasi',
        2: 'Langkah 2 dari 3: Data Tamu & Kontak',
        3: 'Reservasi Terkonfirmasi & Struk Resmi',
      };
      document.getElementById('booking-step-label').textContent = labelMap[step];
      if (step === 3) {
        document.getElementById('booking-modal-title').textContent = 'Struk Pembayaran & Reservasi';
      } else if (activeRoom) {
        document.getElementById('booking-modal-title').textContent = activeRoom.name;
      }
    };

    window.openBookingModal = (idKamar) => {
      const requested = ROOMS_DATA.find((r) => r.id_kamar === idKamar);
      const room = requested || ROOMS_DATA.find((r) => !getRoomBlockInfo(r));
      if (!room) {
        showToast('Semua Kamar Sedang Penuh', 'Saat ini tidak ada kamar berstatus Tersedia untuk dipesan.', true);
        return;
      }
      const block = getRoomBlockInfo(room);
      if (block) {
        showToast(block.toastTitle, block.toastDesc, true);
        return;
      }
      activeRoom = room;
      const barCi = document.getElementById('bar-checkin').value;
      const barCo = document.getElementById('bar-checkout').value;
      document.getElementById('bm-img').src = room.image;
      document.getElementById('bm-view').textContent = room.view;
      document.getElementById('bm-name').textContent = room.name + ' (No. ' + room.nomor_kamar + ')';
      document.getElementById('bm-specs').textContent = room.bedType + ' · ' + room.sqm + ' m² · Hingga ' + room.maxGuests + ' tamu';
      document.getElementById('bm-checkin').value = barCi;
      document.getElementById('bm-checkout').value = barCo;
      document.getElementById('bm-checkout').min = addUtcDays(barCi, 1);
      document.getElementById('bm-promo').value = document.getElementById('bar-promo-input').value;
      document.getElementById('bm-error-box').classList.add('hidden');
      document.getElementById('bm-next-btn').disabled = false;
      document.getElementById('bm-submit-btn').disabled = false;

      updateBookingSummary();
      setBookingStep(1);
      document.getElementById('booking-modal').classList.remove('hidden');
    };

    const closeBookingModal = () => {
      document.getElementById('booking-modal').classList.add('hidden');
      if (typeof window.resyncRoomsToBar === 'function') {
        window.resyncRoomsToBar();
      }
    };

    window.openExperienceModal = (title) => {
      document.getElementById('exp-modal-title').textContent = title;
      const expForm = document.getElementById('exp-form');
      expForm.reset();
      expForm.classList.remove('hidden');
      document.getElementById('exp-success').classList.add('hidden');
      document.getElementById('experience-modal').classList.remove('hidden');
    };

    window.closeExperienceModal = () => {
      document.getElementById('experience-modal').classList.add('hidden');
    };

    document.addEventListener('DOMContentLoaded', () => {
      updateDateDisplays();
      renderRooms();

      document.addEventListener('click', (e) => {
        const clickable = e.target.closest('button, a.btn-press');
        if (clickable && !clickable.disabled) {
          spawnButtonRipple(clickable, e);
        }

        const guestWrapper = document.getElementById('guest-dropdown-wrapper');
        const guestPopover = document.getElementById('guest-dropdown-popover');
        if (guestWrapper && guestPopover && !guestWrapper.contains(e.target)) {
          guestPopover.classList.add('hidden');
        }

        const weatherWrapper = document.getElementById('weather-badge-wrapper');
        const weatherTooltip = document.getElementById('weather-tooltip');
        if (weatherWrapper && weatherTooltip && !weatherWrapper.contains(e.target)) {
          weatherTooltip.classList.add('hidden');
        }
      });

      const revealNodes = document.querySelectorAll('.reveal-on-scroll');
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              io.unobserve(entry.target);
            }
          });
        }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
        revealNodes.forEach((n) => io.observe(n));
        setTimeout(() => revealNodes.forEach((n) => n.classList.add('is-visible')), 900);
      } else {
        revealNodes.forEach((n) => n.classList.add('is-visible'));
      }

      document.getElementById('weather-badge-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('weather-tooltip').classList.toggle('hidden');
      });

      const menuToggleBtn = document.getElementById('mobile-menu-toggle');
      const menuTray = document.getElementById('mobile-menu-tray');
      menuToggleBtn.addEventListener('click', () => {
        const isHidden = menuTray.classList.toggle('hidden');
        menuToggleBtn.setAttribute('aria-expanded', String(!isHidden));
      });

      document.querySelectorAll('.mobile-nav-link').forEach((link) => {
        link.addEventListener('click', () => {
          menuTray.classList.add('hidden');
          menuToggleBtn.setAttribute('aria-expanded', 'false');
        });
      });

      const currencyBtn = document.getElementById('currency-toggle-btn');
      currencyBtn.addEventListener('click', () => {
        currency = currency === 'IDR' ? 'USD' : 'IDR';
        document.getElementById('currency-label').textContent = currency;
        currencyBtn.setAttribute('aria-label', 'Ubah mata uang, saat ini ' + currency);
        const icon = currencyBtn.querySelector('svg');
        if (icon) {
          icon.classList.remove('spin-once');
          void icon.offsetWidth;
          icon.classList.add('spin-once');
        }
        renderRooms();
        showToast('Mata Uang Diperbarui', 'Menampilkan tarif estimasi dalam ' + currency + '.');
      });

      const syncRoomsLive = async (notifyOnChange = false, customCi, customCo) => {
        const ci = customCi || document.getElementById('bar-checkin').value;
        const co = customCo || document.getElementById('bar-checkout').value;
        const seq = ++syncSeq;
        try {
          const qs = new URLSearchParams();
          if (ci) qs.set('checkin', ci);
          if (co) qs.set('checkout', co);
          const res = await fetch('/api/rooms?' + qs.toString(), { cache: 'no-store' });
          if (!res.ok) return;
          const json = await res.json();
          if (seq !== syncSeq || !json || !json.success || !Array.isArray(json.rooms)) return;

          const prevSig = getRoomsSignature(ROOMS_DATA);
          const nextSig = getRoomsSignature(json.rooms);
          if (prevSig === nextSig) return;

          ROOMS_DATA = json.rooms;
          renderRooms();

          if (activeRoom) {
            const updated = ROOMS_DATA.find((r) => r.id_kamar === activeRoom.id_kamar) || null;
            activeRoom = updated;
            const detailOpen = !document.getElementById('room-detail-modal').classList.contains('hidden');
            if (detailOpen && updated) {
              syncDetailModalButton(updated);
            }
            const bookingOpen = !document.getElementById('booking-modal').classList.contains('hidden');
            if (bookingOpen && bookingStep !== 3) {
              const block = getRoomBlockInfo(updated);
              const errBox = document.getElementById('bm-error-box');
              if (block) {
                document.getElementById('bm-next-btn').disabled = true;
                document.getElementById('bm-submit-btn').disabled = true;
                errBox.textContent = block.toastDesc;
                errBox.classList.remove('hidden');
                showToast(block.toastTitle, block.toastDesc, true);
              } else {
                document.getElementById('bm-next-btn').disabled = false;
                document.getElementById('bm-submit-btn').disabled = false;
                errBox.classList.add('hidden');
              }
            }
          }

          if (notifyOnChange) {
            showToast('Ketersediaan Kamar Diperbarui', 'Status kamar baru saja disinkronkan secara real-time.');
          }
        } catch {
          // Abaikan kesalahan jaringan sesaat pada polling latar belakang
        }
      };

      window.resyncRoomsToBar = () => syncRoomsLive(false);

      const getDefaultBookRoomId = () => {
        const avail = ROOMS_DATA.find((r) => !getRoomBlockInfo(r));
        return avail ? avail.id_kamar : null;
      };

      document.getElementById('navbar-book-btn').addEventListener('click', () => openBookingModal(getDefaultBookRoomId()));
      document.getElementById('mobile-book-btn').addEventListener('click', () => {
        menuTray.classList.add('hidden');
        menuToggleBtn.setAttribute('aria-expanded', 'false');
        openBookingModal(getDefaultBookRoomId());
      });

      document.getElementById('bar-checkin').addEventListener('change', () => {
        const ci = document.getElementById('bar-checkin').value;
        const coInput = document.getElementById('bar-checkout');
        if (ci && (!coInput.value || ci >= coInput.value)) {
          coInput.value = addUtcDays(ci, 1);
        }
        if (ci) {
          coInput.min = addUtcDays(ci, 1);
        }
        updateDateDisplays();
        renderRooms();
        syncRoomsLive(false);
      });

      document.getElementById('bar-checkout').addEventListener('change', () => {
        const ci = document.getElementById('bar-checkin').value;
        const coInput = document.getElementById('bar-checkout');
        if (ci && coInput.value && coInput.value <= ci) {
          coInput.value = addUtcDays(ci, 1);
          showToast('Tanggal Disesuaikan', 'Tanggal Check-Out otomatis diatur minimal 1 malam setelah Check-In.');
        }
        updateDateDisplays();
        renderRooms();
        syncRoomsLive(false);
      });

      document.getElementById('guest-dropdown-btn').addEventListener('click', () => {
        document.getElementById('guest-dropdown-popover').classList.toggle('hidden');
      });
      document.getElementById('guest-done-btn').addEventListener('click', () => {
        document.getElementById('guest-dropdown-popover').classList.add('hidden');
      });
      const updateGuestUI = () => {
        document.getElementById('bar-guest-pad').textContent = String(guestCount).padStart(2, '0');
        document.getElementById('bar-guest-label').textContent = guestCount + ' Tamu';
        document.getElementById('guest-popover-val').textContent = String(guestCount);
        renderRooms();
      };
      document.getElementById('guest-dec-btn').addEventListener('click', () => {
        if (guestCount > 1) { guestCount--; updateGuestUI(); }
      });
      document.getElementById('guest-inc-btn').addEventListener('click', () => {
        if (guestCount < 8) { guestCount++; updateGuestUI(); }
      });

      document.getElementById('bar-search-btn').addEventListener('click', async () => {
        const btn = document.getElementById('bar-search-btn');
        const label = btn.querySelector('span');
        if (label) {
          label.textContent = 'Memperbarui...';
        }
        await syncRoomsLive(false);
        renderRooms();
        if (label) {
          label.textContent = 'Cek Ketersediaan';
        }
        document.getElementById('suites').scrollIntoView({ behavior: 'smooth' });
        showToast('Ketersediaan Diperbarui', 'Menampilkan suite untuk ' + guestCount + ' tamu.');
      });

      const applyPromoBar = (val) => {
        const promo = getPromoInfo(val);
        const badge = document.getElementById('bar-promo-badge');
        if (promo) {
          badge.textContent = '✓ Diskon ' + promo.persen + '% Diterapkan!';
          badge.classList.remove('hidden');
          badge.classList.add('inline-flex');
        } else {
          badge.classList.add('hidden');
        }
        renderRooms();
      };

      document.getElementById('bar-promo-input').addEventListener('input', (e) => applyPromoBar(e.target.value));
      document.getElementById('quick-promo-btn').addEventListener('click', () => {
        const btn = document.getElementById('quick-promo-btn');
        const inp = document.getElementById('bar-promo-input');
        inp.value = 'HILLTOP15';
        applyPromoBar('HILLTOP15');
        btn.innerHTML = '<span>✓ Diterapkan!</span>';
        btn.classList.add('bg-[#007A33]', 'text-white');
        btn.classList.remove('bg-[#007A33]/10', 'text-[#007A33]');
        setTimeout(() => {
          btn.innerHTML = '<span>HILLTOP15</span>';
          btn.classList.remove('bg-[#007A33]', 'text-white');
          btn.classList.add('bg-[#007A33]/10', 'text-[#007A33]');
        }, 1600);
        showToast('Kode Promo HILLTOP15 Diterapkan', 'Anda hemat 15% untuk tarif menginap.');
      });

      const cekKodeForm = document.getElementById('cek-kode-form');
      if (cekKodeForm) {
        cekKodeForm.addEventListener('submit', () => {
          const btn = document.getElementById('cek-kode-submit-btn');
          if (btn) {
            btn.disabled = true;
            btn.textContent = 'Mencari...';
          }
        });
      }

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
        sortBy = 'featured';
        guestCount = 2;
        document.getElementById('room-sort-select').value = 'featured';
        document.getElementById('bar-guest-pad').textContent = '02';
        document.getElementById('bar-guest-label').textContent = '2 Tamu';
        document.getElementById('guest-popover-val').textContent = '2';
        document.querySelector('.cat-tab[data-cat="all"]').click();
        showToast('Filter Direset', 'Menampilkan seluruh koleksi suite dan villa.');
      });

      document.getElementById('detail-backdrop').addEventListener('click', closeDetailModal);
      document.getElementById('detail-close-mobile').addEventListener('click', closeDetailModal);
      document.getElementById('detail-close-desktop').addEventListener('click', closeDetailModal);
      document.getElementById('detail-close-footer').addEventListener('click', closeDetailModal);
      document.getElementById('detail-reserve-btn').addEventListener('click', () => {
        const latestRoom = activeRoom ? (ROOMS_DATA.find((r) => r.id_kamar === activeRoom.id_kamar) || activeRoom) : null;
        const block = getRoomBlockInfo(latestRoom);
        if (block) {
          showToast(block.toastTitle, block.toastDesc, true);
          return;
        }
        const targetId = latestRoom ? latestRoom.id_kamar : null;
        closeDetailModal();
        if (targetId) openBookingModal(targetId);
      });

      document.getElementById('booking-backdrop').addEventListener('click', () => { if (bookingStep !== 3) closeBookingModal(); });
      document.getElementById('booking-close-btn').addEventListener('click', closeBookingModal);
      document.getElementById('bm-cancel-btn').addEventListener('click', closeBookingModal);
      document.getElementById('bm-done-btn').addEventListener('click', () => {
        closeBookingModal();
        syncRoomsLive(false);
      });
      document.getElementById('bm-next-btn').addEventListener('click', () => {
        const latestRoom = activeRoom ? (ROOMS_DATA.find((r) => r.id_kamar === activeRoom.id_kamar) || activeRoom) : null;
        const block = getRoomBlockInfo(latestRoom);
        if (block) {
          showToast(block.toastTitle, block.toastDesc, true);
          return;
        }
        const ci = document.getElementById('bm-checkin').value;
        const co = document.getElementById('bm-checkout').value;
        const d1 = parseUtcDate(ci);
        const d2 = parseUtcDate(co);
        if (!d1 || !d2 || d2 <= d1) {
          showToast('Tanggal Tidak Valid', 'Tanggal Check-Out wajib setelah tanggal Check-In.', true);
          return;
        }
        setBookingStep(2);
      });
      document.getElementById('bm-back-btn').addEventListener('click', () => setBookingStep(1));
      document.getElementById('bm-checkin').addEventListener('change', () => {
        const ci = document.getElementById('bm-checkin').value;
        const coEl = document.getElementById('bm-checkout');
        if (ci) {
          const minCo = addUtcDays(ci, 1);
          coEl.min = minCo;
          if (!coEl.value || coEl.value <= ci) {
            coEl.value = minCo;
          }
        }
        updateBookingSummary();
        syncRoomsLive(false, ci, coEl.value);
      });
      document.getElementById('bm-checkout').addEventListener('change', () => {
        const ci = document.getElementById('bm-checkin').value;
        const coEl = document.getElementById('bm-checkout');
        if (ci && coEl.value && coEl.value <= ci) {
          coEl.value = addUtcDays(ci, 1);
          showToast('Tanggal Disesuaikan', 'Tanggal Check-Out minimal 1 malam setelah Check-In.');
        }
        updateBookingSummary();
        syncRoomsLive(false, ci, coEl.value);
      });
      document.getElementById('bm-promo').addEventListener('input', updateBookingSummary);

      document.getElementById('booking-step-2').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!activeRoom) return;

        const latestRoom = ROOMS_DATA.find((r) => r.id_kamar === activeRoom.id_kamar) || activeRoom;
        const block = getRoomBlockInfo(latestRoom);
        const errBox = document.getElementById('bm-error-box');
        if (block) {
          errBox.textContent = block.toastDesc;
          errBox.classList.remove('hidden');
          showToast(block.toastTitle, block.toastDesc, true);
          return;
        }

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
          const issuedAt = d.created_at ? new Date(d.created_at) : new Date();
          const formattedTime = Number.isNaN(issuedAt.getTime())
            ? String(d.created_at || '')
            : issuedAt.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB';

          document.getElementById('voucher-code').textContent = d.kode_booking;
          document.getElementById('voucher-ref').textContent = d.nomor_referensi || ('PAY-' + d.kode_booking);
          document.getElementById('voucher-time').textContent = formattedTime;
          document.getElementById('voucher-status').textContent =
            String(d.status_reservasi || 'Dikonfirmasi') + ' · ' + String(d.status_pembayaran || 'Lunas').toUpperCase();

          document.getElementById('voucher-guest').textContent =
            d.nama_tamu + ' · ' + d.telepon_tamu + (d.kota_asal ? ' (' + d.kota_asal + ')' : '');
          document.getElementById('voucher-guest-email').textContent = 'Kwitansi diterbitkan untuk ' + d.email_tamu;
          document.getElementById('voucher-room').textContent =
            d.nama_kamar + ' (No. ' + d.nomor_kamar + ')' + (d.nama_kategori ? ' · ' + d.nama_kategori : '');
          document.getElementById('voucher-dates').textContent =
            d.tgl_checkin + ' s/d ' + d.tgl_checkout + ' (' + d.jumlah_malam + ' Malam)';
          document.getElementById('voucher-guests').textContent = (d.jumlah_tamu || guestCount) + ' Tamu';

          const notesRow = document.getElementById('voucher-notes-row');
          const notesEl = document.getElementById('voucher-notes');
          if (d.catatan_khusus && String(d.catatan_khusus).trim() !== '') {
            notesEl.textContent = String(d.catatan_khusus);
            notesRow.classList.remove('hidden');
          } else {
            notesEl.textContent = '';
            notesRow.classList.add('hidden');
          }

          document.getElementById('voucher-subtotal').textContent = fmtCurrency(Number(d.subtotal || 0), 'IDR');
          const diskonAmt = Number(d.potongan_diskon || 0);
          const discRow = document.getElementById('voucher-discount-row');
          if (diskonAmt > 0) {
            document.getElementById('voucher-discount-code').textContent = String(d.kode_promo || 'PROMO');
            document.getElementById('voucher-discount').textContent = '-' + fmtCurrency(diskonAmt, 'IDR');
            discRow.classList.remove('hidden');
          } else {
            discRow.classList.add('hidden');
          }
          document.getElementById('voucher-service').textContent = fmtCurrency(Number(d.biaya_layanan || 0), 'IDR');
          document.getElementById('voucher-tax').textContent = fmtCurrency(Number(d.pajak_ppn || 0), 'IDR');
          document.getElementById('voucher-total').textContent = fmtCurrency(Number(d.total_tagihan || 0), 'IDR');
          document.getElementById('voucher-payment').textContent =
            d.metode_pembayaran + ' · Status: ' + String(d.status_pembayaran || 'Lunas').toUpperCase();
          document.getElementById('bm-receipt-link').href = '/reservasi/kwitansi/' + encodeURIComponent(d.kode_booking);

          setBookingStep(3);
          syncRoomsLive(false);
          showToast('Reservasi Tersimpan', 'Struk & kode booking ' + d.kode_booking + ' berhasil diterbitkan.');
        } catch (err) {
          errBox.textContent = err.message;
          errBox.classList.remove('hidden');
          syncRoomsLive(false);
          showToast('Reservasi Gagal', err.message, true);
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Konfirmasi & Kunci Reservasi ✓';
        }
      });

      document.getElementById('exp-form').addEventListener('submit', (e) => {
        e.preventDefault();
        document.getElementById('exp-form').classList.add('hidden');
        document.getElementById('exp-success').classList.remove('hidden');
        showToast('Permintaan Meja Diterima', 'Tim restoran & kebugaran akan mengonfirmasi jadwal Anda.');
      });

      document.getElementById('concierge-form').addEventListener('submit', (e) => {
        e.preventDefault();
        document.getElementById('concierge-form').classList.add('hidden');
        document.getElementById('concierge-success').classList.remove('hidden');
        showToast('Pesan Terkirim', 'Pramutamu kami akan segera menghubungi Anda.');
      });

      const conciergeResetBtn = document.getElementById('concierge-reset-btn');
      if (conciergeResetBtn) {
        conciergeResetBtn.addEventListener('click', () => {
          document.getElementById('concierge-form').reset();
          document.getElementById('concierge-success').classList.add('hidden');
          document.getElementById('concierge-form').classList.remove('hidden');
        });
      }

      const rdbmsTabs = document.querySelectorAll('.rdbms-sql-tab');
      const rdbmsPanels = document.querySelectorAll('.rdbms-sql-panel');
      rdbmsTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          const targetId = tab.getAttribute('data-sql-tab');
          rdbmsTabs.forEach((t) => {
            const isSelected = t === tab;
            t.setAttribute('aria-selected', String(isSelected));
            t.classList.toggle('bg-white', isSelected);
            t.classList.toggle('text-[#0F1F17]', isSelected);
            t.classList.toggle('shadow-xs', isSelected);
            t.classList.toggle('text-slate-600', !isSelected);
          });
          rdbmsPanels.forEach((panel) => {
            panel.classList.toggle('hidden', panel.getAttribute('data-sql-panel') !== targetId);
          });
        });
      });

      document.querySelectorAll('.copy-sql-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-copy-sql');
          const codeEl = id ? document.getElementById('sql-code-' + id) : null;
          if (!codeEl) return;
          const text = codeEl.textContent || '';
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(text);
            } else {
              const ta = document.createElement('textarea');
              ta.value = text;
              ta.style.position = 'fixed';
              ta.style.opacity = '0';
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              ta.remove();
            }
            const orig = btn.textContent;
            btn.textContent = '✓ Tersalin';
            setTimeout(() => { btn.textContent = orig; }, 1400);
            showToast('SQL Disalin', 'Cuplikan SQL berhasil disalin ke papan klip.');
          } catch {
            showToast('Gagal Menyalin', 'Silakan sorot dan salin cuplikan SQL secara manual.', true);
          }
        });
      });

      const TRG_SIM_STATES = {
        insert: {
          name: 'trg_update_ketersediaan_kamar',
          ev: 'Event: AFTER INSERT',
          room: 'Tersedia',
          roomNote: 'Jadwal dikunci lewat tanggal, kamar fisik masih siap sebelum Check-In.',
          transition: 'Baru → Dikonfirmasi',
          desc: 'Reservasi baru dibuat dengan status awal: Dikonfirmasi',
        },
        checkin: {
          name: 'trg_log_perubahan_reservasi',
          ev: 'Event: AFTER UPDATE',
          room: 'Terisi',
          roomNote: 'Trigger otomatis mengubah status kamar fisik menjadi Terisi saat tamu masuk.',
          transition: 'Dikonfirmasi → Check-In',
          desc: 'Perubahan status otomatis oleh Trigger: Dikonfirmasi -> Check-In',
        },
        checkout: {
          name: 'trg_log_perubahan_reservasi',
          ev: 'Event: AFTER UPDATE',
          room: 'Pemeliharaan',
          roomNote: 'Setelah Check-Out, kamar otomatis ditandai Pemeliharaan untuk housekeeping.',
          transition: 'Check-In → Selesai',
          desc: 'Perubahan status otomatis oleh Trigger: Check-In -> Selesai',
        },
        cancel: {
          name: 'trg_log_perubahan_reservasi',
          ev: 'Event: AFTER UPDATE',
          room: 'Tersedia',
          roomNote: 'Pembatalan dari status Check-In otomatis melepaskan kamar kembali Tersedia.',
          transition: 'Check-In → Batal',
          desc: 'Perubahan status otomatis oleh Trigger: Check-In -> Batal',
        },
      };

      const trgButtons = document.querySelectorAll('.trg-sim-btn');
      trgButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-trg-sim');
          const st = key ? TRG_SIM_STATES[key] : null;
          if (!st) return;
          trgButtons.forEach((b) => {
            const active = b === btn;
            b.classList.toggle('bg-[#007A33]', active);
            b.classList.toggle('text-white', active);
            b.classList.toggle('bg-white', !active);
            b.classList.toggle('border', !active);
            b.classList.toggle('border-slate-300', !active);
            b.classList.toggle('text-slate-700', !active);
          });
          document.getElementById('trg-sim-name').textContent = st.name;
          document.getElementById('trg-sim-event').textContent = st.ev;
          document.getElementById('trg-sim-room').textContent = st.room;
          document.getElementById('trg-sim-room-note').textContent = st.roomNote;
          document.getElementById('trg-sim-audit-transition').textContent = st.transition;
          document.getElementById('trg-sim-audit-desc').textContent = st.desc;
        });
      });

      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) syncRoomsLive(true);
      });
      window.addEventListener('focus', () => syncRoomsLive(true));
      setInterval(() => {
        if (!document.hidden) syncRoomsLive(true);
      }, 5000);

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeDetailModal();
          if (bookingStep !== 3) closeBookingModal();
          closeExperienceModal();
          const guestPopover = document.getElementById('guest-dropdown-popover');
          if (guestPopover) guestPopover.classList.add('hidden');
        }
      });
    });
  </script>
</body>
</html>`;
}
