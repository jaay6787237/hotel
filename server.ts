import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';
import { checkHealth } from './src/server/db.ts';
import {
  ADMIN_COOKIE_NAME,
  consumeFlash,
  generateSignedToken,
  getAuthenticatedAdmin,
  getConfiguredAdminPassword,
  getConfiguredAdminUsername,
  sendCookie,
  SESSION_TTL_SECONDS,
  setFlash,
  verifyAdminCredentials,
} from './src/server/auth.ts';
import {
  batalkanReservasi,
  buatReservasiBaru,
  createRoom,
  deleteRoom,
  findByKodeBooking,
  getActivePromos,
  getAnalitikSubquery,
  getAuditLogs,
  getCategories,
  getKpiMetrics,
  getLaporanMultiJoin,
  getRoomsWithCategory,
  InvalidInputError,
  KamarKotorException,
  KamarPenuhException,
  prosesCheckIn,
  prosesCheckOut,
  updateRoomStatus,
  validatePromoCode,
  VoucherTidakValidException,
} from './src/server/hotelService.ts';
import { renderLandingPage } from './src/server/views/landing.ts';
import { renderLoginPage } from './src/server/views/login.ts';
import { renderDashboardPage } from './src/server/views/dashboard.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

const app = express();
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(publicDir, { index: false }));

function formatYmdOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

function requireAdminOrRedirect(req: Request, res: Response): ReturnType<typeof getAuthenticatedAdmin> {
  const session = getAuthenticatedAdmin(req);
  if (!session) {
    setFlash(res, req, 'error', 'Silakan masuk terlebih dahulu untuk mengakses Dashboard Front Office.');
    res.redirect('/admin/login');
    return null;
  }
  return session;
}

// Halaman Publik Tamu
app.get('/', async (req: Request, res: Response) => {
  let rooms: Awaited<ReturnType<typeof getRoomsWithCategory>> = [];
  let promos: Awaited<ReturnType<typeof getActivePromos>> = [];
  let dbError: string | null = null;
  let kwitansi: Awaited<ReturnType<typeof findByKodeBooking>> = null;
  let cekKodeError: string | null = null;
  const searchedCode = String(req.query.cek_kode ?? '').trim();
  const kwitansiCode = String(req.query.kwitansi ?? '').trim();

  try {
    [rooms, promos] = await Promise.all([getRoomsWithCategory(), getActivePromos()]);
    if (kwitansiCode !== '') {
      kwitansi = await findByKodeBooking(kwitansiCode);
      if (!kwitansi) {
        cekKodeError = `Kode booking '${kwitansiCode}' tidak ditemukan pada sistem reservasi kami.`;
      }
    } else if (searchedCode !== '') {
      kwitansi = await findByKodeBooking(searchedCode);
      if (!kwitansi) {
        cekKodeError = `Kode booking '${searchedCode}' tidak ditemukan. Pastikan format seperti BRH-XXXXXX.`;
      }
    }
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  const flash = consumeFlash(req, res);
  res.type('html').send(
    renderLandingPage({
      rooms,
      promos,
      kwitansi,
      cekKodeError,
      searchedCode,
      dbError,
      flash,
      defaultCheckIn: formatYmdOffset(7),
      defaultCheckOut: formatYmdOffset(9),
    })
  );
});

// Endpoint API Reservasi & Promo Publik
const handleCreateReservation = async (req: Request, res: Response) => {
  try {
    const data = await buatReservasiBaru((req.body ?? {}) as Record<string, unknown>);
    res.status(201).json({
      success: true,
      message: 'Reservasi berhasil dikunci ke basis data PostgreSQL.',
      data,
    });
  } catch (err) {
    if (err instanceof KamarPenuhException) {
      res.status(409).json({ success: false, type: 'KamarPenuhException', error: err.message });
      return;
    }
    if (err instanceof VoucherTidakValidException) {
      res.status(400).json({ success: false, type: 'VoucherTidakValidException', error: err.message });
      return;
    }
    if (err instanceof InvalidInputError) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    const msg = err instanceof Error ? err.message : String(err);
    let status = 500;
    let outMsg = msg;
    if (msg.includes('TANGGAL_TIDAK_VALID')) {
      status = 400;
      outMsg = 'Tanggal Check-Out harus setelah tanggal Check-In.';
    } else if (msg.includes('KAMAR_PENUH')) {
      status = 409;
      outMsg = 'Kamar sudah dipesan pada rentang tanggal tersebut atau sedang dalam pemeliharaan.';
    } else if (msg.includes('VOUCHER_TIDAK_VALID')) {
      status = 400;
      outMsg = 'Kode voucher promo tidak valid atau sudah kedaluwarsa.';
    }
    res.status(status).json({ success: false, error: outMsg });
  }
};

app.post('/reservasi/buat', handleCreateReservation);
app.post('/api/reservations', handleCreateReservation);

const handleLookupReservation = async (req: Request, res: Response) => {
  const kode = String(req.query.kode ?? req.body?.kode_booking ?? '').trim();
  if (!kode) {
    res.status(400).json({
      success: false,
      error: 'Mohon masukkan kode booking Anda (cth. BRH-882410).',
    });
    return;
  }
  try {
    const data = await findByKodeBooking(kode);
    if (!data) {
      res.status(404).json({
        success: false,
        error: `Kode booking '${kode}' tidak ditemukan dalam catatan kami.`,
      });
      return;
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

app.get('/reservasi/cek', handleLookupReservation);
app.post('/reservasi/cek', handleLookupReservation);
app.get('/api/reservations/cek', handleLookupReservation);

app.get('/reservasi/kwitansi/:kode', async (req: Request, res: Response) => {
  const kode = String(req.params.kode ?? '').trim();
  if (!kode) {
    res.status(400).send('Kode booking tidak valid.');
    return;
  }
  try {
    const data = await findByKodeBooking(kode);
    if (!data) {
      res.status(404).send('Kwitansi tidak ditemukan.');
      return;
    }
    const fmtIdr = (v: unknown) => `IDR ${Math.round(Number(v) || 0).toLocaleString('id-ID')}`;
    const esc = (s: unknown) =>
      String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    res.type('html').send(`<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kwitansi Resmi ${esc(data.kode_booking)} | Bukit Randu Hospitality</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600&family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print { .no-print { display: none !important; } body { background: #fff !important; } }
    body { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
    h1, .font-serif { font-family: 'Playfair Display', Georgia, serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .tabular-nums { font-variant-numeric: tabular-nums; }
  </style>
</head>
<body class="bg-slate-100 text-[#0F1F17] min-h-screen p-4 sm:p-10 font-sans">
  <div class="max-w-2xl mx-auto bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
    <div class="bg-[#0F1F17] text-white px-6 py-5 flex items-center justify-between gap-4">
      <div>
        <div class="text-[11px] uppercase tracking-widest text-[#D4AF37] font-semibold">Official Guest Folio</div>
        <h1 class="text-xl font-serif font-bold mt-0.5">Bukit Randu Hotel &amp; Resort</h1>
        <p class="text-xs text-slate-300">Jl. Kamboja No. 1-2, Kebon Jeruk, Bandar Lampung</p>
      </div>
      <div class="text-right">
        <span class="text-[10px] uppercase text-slate-400 block">Kode Booking</span>
        <span class="font-mono text-lg font-bold text-[#D4AF37]">${esc(data.kode_booking)}</span>
      </div>
    </div>
    <div class="p-6 space-y-6 text-sm">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
        <div>
          <span class="text-[11px] uppercase text-slate-500 font-semibold block">Nama Tamu</span>
          <strong class="text-slate-900">${esc(data.nama_tamu)}</strong>
          <div class="text-xs text-slate-500">${esc(data.email_tamu)} &middot; ${esc(data.telepon_tamu)}</div>
        </div>
        <div class="sm:text-right">
          <span class="text-[11px] uppercase text-slate-500 font-semibold block">Status Reservasi &amp; Bayar</span>
          <strong class="text-[#007A33]">${esc(data.status_reservasi)} &middot; ${esc(data.status_pembayaran)}</strong>
          <div class="text-xs text-slate-500">${esc(data.metode_pembayaran)}</div>
        </div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-200 text-xs">
        <div><span class="text-slate-500 block">Akomodasi</span><strong class="text-slate-900">${esc(data.nama_kamar)} (No. ${esc(data.nomor_kamar)})</strong></div>
        <div><span class="text-slate-500 block">Check-In</span><strong class="text-slate-900">${esc(data.tgl_checkin)}</strong></div>
        <div><span class="text-slate-500 block">Check-Out</span><strong class="text-slate-900">${esc(data.tgl_checkout)} (${data.jumlah_malam} Malam)</strong></div>
      </div>
      <div class="space-y-2 text-xs">
        <div class="flex justify-between"><span>Subtotal Tarif Kamar</span><span class="tabular-nums font-medium">${fmtIdr(data.subtotal)}</span></div>
        ${Number(data.potongan_diskon) > 0 ? `<div class="flex justify-between text-[#007A33]"><span>Potongan Promo (${esc(data.kode_promo)})</span><span class="tabular-nums font-semibold">-${fmtIdr(data.potongan_diskon)}</span></div>` : ''}
        <div class="flex justify-between"><span>Biaya Layanan Resor (5%)</span><span class="tabular-nums">${fmtIdr(data.biaya_layanan)}</span></div>
        <div class="flex justify-between"><span>Pajak Pemerintah PPN (10%)</span><span class="tabular-nums">${fmtIdr(data.pajak_ppn)}</span></div>
        <div class="flex justify-between pt-3 border-t border-slate-200 text-base font-bold text-[#007A33]">
          <span>Total Pembayaran Sah</span>
          <span class="tabular-nums">${fmtIdr(data.total_tagihan)}</span>
        </div>
      </div>
      <div class="no-print pt-4 flex items-center justify-between gap-3 border-t border-slate-100">
        <a href="/?cek_kode=${encodeURIComponent(data.kode_booking)}#cek-booking" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md">Kembali ke Resor</a>
        <button type="button" onclick="window.print()" class="px-5 py-2 bg-[#007A33] hover:bg-[#005A2B] text-white text-xs font-semibold uppercase tracking-wider rounded-md cursor-pointer">Cetak Halaman Ini</button>
      </div>
    </div>
  </div>
</body>
</html>`);
  } catch (err) {
    res.status(500).send(err instanceof Error ? err.message : String(err));
  }
});

app.get('/promo/cek', async (req: Request, res: Response) => {
  const kode = String(req.query.kode ?? '').trim();
  try {
    const data = await validatePromoCode(kode);
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof VoucherTidakValidException) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

// Health Check PostgreSQL
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const { totalKamar } = await checkHealth();
    res.json({
      status: 'healthy',
      runtime: `Node.js ${process.version} Express TypeScript`,
      database: 'PostgreSQL Cloud SQL (pg)',
      totalKamar,
    });
  } catch (err) {
    res.status(500).json({
      status: 'unhealthy',
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

// Rute Autentikasi Admin (Stateless Signed HTTP-Only Cookie)
const showLoginHandler = (req: Request, res: Response) => {
  if (getAuthenticatedAdmin(req)) {
    res.redirect('/admin/dashboard');
    return;
  }
  const flash = consumeFlash(req, res);
  res.type('html').send(
    renderLoginPage({
      flash,
      defaultAdminUser: getConfiguredAdminUsername(),
      isDefaultPassword: getConfiguredAdminPassword() === 'BukitRandu2026!',
    })
  );
};

const loginPostHandler = (req: Request, res: Response) => {
  const username = String(req.body?.username ?? req.body?.email ?? '').trim();
  const password = String(req.body?.password ?? '');

  if (!username || !password) {
    setFlash(res, req, 'error', 'Email/Username dan Kata Sandi wajib diisi.');
    res.redirect('/admin/login');
    return;
  }

  if (!verifyAdminCredentials(username, password)) {
    setFlash(res, req, 'error', 'Kredensial tidak valid. Periksa kembali akun Admin Front Office Anda.');
    res.redirect('/admin/login');
    return;
  }

  const token = generateSignedToken(username);
  sendCookie(res, req, ADMIN_COOKIE_NAME, token, SESSION_TTL_SECONDS);
  setFlash(res, req, 'success', 'Selamat datang kembali di Portal Operasional Front Office Bukit Randu.');
  res.redirect('/admin/dashboard');
};

const logoutHandler = (req: Request, res: Response) => {
  sendCookie(res, req, ADMIN_COOKIE_NAME, '', 0);
  setFlash(res, req, 'success', 'Anda telah keluar dari sesi Admin dengan aman.');
  res.redirect('/admin/login');
};

app.get('/admin/login', showLoginHandler);
app.get('/login', showLoginHandler);
app.get('/masuk', (_req: Request, res: Response) => res.redirect('/admin/login'));
app.post('/admin/login', loginPostHandler);
app.post('/login', loginPostHandler);
app.post('/admin/logout', logoutHandler);
app.get('/admin/logout', logoutHandler);
app.post('/logout', logoutHandler);
app.get('/logout', logoutHandler);

// Rute Dashboard Operasional Front Office Admin
const dashboardHandler = async (req: Request, res: Response) => {
  const session = requireAdminOrRedirect(req, res);
  if (!session) return;

  try {
    const [kpi, reservations, rooms, categories, subqueryAnalytics, auditLogs] = await Promise.all([
      getKpiMetrics(),
      getLaporanMultiJoin(),
      getRoomsWithCategory(),
      getCategories(),
      getAnalitikSubquery(),
      getAuditLogs(20),
    ]);
    const flash = consumeFlash(req, res);
    const adminIdentity = `${session.user} — Duty Manager (Front Office)`;

    res.type('html').send(
      renderDashboardPage({
        adminIdentity,
        kpi,
        reservations,
        rooms,
        categories,
        subqueryAnalytics,
        auditLogs,
        flash,
      })
    );
  } catch (err) {
    res.status(500).type('html').send(
      `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Error Dashboard</title></head><body><h1>Gagal Memuat Dashboard</h1><p>${err instanceof Error ? err.message : String(err)}</p></body></html>`
    );
  }
};

app.get('/admin', dashboardHandler);
app.get('/admin/dashboard', dashboardHandler);

app.post('/admin/reservasi/checkin', async (req: Request, res: Response) => {
  if (!requireAdminOrRedirect(req, res)) return;
  const idReservasi = Number(req.body?.id_reservasi ?? 0);
  try {
    await prosesCheckIn(idReservasi);
    setFlash(res, req, 'success', `Check-In reservasi #${idReservasi} berhasil diproses.`);
  } catch (err) {
    if (err instanceof KamarKotorException) {
      setFlash(res, req, 'error', err.message);
    } else {
      setFlash(res, req, 'error', `Gagal memproses Check-In: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  res.redirect('/admin/dashboard');
});

app.post('/admin/reservasi/checkout', async (req: Request, res: Response) => {
  if (!requireAdminOrRedirect(req, res)) return;
  const idReservasi = Number(req.body?.id_reservasi ?? 0);
  try {
    await prosesCheckOut(idReservasi);
    setFlash(
      res,
      req,
      'success',
      `Check-Out reservasi #${idReservasi} selesai. Kamar kini berstatus Pemeliharaan.`
    );
  } catch (err) {
    setFlash(res, req, 'error', `Gagal memproses Check-Out: ${err instanceof Error ? err.message : String(err)}`);
  }
  res.redirect('/admin/dashboard');
});

app.post('/admin/reservasi/batal', async (req: Request, res: Response) => {
  if (!requireAdminOrRedirect(req, res)) return;
  const idReservasi = Number(req.body?.id_reservasi ?? 0);
  try {
    await batalkanReservasi(idReservasi);
    setFlash(res, req, 'success', `Reservasi #${idReservasi} dibatalkan dan dicatat oleh Audit Log.`);
  } catch (err) {
    setFlash(res, req, 'error', `Gagal membatalkan reservasi: ${err instanceof Error ? err.message : String(err)}`);
  }
  res.redirect('/admin/dashboard');
});

app.post('/admin/kamar/tambah', async (req: Request, res: Response) => {
  if (!requireAdminOrRedirect(req, res)) return;
  try {
    await createRoom((req.body ?? {}) as Record<string, unknown>);
    setFlash(res, req, 'success', 'Unit kamar baru berhasil ditambahkan ke inventaris resort.');
  } catch (err) {
    setFlash(res, req, 'error', `Gagal menambah kamar baru: ${err instanceof Error ? err.message : String(err)}`);
  }
  res.redirect('/admin/dashboard#manajemen-kamar');
});

app.post('/admin/kamar/status', async (req: Request, res: Response) => {
  if (!requireAdminOrRedirect(req, res)) return;
  const idKamar = Number(req.body?.id_kamar ?? 0);
  const status = String(req.body?.status_ketersediaan ?? 'Tersedia');
  try {
    await updateRoomStatus(idKamar, status);
    setFlash(res, req, 'success', `Status unit kamar #${idKamar} diperbarui menjadi '${status}'.`);
  } catch (err) {
    setFlash(res, req, 'error', `Gagal memperbarui status kamar: ${err instanceof Error ? err.message : String(err)}`);
  }
  res.redirect('/admin/dashboard#manajemen-kamar');
});

app.post('/admin/kamar/hapus', async (req: Request, res: Response) => {
  if (!requireAdminOrRedirect(req, res)) return;
  const idKamar = Number(req.body?.id_kamar ?? 0);
  try {
    await deleteRoom(idKamar);
    setFlash(res, req, 'success', `Unit kamar #${idKamar} berhasil dihapus.`);
  } catch {
    setFlash(
      res,
      req,
      'error',
      'Kamar tidak dapat dihapus karena sudah terikat dengan data riwayat reservasi (Integrity Constraint).'
    );
  }
  res.redirect('/admin/dashboard#manajemen-kamar');
});

// 404 Fallback
app.use((_req: Request, res: Response) => {
  res
    .status(404)
    .type('html')
    .send(
      '<!doctype html><html lang="id"><head><meta charset="utf-8"><title>404 — Halaman Tidak Ditemukan</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#F8FAFC] text-[#0F1F17] min-h-screen flex items-center justify-center p-6"><div class="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 text-center shadow-lg"><p class="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">Bukit Randu Hospitality</p><h1 class="text-3xl font-bold mt-2">404</h1><p class="text-sm text-slate-600 mt-2">Halaman yang Anda cari tidak tersedia.</p><a href="/" class="inline-block mt-6 px-5 py-2.5 bg-[#007A33] text-white text-xs font-semibold uppercase tracking-wider rounded">Kembali ke Beranda</a></div></body></html>'
    );
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Bukit Randu Hospitality server listening on http://0.0.0.0:${PORT}`);
});
