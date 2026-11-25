import type { FlashMessage } from '../auth.ts';
import type {
  AuditLogRow,
  CategoryRow,
  KpiMetrics,
  ReservationReportRow,
  RoomRow,
  SubqueryAnalytics,
} from '../hotelService.ts';
import { escapeHtml, formatRupiah } from './helpers.ts';

export interface DashboardViewProps {
  adminIdentity: string;
  kpi: KpiMetrics;
  reservations: ReservationReportRow[];
  rooms: RoomRow[];
  categories: CategoryRow[];
  subqueryAnalytics: SubqueryAnalytics;
  auditLogs: AuditLogRow[];
  flash: FlashMessage | null;
}

export function renderDashboardPage(props: DashboardViewProps): string {
  const {
    adminIdentity,
    kpi,
    reservations,
    rooms,
    categories,
    subqueryAnalytics,
    auditLogs,
    flash,
  } = props;

  const flashHtml = flash
    ? `<div role="alert" class="p-4 rounded-xl border text-sm font-medium shadow-xs ${
        flash.type === 'error'
          ? 'bg-red-50 border-red-300 text-red-800'
          : 'bg-emerald-50 border-emerald-300 text-[#005A2B]'
      }">${escapeHtml(flash.message)}</div>`
    : '';

  const filterButtonsHtml = ['Semua', 'Dikonfirmasi', 'Check-In', 'Selesai', 'Batal']
    .map(
      (statusOpt, idx) => `<button
        type="button"
        data-status-filter="${escapeHtml(statusOpt)}"
        class="res-filter-btn px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
          idx === 0 ? 'bg-white text-[#0F1F17] shadow-xs' : 'text-slate-600 hover:text-slate-900'
        }"
      >${escapeHtml(statusOpt)}</button>`
    )
    .join('');

  let reservationRowsHtml = '';
  if (reservations.length === 0) {
    reservationRowsHtml = `<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">Belum ada data reservasi.</td></tr>`;
  } else {
    reservationRowsHtml =
      reservations
        .map((res) => {
          const st = res.status_reservasi;
          const badgeCls =
            st === 'Dikonfirmasi'
              ? 'bg-emerald-50 text-[#007A33] border-emerald-200'
              : st === 'Check-In'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : st === 'Selesai'
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : st === 'Batal'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200';

          const searchBlob = [res.kode_booking, res.nama_tamu, res.nomor_kamar, res.nama_kamar]
            .join(' ')
            .toLowerCase()
            .trim();

          const checkInBtn =
            st === 'Dikonfirmasi'
              ? `<form method="POST" action="/admin/reservasi/checkin" class="inline dash-action-form" data-loading-text="Check-In...">
                  <input type="hidden" name="id_reservasi" value="${res.id_reservasi}" />
                  <button type="submit" class="px-2.5 py-1.5 bg-[#007A33] hover:bg-[#005A2B] text-white font-semibold rounded text-[11px] cursor-pointer whitespace-nowrap">Check-In</button>
                </form>`
              : '';

          const checkOutBtn =
            st === 'Check-In'
              ? `<form method="POST" action="/admin/reservasi/checkout" class="inline dash-action-form" data-loading-text="Check-Out...">
                  <input type="hidden" name="id_reservasi" value="${res.id_reservasi}" />
                  <button type="submit" class="px-2.5 py-1.5 bg-[#D4AF37] hover:bg-[#C29B27] text-[#0F1F17] font-semibold rounded text-[11px] cursor-pointer whitespace-nowrap">Check-Out</button>
                </form>`
              : '';

          const cancelBtn =
            st === 'Dikonfirmasi' || st === 'Check-In'
              ? `<form method="POST" action="/admin/reservasi/batal" class="inline dash-action-form" data-loading-text="Membatalkan...">
                  <input type="hidden" name="id_reservasi" value="${res.id_reservasi}" />
                  <button type="submit" class="px-2.5 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 font-semibold rounded text-[11px] cursor-pointer whitespace-nowrap">Batal</button>
                </form>`
              : '';

          const activeActions = `${checkOutBtn}${cancelBtn}`;

          return `<tr class="reservation-row hover:bg-slate-50/70" data-status="${escapeHtml(st)}" data-search="${escapeHtml(searchBlob)}">
            <td class="px-4 py-3.5">
              <div class="font-mono font-bold text-[#007A33]">${escapeHtml(res.kode_booking)}</div>
              <div class="font-semibold text-slate-900 mt-0.5">${escapeHtml(res.nama_tamu)}</div>
              <div class="text-[11px] text-slate-500">${escapeHtml(res.telepon_tamu)}</div>
            </td>
            <td class="px-4 py-3.5">
              <div class="font-semibold text-slate-900">Kamar ${escapeHtml(res.nomor_kamar)} &mdash; ${escapeHtml(res.nama_kamar)}</div>
              <div class="text-[11px] text-slate-500">${escapeHtml(res.nama_kategori)} &middot; Status Kamar: <strong class="text-slate-700">${escapeHtml(res.status_kamar)}</strong></div>
            </td>
            <td class="px-4 py-3.5">
              <div class="font-medium text-slate-800 tabular-nums">${escapeHtml(res.tgl_checkin)} &rarr; ${escapeHtml(res.tgl_checkout)} (${res.jumlah_malam} mlm)</div>
              <div class="text-[11px] text-slate-500">Promo: <span class="font-mono text-[#007A33]">${escapeHtml(res.kode_promo)}</span></div>
            </td>
            <td class="px-4 py-3.5">
              <div class="font-serif font-bold text-sm text-[#0F1F17] tabular-nums">${escapeHtml(formatRupiah(res.total_tagihan))}</div>
              <div class="text-[11px] text-slate-500">${escapeHtml(res.status_pembayaran)}</div>
            </td>
            <td class="px-4 py-3.5">
              <span class="inline-block px-2.5 py-1 rounded border text-[11px] font-semibold whitespace-nowrap ${badgeCls}">${escapeHtml(st)}</span>
            </td>
            <td class="px-4 py-3.5 text-right">
              <div class="inline-flex items-center gap-1.5 justify-end flex-wrap">
                ${checkInBtn}
                ${activeActions}
              </div>
            </td>
          </tr>`;
        })
        .join('') +
      `<tr id="reservations-empty-filter" class="hidden">
        <td colspan="6" class="px-4 py-8 text-center text-slate-500">Tidak ada reservasi yang cocok dengan filter pencarian saat ini.</td>
      </tr>`;
  }

  const categoryOptionsHtml = categories
    .map(
      (cat) =>
        `<option value="${cat.id_kategori}">${escapeHtml(cat.kode_kategori)} &mdash; ${escapeHtml(cat.nama_kategori)}</option>`
    )
    .join('');

  const roomRowsHtml = rooms
    .map((rm) => {
      const statusOpts = ['Tersedia', 'Terisi', 'Pemeliharaan']
        .map(
          (opt) =>
            `<option value="${opt}" ${rm.status_ketersediaan === opt ? 'selected' : ''}>${opt}</option>`
        )
        .join('');

      return `<tr>
        <td class="px-4 py-3">
          <div class="font-mono font-bold text-[#007A33]">${escapeHtml(rm.kode_kamar)} (No. ${escapeHtml(rm.nomor_kamar)})</div>
          <div class="font-semibold text-slate-900">${escapeHtml(rm.nama_kamar)}</div>
        </td>
        <td class="px-4 py-3">
          <div class="text-slate-600">${escapeHtml(rm.nama_kategori)}</div>
          <div class="font-serif font-bold text-[#0F1F17] tabular-nums">${escapeHtml(formatRupiah(rm.tarif_per_malam))}</div>
        </td>
        <td class="px-4 py-3">
          <form method="POST" action="/admin/kamar/status" class="flex items-center gap-2 dash-action-form" data-loading-text="Menyimpan...">
            <input type="hidden" name="id_kamar" value="${rm.id_kamar}" />
            <select name="status_ketersediaan" aria-label="Status ketersediaan kamar ${escapeHtml(rm.nomor_kamar)}" class="px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs">
              ${statusOpts}
            </select>
            <button type="submit" class="px-2.5 py-1.5 bg-[#005A2B] hover:bg-[#007A33] text-white rounded text-[11px] font-semibold cursor-pointer whitespace-nowrap">Simpan</button>
          </form>
        </td>
        <td class="px-4 py-3 text-right">
          <form method="POST" action="/admin/kamar/hapus" class="dash-action-form" data-loading-text="Menghapus..." onsubmit="return confirm('Hapus unit kamar ini?');">
            <input type="hidden" name="id_kamar" value="${rm.id_kamar}" />
            <button type="submit" aria-label="Hapus kamar ${escapeHtml(rm.nomor_kamar)}" class="px-2.5 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 rounded text-[11px] font-semibold cursor-pointer whitespace-nowrap">Hapus</button>
          </form>
        </td>
      </tr>`;
    })
    .join('');

  const premiumRoomsHtml = subqueryAnalytics.kamar_premium
    .map(
      (kp) => `<div class="p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg flex items-center justify-between text-xs">
        <div>
          <span class="font-mono font-bold text-[#007A33]">${escapeHtml(kp.kode_kamar)}</span>
          <strong class="text-slate-900 ml-1">${escapeHtml(kp.nama_kamar)}</strong>
          <span class="text-slate-500 block text-[11px]">${escapeHtml(kp.nama_kategori)} &middot; Status: ${escapeHtml(kp.status_ketersediaan)}</span>
        </div>
        <span class="font-serif font-bold text-sm text-[#0F1F17] tabular-nums">${escapeHtml(formatRupiah(kp.tarif_per_malam))}</span>
      </div>`
    )
    .join('');

  const auditLogsHtml =
    auditLogs.length === 0
      ? `<p class="text-xs text-slate-500">Belum ada catatan aktivitas dari Trigger.</p>`
      : auditLogs
          .map(
            (log) => `<div class="p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs">
              <div class="flex items-center justify-between">
                <span class="font-mono font-bold text-[#007A33]">${escapeHtml(log.kode_booking || `RES-${log.id_reservasi}`)}</span>
                <span class="text-[10px] text-slate-400">${escapeHtml(log.waktu_perubahan)}</span>
              </div>
              <div class="mt-1 font-medium text-slate-800">
                ${escapeHtml(log.status_lama ?? '')} &rarr; <span class="text-[#007A33] font-semibold">${escapeHtml(log.status_baru)}</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5">${escapeHtml(log.keterangan ?? '')}</p>
            </div>`
          )
          .join('');

  return `<!doctype html>
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
    @keyframes dashFadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes btnRippleAnim {
      from { transform: translate(-50%, -50%) scale(0); opacity: 0.45; }
      to { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
    }
    .dash-enter { animation: dashFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .dash-delay-1 { animation-delay: 0.06s; }
    .dash-delay-2 { animation-delay: 0.12s; }
    .dash-delay-3 { animation-delay: 0.18s; }
    .dash-delay-4 { animation-delay: 0.24s; }
    button, a.btn-press {
      position: relative;
      overflow: hidden;
      transition: transform 0.14s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
    }
    button:active:not(:disabled), a.btn-press:active { transform: scale(0.96); }
    .btn-ripple-wave {
      position: absolute;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.45);
      pointer-events: none;
      width: 72px;
      height: 72px;
      animation: btnRippleAnim 0.48s ease-out forwards;
    }
    .btn-ripple-wave.dark { background: rgba(0, 122, 51, 0.2); }
    @media (prefers-reduced-motion: reduce) {
      .dash-enter { animation: none !important; }
    }
  </style>
</head>
<body class="min-h-screen bg-[#F8FAFC] text-[#0F1F17]">

  <header class="sticky top-0 z-40 bg-[#0F1F17] text-white border-b border-white/10 shadow-md">
    <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
      <div class="flex items-center gap-3 sm:gap-4 min-w-0">
        <a href="/" class="text-base sm:text-xl font-serif font-bold tracking-tight text-white hover:text-[#D4AF37] transition-colors truncate min-w-0">
          Bukit Randu <span class="hidden sm:inline text-[11px] font-sans uppercase tracking-widest text-[#D4AF37] ml-1">Front Office</span>
        </a>
        <span class="hidden md:inline-block text-xs text-slate-300 border-l border-white/15 pl-4 truncate">
          ${escapeHtml(adminIdentity)}
        </span>
      </div>

      <div class="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <a href="/" class="btn-press px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium text-slate-200 hover:text-white border border-white/20 rounded-md transition-colors whitespace-nowrap shrink-0">
          <span class="hidden sm:inline">Lihat </span>Web Tamu
        </a>
        <form method="POST" action="/admin/logout" class="m-0 dash-action-form" data-loading-text="Keluar...">
          <button type="submit" class="px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wider bg-red-600/90 hover:bg-red-600 text-white rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0">
            Keluar
          </button>
        </form>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    ${flashHtml}

    <section aria-label="Metrik Utama Operasional">
      <div class="dash-enter mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <span class="text-xs font-semibold uppercase tracking-widest text-[#007A33]">Ringkasan Operasional Real-Time</span>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-[#0F1F17]">Dashboard Front Office Resor</h1>
        </div>
        <span class="text-xs text-slate-500">Terhubung langsung ke Supabase PostgreSQL</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div class="dash-enter dash-delay-1 bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Tingkat Okupansi Kamar</span>
          <div id="kpi-okupansi" class="text-3xl font-serif font-bold text-[#007A33] mt-2 tabular-nums">${escapeHtml(kpi.okupansi_persen)}%</div>
          <p id="kpi-okupansi-sub" class="text-xs text-slate-500 mt-1">${kpi.kamar_terisi} dari ${kpi.total_kamar} unit berstatus Terisi</p>
        </div>

        <div class="dash-enter dash-delay-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Reservasi &amp; Check-In Aktif</span>
          <div id="kpi-aktif" class="text-3xl font-serif font-bold text-[#0F1F17] mt-2 tabular-nums">${kpi.reservasi_aktif}</div>
          <p class="text-xs text-slate-500 mt-1">Status Dikonfirmasi &amp; Check-In berjalan</p>
        </div>

        <div class="dash-enter dash-delay-3 bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Total Pendapatan Lunas</span>
          <div id="kpi-pendapatan" class="text-2xl font-serif font-bold text-[#005A2B] mt-2 tabular-nums">${escapeHtml(formatRupiah(kpi.pendapatan_lunas))}</div>
          <p class="text-xs text-slate-500 mt-1">Akumulasi tabel pembayaran berstatus Lunas</p>
        </div>

        <div class="dash-enter dash-delay-4 bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Kamar Pemeliharaan</span>
          <div id="kpi-pemeliharaan" class="text-3xl font-serif font-bold text-[#D4AF37] mt-2 tabular-nums">${kpi.kamar_pemeliharaan}</div>
          <p class="text-xs text-slate-500 mt-1">Menunggu pembersihan housekeeping pasca Check-Out</p>
        </div>
      </div>
    </section>

    <section class="dash-enter dash-delay-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="px-4 sm:px-6 py-4 bg-[#F8FAFC] border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span class="text-[11px] font-semibold uppercase tracking-wider text-[#007A33]">View Multi-Join 6 Tabel: vw_laporan_reservasi_lengkap</span>
          <h2 class="text-xl font-serif font-bold text-[#0F1F17]">Manajemen Reservasi &amp; Operasional Tamu</h2>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto" role="group" aria-label="Filter status reservasi">
            ${filterButtonsHtml}
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
            ${reservationRowsHtml}
          </tbody>
        </table>
      </div>
    </section>

    <section id="manajemen-kamar" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-[#D4AF37] block">Inventaris Properti</span>
        <h2 class="text-xl font-serif font-bold text-[#0F1F17] mt-0.5 mb-4">Tambah Unit Kamar Baru</h2>

        <form method="POST" action="/admin/kamar/tambah" class="space-y-3 text-xs dash-action-form" data-loading-text="Menambah Kamar...">
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
              ${categoryOptionsHtml}
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
              <label for="luas_m2" class="font-semibold text-slate-700 block mb-1">Luas (m&sup2;)</label>
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
            <tbody id="rooms-tbody" class="divide-y divide-slate-100">
              ${roomRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-[#007A33] block">Scalar Subquery PostgreSQL</span>
        <h2 class="text-xl font-serif font-bold text-[#0F1F17] mt-0.5">Kamar di Atas Rata-Rata Tarif Hotel</h2>
        <p class="text-xs text-slate-600 mt-1 mb-4">
          Rata-rata tarif seluruh properti saat ini: <strong id="subquery-rata" class="text-[#007A33] font-serif text-sm">${escapeHtml(formatRupiah(subqueryAnalytics.rata_rata_tarif))}</strong> / malam
        </p>

        <div id="subquery-list" class="space-y-2.5">
          ${premiumRoomsHtml}
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-[#D4AF37] block">Trigger Otomatis: log_audit_reservasi</span>
        <h2 class="text-xl font-serif font-bold text-[#0F1F17] mt-0.5 mb-4">Feed Riwayat Audit Reservasi</h2>

        <div id="audit-logs-list" class="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          ${auditLogsHtml}
        </div>
      </div>
    </section>
  </main>

  <div id="dash-toast-container" class="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"></div>

  <script>
    (function () {
      const searchInput = document.getElementById('reservation-search');
      const filterBtns = Array.from(document.querySelectorAll('.res-filter-btn'));
      let activeStatus = 'Semua';
      let lastSyncSig = '';
      let syncSeq = 0;
      const dirtyRoomIds = new Set();

      const escHtml = (val) =>
        String(val ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');

      const fmtRupiah = (amount) => 'IDR ' + Math.round(Number(amount) || 0).toLocaleString('id-ID');

      const showDashToast = (title, desc) => {
        const container = document.getElementById('dash-toast-container');
        if (!container) return;
        const el = document.createElement('div');
        el.className = 'pointer-events-auto bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-slate-200 p-3 text-xs';
        el.innerHTML =
          '<div class="font-semibold text-[#007A33]">' + escHtml(title) + '</div>' +
          (desc ? '<div class="text-[11px] text-slate-600 mt-0.5">' + escHtml(desc) + '</div>' : '');
        container.appendChild(el);
        setTimeout(() => el.remove(), 3200);
      };

      function applyReservationFilter() {
        const q = (searchInput && searchInput.value ? searchInput.value : '').trim().toLowerCase();
        const rows = Array.from(document.querySelectorAll('.reservation-row'));
        const emptyRow = document.getElementById('reservations-empty-filter');
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

      const renderReservationRows = (reservations) => {
        const tbody = document.getElementById('reservations-tbody');
        if (!tbody) return;
        if (!reservations || reservations.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">Belum ada data reservasi.</td></tr>';
          return;
        }
        const badgeClassFor = (st) =>
          st === 'Dikonfirmasi'
            ? 'bg-emerald-50 text-[#007A33] border-emerald-200'
            : st === 'Check-In'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : st === 'Selesai'
                ? 'bg-slate-100 text-slate-700 border-slate-300'
                : st === 'Batal'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200';

        tbody.innerHTML = reservations.map((res) => {
          const st = res.status_reservasi;
          const searchBlob = [res.kode_booking, res.nama_tamu, res.nomor_kamar, res.nama_kamar].join(' ').toLowerCase().trim();
          const checkInBtn = st === 'Dikonfirmasi'
            ? '<form method="POST" action="/admin/reservasi/checkin" class="inline dash-action-form" data-loading-text="Check-In...">' +
                '<input type="hidden" name="id_reservasi" value="' + escHtml(res.id_reservasi) + '" />' +
                '<button type="submit" class="px-2.5 py-1.5 bg-[#007A33] hover:bg-[#005A2B] text-white font-semibold rounded text-[11px] cursor-pointer whitespace-nowrap">Check-In</button>' +
              '</form>'
            : '';
          const checkOutBtn = st === 'Check-In'
            ? '<form method="POST" action="/admin/reservasi/checkout" class="inline dash-action-form" data-loading-text="Check-Out...">' +
                '<input type="hidden" name="id_reservasi" value="' + escHtml(res.id_reservasi) + '" />' +
                '<button type="submit" class="px-2.5 py-1.5 bg-[#D4AF37] hover:bg-[#C29B27] text-[#0F1F17] font-semibold rounded text-[11px] cursor-pointer whitespace-nowrap">Check-Out</button>' +
              '</form>'
            : '';
          const cancelBtn = (st === 'Dikonfirmasi' || st === 'Check-In')
            ? '<form method="POST" action="/admin/reservasi/batal" class="inline dash-action-form" data-loading-text="Membatalkan...">' +
                '<input type="hidden" name="id_reservasi" value="' + escHtml(res.id_reservasi) + '" />' +
                '<button type="submit" class="px-2.5 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 font-semibold rounded text-[11px] cursor-pointer whitespace-nowrap">Batal</button>' +
              '</form>'
            : '';

          return '<tr class="reservation-row hover:bg-slate-50/70" data-status="' + escHtml(st) + '" data-search="' + escHtml(searchBlob) + '">' +
            '<td class="px-4 py-3.5">' +
              '<div class="font-mono font-bold text-[#007A33]">' + escHtml(res.kode_booking) + '</div>' +
              '<div class="font-semibold text-slate-900 mt-0.5">' + escHtml(res.nama_tamu) + '</div>' +
              '<div class="text-[11px] text-slate-500">' + escHtml(res.telepon_tamu) + '</div>' +
            '</td>' +
            '<td class="px-4 py-3.5">' +
              '<div class="font-semibold text-slate-900">Kamar ' + escHtml(res.nomor_kamar) + ' &mdash; ' + escHtml(res.nama_kamar) + '</div>' +
              '<div class="text-[11px] text-slate-500">' + escHtml(res.nama_kategori) + ' &middot; Status Kamar: <strong class="text-slate-700">' + escHtml(res.status_kamar) + '</strong></div>' +
            '</td>' +
            '<td class="px-4 py-3.5">' +
              '<div class="font-medium text-slate-800 tabular-nums">' + escHtml(res.tgl_checkin) + ' &rarr; ' + escHtml(res.tgl_checkout) + ' (' + escHtml(res.jumlah_malam) + ' mlm)</div>' +
              '<div class="text-[11px] text-slate-500">Promo: <span class="font-mono text-[#007A33]">' + escHtml(res.kode_promo) + '</span></div>' +
            '</td>' +
            '<td class="px-4 py-3.5">' +
              '<div class="font-serif font-bold text-sm text-[#0F1F17] tabular-nums">' + escHtml(fmtRupiah(res.total_tagihan)) + '</div>' +
              '<div class="text-[11px] text-slate-500">' + escHtml(res.status_pembayaran) + '</div>' +
            '</td>' +
            '<td class="px-4 py-3.5">' +
              '<span class="inline-block px-2.5 py-1 rounded border text-[11px] font-semibold whitespace-nowrap ' + badgeClassFor(st) + '">' + escHtml(st) + '</span>' +
            '</td>' +
            '<td class="px-4 py-3.5 text-right">' +
              '<div class="inline-flex items-center gap-1.5 justify-end flex-wrap">' + checkInBtn + checkOutBtn + cancelBtn + '</div>' +
            '</td>' +
          '</tr>';
        }).join('') +
        '<tr id="reservations-empty-filter" class="hidden">' +
          '<td colspan="6" class="px-4 py-8 text-center text-slate-500">Tidak ada reservasi yang cocok dengan filter pencarian saat ini.</td>' +
        '</tr>';
        applyReservationFilter();
      };

      const renderRoomRows = (rooms) => {
        const tbody = document.getElementById('rooms-tbody');
        if (!tbody) return;
        const activeEl = document.activeElement;
        if (activeEl && activeEl.closest && activeEl.closest('#rooms-tbody')) return;
        if (dirtyRoomIds.size > 0) return;

        tbody.innerHTML = (rooms || []).map((rm) => {
          const statusOpts = ['Tersedia', 'Terisi', 'Pemeliharaan'].map((opt) =>
            '<option value="' + opt + '" ' + (rm.status_ketersediaan === opt ? 'selected' : '') + '>' + opt + '</option>'
          ).join('');
          return '<tr>' +
            '<td class="px-4 py-3">' +
              '<div class="font-mono font-bold text-[#007A33]">' + escHtml(rm.kode_kamar) + ' (No. ' + escHtml(rm.nomor_kamar) + ')</div>' +
              '<div class="font-semibold text-slate-900">' + escHtml(rm.nama_kamar) + '</div>' +
            '</td>' +
            '<td class="px-4 py-3">' +
              '<div class="text-slate-600">' + escHtml(rm.nama_kategori) + '</div>' +
              '<div class="font-serif font-bold text-[#0F1F17] tabular-nums">' + escHtml(fmtRupiah(rm.tarif_per_malam)) + '</div>' +
            '</td>' +
            '<td class="px-4 py-3">' +
              '<form method="POST" action="/admin/kamar/status" class="flex items-center gap-2 dash-action-form" data-room-id="' + escHtml(rm.id_kamar) + '" data-loading-text="Menyimpan...">' +
                '<input type="hidden" name="id_kamar" value="' + escHtml(rm.id_kamar) + '" />' +
                '<select name="status_ketersediaan" aria-label="Status ketersediaan kamar ' + escHtml(rm.nomor_kamar) + '" class="px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs">' + statusOpts + '</select>' +
                '<button type="submit" class="px-2.5 py-1.5 bg-[#005A2B] hover:bg-[#007A33] text-white rounded text-[11px] font-semibold cursor-pointer whitespace-nowrap">Simpan</button>' +
              '</form>' +
            '</td>' +
            '<td class="px-4 py-3 text-right">' +
              '<form method="POST" action="/admin/kamar/hapus" class="dash-action-form" data-loading-text="Menghapus..." onsubmit="return confirm(\\'Hapus unit kamar ini?\\');">' +
                '<input type="hidden" name="id_kamar" value="' + escHtml(rm.id_kamar) + '" />' +
                '<button type="submit" aria-label="Hapus kamar ' + escHtml(rm.nomor_kamar) + '" class="px-2.5 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 rounded text-[11px] font-semibold cursor-pointer whitespace-nowrap">Hapus</button>' +
              '</form>' +
            '</td>' +
          '</tr>';
        }).join('');
      };

      const computeSnapshotSignature = (data) => {
        const resSig = (data.reservations || []).map((r) => [r.id_reservasi, r.status_reservasi, r.status_kamar, r.total_tagihan].join(':')).join('|');
        const roomSig = (data.rooms || []).map((r) => [r.id_kamar, r.status_ketersediaan, r.tarif_per_malam].join(':')).join('|');
        const logSig = (data.auditLogs && data.auditLogs[0]) ? String(data.auditLogs[0].id_log) : '0';
        const k = data.kpi || {};
        return [k.okupansi_persen, k.kamar_terisi, k.total_kamar, k.reservasi_aktif, k.pendapatan_lunas, k.kamar_pemeliharaan, resSig, roomSig, logSig].join('#');
      };

      const syncDashboardLive = async () => {
        const seq = ++syncSeq;
        try {
          const res = await fetch('/api/admin/sync', { cache: 'no-store' });
          if (!res.ok) return;
          const json = await res.json();
          if (seq !== syncSeq || !json || !json.success) return;

          const sig = computeSnapshotSignature(json);
          if (!lastSyncSig) {
            lastSyncSig = sig;
            return;
          }
          if (sig === lastSyncSig) return;
          lastSyncSig = sig;

          if (json.kpi) {
            document.getElementById('kpi-okupansi').textContent = json.kpi.okupansi_persen + '%';
            document.getElementById('kpi-okupansi-sub').textContent = json.kpi.kamar_terisi + ' dari ' + json.kpi.total_kamar + ' unit berstatus Terisi';
            document.getElementById('kpi-aktif').textContent = String(json.kpi.reservasi_aktif);
            document.getElementById('kpi-pendapatan').textContent = fmtRupiah(json.kpi.pendapatan_lunas);
            document.getElementById('kpi-pemeliharaan').textContent = String(json.kpi.kamar_pemeliharaan);
          }

          renderReservationRows(json.reservations);
          renderRoomRows(json.rooms);

          if (json.subqueryAnalytics) {
            const rataEl = document.getElementById('subquery-rata');
            if (rataEl) rataEl.textContent = fmtRupiah(json.subqueryAnalytics.rata_rata_tarif);
            const listEl = document.getElementById('subquery-list');
            if (listEl) {
              listEl.innerHTML = (json.subqueryAnalytics.kamar_premium || []).map((kp) =>
                '<div class="p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg flex items-center justify-between text-xs">' +
                  '<div>' +
                    '<span class="font-mono font-bold text-[#007A33]">' + escHtml(kp.kode_kamar) + '</span>' +
                    '<strong class="text-slate-900 ml-1">' + escHtml(kp.nama_kamar) + '</strong>' +
                    '<span class="text-slate-500 block text-[11px]">' + escHtml(kp.nama_kategori) + ' &middot; Status: ' + escHtml(kp.status_ketersediaan) + '</span>' +
                  '</div>' +
                  '<span class="font-serif font-bold text-sm text-[#0F1F17] tabular-nums">' + escHtml(fmtRupiah(kp.tarif_per_malam)) + '</span>' +
                '</div>'
              ).join('');
            }
          }

          const logsEl = document.getElementById('audit-logs-list');
          if (logsEl && Array.isArray(json.auditLogs)) {
            logsEl.innerHTML = json.auditLogs.length === 0
              ? '<p class="text-xs text-slate-500">Belum ada catatan aktivitas dari Trigger.</p>'
              : json.auditLogs.map((log) =>
                  '<div class="p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs">' +
                    '<div class="flex items-center justify-between">' +
                      '<span class="font-mono font-bold text-[#007A33]">' + escHtml(log.kode_booking || ('RES-' + log.id_reservasi)) + '</span>' +
                      '<span class="text-[10px] text-slate-400">' + escHtml(log.waktu_perubahan) + '</span>' +
                    '</div>' +
                    '<div class="mt-1 font-medium text-slate-800">' + escHtml(log.status_lama ?? '') + ' &rarr; <span class="text-[#007A33] font-semibold">' + escHtml(log.status_baru) + '</span></div>' +
                    '<p class="text-[11px] text-slate-500 mt-0.5">' + escHtml(log.keterangan ?? '') + '</p>' +
                  '</div>'
                ).join('');
          }

          showDashToast('Data Operasional Disinkronkan', 'Perubahan reservasi & status kamar terbaru telah dimuat otomatis.');
        } catch {
          // Abaikan error jaringan sementara saat polling
        }
      };

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

      if (searchInput) {
        searchInput.addEventListener('input', applyReservationFilter);
      }

      const roomsTbody = document.getElementById('rooms-tbody');
      if (roomsTbody) {
        roomsTbody.addEventListener('change', (e) => {
          const form = e.target && e.target.closest ? e.target.closest('form[action="/admin/kamar/status"]') : null;
          const inp = form ? form.querySelector('input[name="id_kamar"]') : null;
          if (inp && inp.value) dirtyRoomIds.add(inp.value);
        });
      }

      document.addEventListener('click', (e) => {
        const target = e.target && e.target.closest ? e.target.closest('button, a.btn-press') : null;
        if (!target || target.disabled) return;
        const rect = target.getBoundingClientRect();
        const wave = document.createElement('span');
        const isLightBtn = target.classList.contains('bg-[#007A33]') || target.classList.contains('bg-[#005A2B]') || target.classList.contains('bg-red-600/90');
        wave.className = 'btn-ripple-wave ' + (isLightBtn ? '' : 'dark');
        wave.style.left = (e.clientX ? e.clientX - rect.left : rect.width / 2) + 'px';
        wave.style.top = (e.clientY ? e.clientY - rect.top : rect.height / 2) + 'px';
        target.appendChild(wave);
        setTimeout(() => wave.remove(), 500);
      });

      document.addEventListener('submit', (e) => {
        const form = e.target;
        if (!form || !form.classList || !form.classList.contains('dash-action-form')) return;
        const btn = form.querySelector('button[type="submit"]');
        if (btn && !btn.disabled) {
          btn.disabled = true;
          btn.textContent = form.getAttribute('data-loading-text') || 'Memproses...';
        }
      });

      syncDashboardLive();
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) syncDashboardLive();
      });
      window.addEventListener('focus', syncDashboardLive);
      setInterval(() => {
        if (!document.hidden) syncDashboardLive();
      }, 6000);
    })();
  </script>
</body>
</html>`;
}
