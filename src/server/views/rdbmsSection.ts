import { escapeHtml } from './helpers.ts';

interface SqlBlockSpec {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  sql: string;
}

const SQL_SNIPPETS: SqlBlockSpec[] = [
  {
    id: 'sf',
    label: 'Stored Function (SF)',
    title: 'sf_hitung_total_tagihan & sf_cek_ketersediaan_kamar',
    subtitle: 'Mengembalikan nilai skalar (NUMERIC / BOOLEAN) dan dapat dipanggil langsung di dalam perintah SELECT.',
    sql: `CREATE OR REPLACE FUNCTION public.sf_hitung_total_tagihan(
    p_harga_per_malam NUMERIC,
    p_jumlah_malam INT,
    p_persen_diskon INT DEFAULT 0,
    p_maks_diskon NUMERIC DEFAULT 0
) RETURNS NUMERIC LANGUAGE plpgsql AS $$
DECLARE
    v_subtotal NUMERIC(12, 2);
    v_potongan NUMERIC(12, 2);
    v_setelah_diskon NUMERIC(12, 2);
BEGIN
    v_subtotal := p_harga_per_malam * GREATEST(p_jumlah_malam, 1);
    v_potongan := ROUND(v_subtotal * (GREATEST(LEAST(COALESCE(p_persen_diskon, 0), 100), 0) / 100.0), 2);
    IF COALESCE(p_maks_diskon, 0) > 0 AND v_potongan > p_maks_diskon THEN
        v_potongan := p_maks_diskon;
    END IF;
    v_setelah_diskon := v_subtotal - v_potongan;
    -- Layanan Resor 5% + PPN Pemerintah 10%
    RETURN ROUND(v_setelah_diskon + ROUND(v_setelah_diskon * 0.05, 2) + ROUND(v_setelah_diskon * 0.10, 2), 2);
END;
$$;

-- Pemanggilan Stored Function:
SELECT public.sf_cek_ketersediaan_kamar(3, '2026-12-20'::date, '2026-12-22'::date) AS tersedia,
       public.sf_hitung_total_tagihan(2850000, 2, 15, 1500000) AS total_tagihan;`,
  },
  {
    id: 'sp',
    label: 'Stored Procedure (SP)',
    title: 'sp_buat_reservasi_baru & sp_proses_check_out',
    subtitle: 'Menjalankan rangkaian validasi bisnis dan operasi INSERT/UPDATE multi-tabel secara atomik melalui perintah CALL.',
    sql: `CREATE OR REPLACE PROCEDURE public.sp_buat_reservasi_baru(
    IN p_kode_booking VARCHAR, IN p_nama_tamu VARCHAR, IN p_email_tamu VARCHAR,
    IN p_no_telepon VARCHAR, IN p_kota_asal VARCHAR, IN p_id_kamar INT,
    IN p_tgl_checkin DATE, IN p_tgl_checkout DATE, IN p_jumlah_tamu INT,
    IN p_kode_promo VARCHAR, IN p_catatan_khusus TEXT, IN p_metode_pembayaran VARCHAR
) LANGUAGE plpgsql AS $$
BEGIN
    IF NOT public.sf_cek_ketersediaan_kamar(p_id_kamar, p_tgl_checkin, p_tgl_checkout) THEN
        RAISE EXCEPTION 'KAMAR_PENUH: Kamar sudah dipesan atau dalam pemeliharaan.';
    END IF;
    -- 1) Upsert profil tamu (ON CONFLICT email DO UPDATE)
    -- 2) Hitung tagihan via sf_hitung_total_tagihan()
    -- 3) INSERT public.reservasi (otomatis memicu Trigger Audit)
    -- 4) INSERT public.pembayaran berstatus 'Lunas'
END;
$$;

-- Pemanggilan Stored Procedure dari server Express:
CALL public.sp_buat_reservasi_baru(
    'BRH-882410', 'Dr. Hartono Sasongko', 'hartono@example.com',
    '+62 811-721-9001', 'Jakarta', 3, '2026-12-20', '2026-12-22',
    2, 'HILLTOP15', 'Lantai tertinggi', 'Transfer Virtual Account (BCA/Mandiri)'
);`,
  },
  {
    id: 'trigger',
    label: 'Database Trigger',
    title: 'trg_log_perubahan_reservasi & trg_update_ketersediaan_kamar',
    subtitle: 'Berjalan otomatis pada event AFTER INSERT dan AFTER UPDATE tabel reservasi memakai record sistem OLD dan NEW.',
    sql: `CREATE OR REPLACE FUNCTION public.fn_trg_log_perubahan_reservasi()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.status_reservasi IS DISTINCT FROM NEW.status_reservasi THEN
        IF NEW.status_reservasi = 'Check-In' THEN
            UPDATE public.kamar SET status_ketersediaan = 'Terisi' WHERE id_kamar = NEW.id_kamar;
        ELSIF NEW.status_reservasi = 'Selesai' THEN
            UPDATE public.kamar SET status_ketersediaan = 'Pemeliharaan' WHERE id_kamar = NEW.id_kamar;
        ELSIF NEW.status_reservasi = 'Batal' AND OLD.status_reservasi = 'Check-In' THEN
            UPDATE public.kamar SET status_ketersediaan = 'Tersedia' WHERE id_kamar = NEW.id_kamar;
        END IF;

        INSERT INTO public.log_audit_reservasi (id_reservasi, kode_booking, status_lama, status_baru, keterangan)
        VALUES (NEW.id_reservasi, NEW.kode_booking, OLD.status_reservasi, NEW.status_reservasi,
                'Perubahan status otomatis oleh Trigger: ' || OLD.status_reservasi || ' -> ' || NEW.status_reservasi);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_perubahan_reservasi
AFTER UPDATE ON public.reservasi
FOR EACH ROW EXECUTE FUNCTION public.fn_trg_log_perubahan_reservasi();`,
  },
  {
    id: 'multijoin',
    label: 'View Multi-Join 6 Tabel',
    title: 'vw_laporan_reservasi_lengkap',
    subtitle: 'Menggabungkan 6 tabel (INNER JOIN & LEFT JOIN + COALESCE) menjadi satu tabel virtual untuk Kwitansi dan Dashboard Admin.',
    sql: `CREATE OR REPLACE VIEW public.vw_laporan_reservasi_lengkap AS
SELECT
    r.id_reservasi, r.kode_booking,
    t.nama_lengkap AS nama_tamu, t.email AS email_tamu,
    k.nomor_kamar, k.nama_kamar, k.status_ketersediaan AS status_kamar,
    kk.nama_kategori,
    COALESCE(vp.kode_promo, '-') AS kode_promo,
    r.tgl_checkin, r.tgl_checkout, r.total_tagihan, r.status_reservasi,
    COALESCE(p.metode_pembayaran, 'Bayar di Resepsionis') AS metode_pembayaran,
    COALESCE(p.status_pembayaran, 'Belum Lunas') AS status_pembayaran
FROM public.reservasi r
INNER JOIN public.tamu t ON r.id_tamu = t.id_tamu
INNER JOIN public.kamar k ON r.id_kamar = k.id_kamar
INNER JOIN public.kategori_kamar kk ON k.id_kategori = kk.id_kategori
LEFT JOIN public.pembayaran p ON r.id_reservasi = p.id_reservasi
LEFT JOIN public.voucher_promo vp ON r.id_voucher = vp.id_voucher
ORDER BY r.created_at DESC;`,
  },
  {
    id: 'subquery',
    label: 'Subquery & Agregasi',
    title: 'Scalar Subquery Tarif Premium & FILTER KPI',
    subtitle: 'Membandingkan tarif unit terhadap rata-rata seluruh hotel sekaligus menghitung okupansi real-time.',
    sql: `-- 1. Scalar Subquery: Mencari unit kamar bertarif di atas rata-rata hotel
SELECT k.kode_kamar, k.nomor_kamar, k.nama_kamar, k.tarif_per_malam, kk.nama_kategori
FROM public.kamar k
INNER JOIN public.kategori_kamar kk ON k.id_kategori = kk.id_kategori
WHERE k.tarif_per_malam > (
    SELECT AVG(tarif_per_malam) FROM public.kamar
)
ORDER BY k.tarif_per_malam DESC;

-- 2. Agregasi Bersyarat (FILTER Clause) untuk KPI Front Office
SELECT
    COUNT(*) AS total_kamar,
    COUNT(*) FILTER (WHERE status_ketersediaan = 'Terisi') AS kamar_terisi,
    COUNT(*) FILTER (WHERE status_ketersediaan = 'Tersedia') AS kamar_tersedia,
    COUNT(*) FILTER (WHERE status_ketersediaan = 'Pemeliharaan') AS kamar_pemeliharaan
FROM public.kamar;`,
  },
];

export function renderRdbmsArchitectureSection(): string {
  const snippetTabsHtml = SQL_SNIPPETS.map(
    (item, idx) => `<button
      type="button"
      role="tab"
      aria-selected="${idx === 0 ? 'true' : 'false'}"
      data-sql-tab="${escapeHtml(item.id)}"
      class="rdbms-sql-tab btn-ripple-dark px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
        idx === 0
          ? 'bg-white text-[#0F1F17] shadow-xs'
          : 'text-slate-600 hover:text-slate-900'
      }"
    >${escapeHtml(item.label)}</button>`
  ).join('');

  const snippetPanelsHtml = SQL_SNIPPETS.map(
    (item, idx) => `<div
      data-sql-panel="${escapeHtml(item.id)}"
      role="tabpanel"
      class="rdbms-sql-panel ${idx === 0 ? '' : 'hidden'}"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-[#14291E] border-b border-white/10">
        <div class="min-w-0">
          <div class="text-[11px] font-mono font-semibold text-[#D4AF37] truncate">${escapeHtml(item.title)}</div>
          <p class="text-xs text-slate-300 mt-0.5">${escapeHtml(item.subtitle)}</p>
        </div>
        <button
          type="button"
          data-copy-sql="${escapeHtml(item.id)}"
          class="copy-sql-btn px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold rounded cursor-pointer transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
        >Salin SQL</button>
      </div>
      <div class="p-4 sm:p-6 overflow-x-auto bg-[#0F1F17]">
        <pre id="sql-code-${escapeHtml(item.id)}" class="text-[12px] leading-relaxed font-mono text-emerald-100 whitespace-pre">${escapeHtml(item.sql)}</pre>
      </div>
    </div>`
  ).join('');

  return `<section id="arsitektur-db" class="scroll-mt-24 py-20 bg-white border-t border-slate-200 reveal-on-scroll">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">

      <!-- HEADER SECTION -->
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-slate-200">
        <div class="max-w-3xl">
          <span class="text-xs font-semibold uppercase tracking-[0.08em] text-[#007A33] block mb-2">
            Arsitektur Basis Data Relasional &middot; PostgreSQL PL/pgSQL
          </span>
          <h2 class="text-3xl sm:text-4xl font-serif font-bold text-[#0F1F17] tracking-tight" style="text-wrap: balance;">
            Penjelasan Trigger, Stored Procedure, Stored Function, Multi-Join &amp; Analitik SQL
          </h2>
          <p class="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Seluruh alur pemesanan kamar, kalkulasi tarif pajak, sinkronisasi status housekeeping, hingga penerbitan kwitansi pada Bukit Randu Hospitality berjalan langsung di atas objek PostgreSQL untuk menjaga akurasi dan integritas data.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href="/Dokumentasi_RDBMS_Bukit_Randu.pdf"
            target="_blank"
            class="btn-press btn-ripple-dark px-4 py-2.5 text-xs font-semibold text-[#007A33] border border-[#007A33] hover:bg-[#007A33]/5 rounded transition-colors whitespace-nowrap"
          >
            Buka Dokumentasi PDF
          </a>
          <a
            href="/admin/login"
            class="btn-press px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-[#007A33] hover:bg-[#005A2B] rounded shadow-xs transition-colors whitespace-nowrap"
          >
            Lihat Implementasi Dashboard
          </a>
        </div>
      </div>

      <!-- BAGIAN 01: ALUR KERJA END-TO-END & PETA KOMPONEN -->
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h3 class="text-xl sm:text-2xl font-serif font-bold text-[#0F1F17]">
            01. Peta Alur Eksekusi Transaksi di Basis Data
          </h3>
          <span class="text-xs text-slate-500">Klik kartu komponen untuk melompat ke bagian penjelasan</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <a href="#bagian-sf" class="group p-6 bg-[#F8FAFC] hover:bg-white rounded-xl border border-slate-200 hover:border-[#007A33]/40 transition-all hover:shadow-md">
            <div class="text-xs font-semibold text-[#007A33]">01 &middot; Stored Function (SF)</div>
            <h4 class="text-lg font-serif font-bold text-[#0F1F17] mt-1 group-hover:text-[#007A33] transition-colors">Kalkulasi &amp; Validasi Nilai</h4>
            <p class="text-xs text-slate-600 mt-2 leading-relaxed">
              Fungsi <span class="font-mono text-[#0F1F17]">sf_hitung_total_tagihan</span> &amp; <span class="font-mono text-[#0F1F17]">sf_cek_ketersediaan_kamar</span> mengembalikan angka tagihan atau status boolean ketersediaan jadwal.
            </p>
          </a>

          <a href="#bagian-sp" class="group p-6 bg-[#F8FAFC] hover:bg-white rounded-xl border border-slate-200 hover:border-[#007A33]/40 transition-all hover:shadow-md">
            <div class="text-xs font-semibold text-[#007A33]">02 &middot; Stored Procedure (SP)</div>
            <h4 class="text-lg font-serif font-bold text-[#0F1F17] mt-1 group-hover:text-[#007A33] transition-colors">Orkestrasi Transaksi Atomik</h4>
            <p class="text-xs text-slate-600 mt-2 leading-relaxed">
              Prosedur <span class="font-mono text-[#0F1F17]">sp_buat_reservasi_baru</span> &amp; <span class="font-mono text-[#0F1F17]">sp_proses_check_out</span> dipanggil via <span class="font-mono">CALL</span> untuk mengeksekusi validasi, upsert tamu, dan pembayaran sekaligus.
            </p>
          </a>

          <a href="#bagian-trigger" class="group p-6 bg-[#F8FAFC] hover:bg-white rounded-xl border border-slate-200 hover:border-[#007A33]/40 transition-all hover:shadow-md">
            <div class="text-xs font-semibold text-[#007A33]">03 &middot; Database Trigger</div>
            <h4 class="text-lg font-serif font-bold text-[#0F1F17] mt-1 group-hover:text-[#007A33] transition-colors">Otomasi Status &amp; Audit Log</h4>
            <p class="text-xs text-slate-600 mt-2 leading-relaxed">
              Trigger <span class="font-mono text-[#0F1F17]">AFTER INSERT</span> dan <span class="font-mono text-[#0F1F17]">AFTER UPDATE</span> memperbarui status kamar dan menulis catatan riwayat secara otomatis tanpa query manual tambahan.
            </p>
          </a>

          <a href="#bagian-multijoin" class="group p-6 bg-[#F8FAFC] hover:bg-white rounded-xl border border-slate-200 hover:border-[#007A33]/40 transition-all hover:shadow-md">
            <div class="text-xs font-semibold text-[#007A33]">04 &middot; View Multi-Join 6 Tabel</div>
            <h4 class="text-lg font-serif font-bold text-[#0F1F17] mt-1 group-hover:text-[#007A33] transition-colors">Pelaporan &amp; Kwitansi Terpadu</h4>
            <p class="text-xs text-slate-600 mt-2 leading-relaxed">
              <span class="font-mono text-[#0F1F17]">vw_laporan_reservasi_lengkap</span> menyatukan 6 tabel memakai kombinasi <span class="font-mono">INNER JOIN</span> dan <span class="font-mono">LEFT JOIN</span> untuk fitur Cek Booking serta Dashboard Admin.
            </p>
          </a>

          <a href="#bagian-subquery" class="group p-6 bg-[#F8FAFC] hover:bg-white rounded-xl border border-slate-200 hover:border-[#007A33]/40 transition-all hover:shadow-md">
            <div class="text-xs font-semibold text-[#007A33]">05 &middot; Scalar Subquery &amp; Filter</div>
            <h4 class="text-lg font-serif font-bold text-[#0F1F17] mt-1 group-hover:text-[#007A33] transition-colors">Analitik Tarif &amp; Okupansi</h4>
            <p class="text-xs text-slate-600 mt-2 leading-relaxed">
              Query bersarang (<span class="font-mono">SELECT AVG(...)</span>) mendeteksi kamar segmen premium di atas rata-rata, sementara <span class="font-mono">FILTER</span> menghitung KPI okupansi hotel secara presisi.
            </p>
          </a>

          <a href="#bagian-tabel" class="group p-6 bg-[#F8FAFC] hover:bg-white rounded-xl border border-slate-200 hover:border-[#007A33]/40 transition-all hover:shadow-md">
            <div class="text-xs font-semibold text-[#007A33]">06 &middot; 7 Tabel &amp; Foreign Key</div>
            <h4 class="text-lg font-serif font-bold text-[#0F1F17] mt-1 group-hover:text-[#007A33] transition-colors">Normalisasi &amp; Integritas Data</h4>
            <p class="text-xs text-slate-600 mt-2 leading-relaxed">
              Tujuh tabel ternormalisasi dengan aturan <span class="font-mono">CHECK</span>, <span class="font-mono">UNIQUE</span>, dan aksi referensial <span class="font-mono">RESTRICT / CASCADE / SET NULL</span> mencegah data yatim.
            </p>
          </a>
        </div>
      </div>

      <!-- BAGIAN 02: STORED FUNCTION (SF) & STORED PROCEDURE (SP) -->
      <div id="bagian-sf" class="scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-slate-200">
        <div class="lg:col-span-6 space-y-4">
          <span class="text-xs font-semibold uppercase tracking-wider text-[#007A33] block">Bagian 02A &middot; Stored Function (SF)</span>
          <h3 class="text-2xl font-serif font-bold text-[#0F1F17]">
            Fungsi Pengolah Nilai &amp; Validasi Jadwal
          </h3>
          <p class="text-sm text-slate-600 leading-relaxed">
            <strong>Stored Function</strong> adalah blok program PL/pgSQL yang disimpan di server database dan <strong>wajib mengembalikan satu nilai keluaran (<span class="font-mono">RETURNS</span>)</strong>. Karena mengembalikan nilai, SF dapat disisipkan langsung ke dalam klausa <span class="font-mono">SELECT</span>, <span class="font-mono">WHERE</span>, maupun dipanggil dari dalam Stored Procedure.
          </p>

          <div class="space-y-3 pt-1">
            <div class="p-4 bg-[#F8FAFC] rounded-lg border border-slate-200">
              <div class="flex items-center justify-between gap-2 text-xs">
                <span class="font-mono font-bold text-[#007A33]">sf_hitung_total_tagihan(harga, malam, diskon, maks)</span>
                <span class="text-slate-500 font-mono">RETURNS NUMERIC</span>
              </div>
              <p class="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Menghitung subtotal tarif malam, membatasi potongan promo agar tidak melebihi plafon <span class="font-mono">maks_diskon</span>, lalu menambahkan biaya layanan 5% dan pajak PPN 10% secara seragam.
              </p>
            </div>

            <div class="p-4 bg-[#F8FAFC] rounded-lg border border-slate-200">
              <div class="flex items-center justify-between gap-2 text-xs">
                <span class="font-mono font-bold text-[#007A33]">sf_cek_ketersediaan_kamar(id_kamar, ci, co)</span>
                <span class="text-slate-500 font-mono">RETURNS BOOLEAN</span>
              </div>
              <p class="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Memastikan tanggal check-out setelah check-in, status kamar wajib <span class="font-mono">Tersedia</span> (menolak kamar <span class="font-mono">Terisi</span> maupun <span class="font-mono">Pemeliharaan</span>), dan nol bentrokan rentang tanggal (<span class="font-mono">tgl_checkin &lt; p_co AND tgl_checkout &gt; p_ci</span>) pada reservasi aktif.
              </p>
            </div>
          </div>
        </div>

        <div id="bagian-sp" class="scroll-mt-24 lg:col-span-6 space-y-4">
          <span class="text-xs font-semibold uppercase tracking-wider text-[#007A33] block">Bagian 02B &middot; Stored Procedure (SP)</span>
          <h3 class="text-2xl font-serif font-bold text-[#0F1F17]">
            Prosedur Transaksional Multi-Tabel
          </h3>
          <p class="text-sm text-slate-600 leading-relaxed">
            <strong>Stored Procedure</strong> berfokus pada eksekusi alur aksi bisnis lengkap (<span class="font-mono">INSERT</span>, <span class="font-mono">UPDATE</span>, <span class="font-mono">DELETE</span>) melintasi beberapa tabel sekaligus dalam satu pemanggilan <span class="font-mono">CALL</span>, sehingga aplikasi backend cukup mengirim parameter tanpa menuliskan puluhan query terpisah.
          </p>

          <div class="space-y-3 pt-1">
            <div class="p-4 bg-[#F8FAFC] rounded-lg border border-slate-200">
              <div class="flex items-center justify-between gap-2 text-xs">
                <span class="font-mono font-bold text-[#0F1F17]">CALL sp_buat_reservasi_baru(...)</span>
                <span class="text-slate-500">12 Parameter IN</span>
              </div>
              <p class="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Memvalidasi kamar lewat <span class="font-mono">sf_cek_ketersediaan_kamar</span>, mengecek masa berlaku voucher, melakukan <em>upsert</em> data <span class="font-mono">tamu</span>, menghitung total via <span class="font-mono">sf_hitung_total_tagihan</span>, lalu mencatat baris ke <span class="font-mono">reservasi</span> &amp; <span class="font-mono">pembayaran</span>.
              </p>
            </div>

            <div class="p-4 bg-[#F8FAFC] rounded-lg border border-slate-200">
              <div class="flex items-center justify-between gap-2 text-xs">
                <span class="font-mono font-bold text-[#0F1F17]">CALL sp_proses_check_out(p_id_reservasi)</span>
                <span class="text-slate-500">1 Parameter IN</span>
              </div>
              <p class="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Memvalidasi bahwa reservasi belum berstatus <span class="font-mono">Selesai</span> atau <span class="font-mono">Batal</span>, kemudian memperbarui status reservasi menjadi <span class="font-mono">Selesai</span> agar Trigger otomatis menandai kamar ke <span class="font-mono">Pemeliharaan</span>.
              </p>
            </div>
          </div>
        </div>

        <!-- TABEL PERBANDINGAN SP VS SF -->
        <div class="lg:col-span-12 bg-[#F8FAFC] rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-2">
            <h4 class="text-sm font-serif font-bold text-[#0F1F17]">Perbedaan Utama Stored Function (SF) vs Stored Procedure (SP)</h4>
            <span class="text-xs text-slate-500">Standar PostgreSQL PL/pgSQL</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-white border-b border-slate-200 text-slate-600">
                <tr>
                  <th class="px-5 py-3 font-semibold">Aspek</th>
                  <th class="px-5 py-3 font-semibold text-[#007A33]">Stored Function (SF)</th>
                  <th class="px-5 py-3 font-semibold text-[#0F1F17]">Stored Procedure (SP)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 text-slate-700 bg-white/60">
                <tr>
                  <td class="px-5 py-3 font-medium text-slate-900">Cara Pemanggilan</td>
                  <td class="px-5 py-3 font-mono">SELECT nama_fungsi(...)</td>
                  <td class="px-5 py-3 font-mono">CALL nama_prosedur(...)</td>
                </tr>
                <tr>
                  <td class="px-5 py-3 font-medium text-slate-900">Nilai Kembalian</td>
                  <td class="px-5 py-3">Wajib mengembalikan nilai (<span class="font-mono">RETURNS</span> / <span class="font-mono">RETURN</span>).</td>
                  <td class="px-5 py-3">Tidak wajib mengembalikan nilai langsung (fokus aksi DML).</td>
                </tr>
                <tr>
                  <td class="px-5 py-3 font-medium text-slate-900">Peran di Bukit Randu</td>
                  <td class="px-5 py-3">Menghitung tarif+pajak &amp; memeriksa bentrok tanggal kamar.</td>
                  <td class="px-5 py-3">Memproses transaksi pemesanan baru &amp; penyelesaian check-out.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- BAGIAN 03: DATABASE TRIGGER & SIMULATOR INTERAKTIF -->
      <div id="bagian-trigger" class="scroll-mt-24 pt-8 border-t border-slate-200 space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div class="lg:col-span-5 space-y-4">
            <span class="text-xs font-semibold uppercase tracking-wider text-[#007A33] block">Bagian 03 &middot; Database Trigger</span>
            <h3 class="text-2xl font-serif font-bold text-[#0F1F17]">
              Reaksi Otomatis Saat Data Berubah
            </h3>
            <p class="text-sm text-slate-600 leading-relaxed">
              <strong>Trigger</strong> adalah prosedur khusus (<span class="font-mono">RETURNS TRIGGER</span>) yang otomatis dieksekusi oleh PostgreSQL ketika terjadi event <span class="font-mono">INSERT</span> atau <span class="font-mono">UPDATE</span> pada tabel <span class="font-mono">public.reservasi</span>.
            </p>
            <ul class="space-y-2.5 text-xs text-slate-700 leading-relaxed">
              <li class="p-3 bg-[#F8FAFC] rounded-lg border border-slate-200">
                <strong class="font-mono text-[#007A33] block">1. trg_update_ketersediaan_kamar (AFTER INSERT)</strong>
                Berjalan saat baris reservasi baru masuk. Jika status awalnya <span class="font-mono">Check-In</span>, kamar langsung dikunci ke <span class="font-mono">Terisi</span> dan selalu mencatat entri awal ke <span class="font-mono">log_audit_reservasi</span>.
              </li>
              <li class="p-3 bg-[#F8FAFC] rounded-lg border border-slate-200">
                <strong class="font-mono text-[#007A33] block">2. trg_log_perubahan_reservasi (AFTER UPDATE)</strong>
                Membandingkan <span class="font-mono">OLD.status_reservasi IS DISTINCT FROM NEW.status_reservasi</span>. Setiap transisi otomatis menyinkronkan status kamar fisik dan merekam jejak audit yang tidak dapat dimanipulasi.
              </li>
            </ul>
          </div>

          <div class="lg:col-span-7 bg-[#F8FAFC] rounded-xl border border-slate-200 p-5 sm:p-6 space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 class="text-base font-serif font-bold text-[#0F1F17]">Simulasi Efek Trigger pada Status Kamar &amp; Audit Log</h4>
                <p class="text-xs text-slate-600">Pilih salah satu aksi siklus reservasi di bawah untuk melihat respons Trigger secara langsung:</p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Simulasi event Trigger">
              <button type="button" data-trg-sim="insert" class="trg-sim-btn btn-ripple-dark px-3.5 py-2 text-xs font-semibold rounded-md bg-[#007A33] text-white cursor-pointer whitespace-nowrap">
                1. INSERT (Dikonfirmasi)
              </button>
              <button type="button" data-trg-sim="checkin" class="trg-sim-btn btn-ripple-dark px-3.5 py-2 text-xs font-semibold rounded-md bg-white border border-slate-300 text-slate-700 hover:border-[#007A33] cursor-pointer whitespace-nowrap">
                2. UPDATE &rarr; Check-In
              </button>
              <button type="button" data-trg-sim="checkout" class="trg-sim-btn btn-ripple-dark px-3.5 py-2 text-xs font-semibold rounded-md bg-white border border-slate-300 text-slate-700 hover:border-[#007A33] cursor-pointer whitespace-nowrap">
                3. UPDATE &rarr; Selesai
              </button>
              <button type="button" data-trg-sim="cancel" class="trg-sim-btn btn-ripple-dark px-3.5 py-2 text-xs font-semibold rounded-md bg-white border border-slate-300 text-slate-700 hover:border-[#007A33] cursor-pointer whitespace-nowrap">
                4. UPDATE &rarr; Batal (dari Check-In)
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div class="p-3.5 bg-white rounded-lg border border-slate-200">
                <span class="text-[11px] font-semibold text-slate-500 block">Trigger Aktif</span>
                <strong id="trg-sim-name" class="font-mono text-[11px] leading-snug text-[#007A33] block mt-1 break-words">trg_update_ketersediaan_kamar</strong>
                <span id="trg-sim-event" class="text-[11px] text-slate-500 block mt-0.5">Event: AFTER INSERT</span>
              </div>
              <div class="p-3.5 bg-white rounded-lg border border-slate-200">
                <span class="text-[11px] font-semibold text-slate-500 block">Efek ke Tabel Kamar</span>
                <strong id="trg-sim-room" class="font-serif text-base text-[#0F1F17] block mt-1">Tersedia</strong>
                <span id="trg-sim-room-note" class="text-[11px] text-slate-500 block mt-0.5">Jadwal dikunci lewat tanggal, kamar fisik masih siap sebelum Check-In.</span>
              </div>
              <div class="p-3.5 bg-white rounded-lg border border-slate-200">
                <span class="text-[11px] font-semibold text-slate-500 block">Baris Baru log_audit_reservasi</span>
                <strong id="trg-sim-audit-transition" class="font-mono text-slate-900 block mt-1">Baru &rarr; Dikonfirmasi</strong>
                <span id="trg-sim-audit-desc" class="text-[11px] text-slate-500 block mt-0.5">Reservasi baru dibuat dengan status awal: Dikonfirmasi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- BAGIAN 04: VIEW MULTI-JOIN 6 TABEL -->
      <div id="bagian-multijoin" class="scroll-mt-24 pt-8 border-t border-slate-200 space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div class="lg:col-span-5 space-y-4">
            <span class="text-xs font-semibold uppercase tracking-wider text-[#007A33] block">Bagian 04 &middot; View Multi-Join 6 Tabel</span>
            <h3 class="text-2xl font-serif font-bold text-[#0F1F17]">
              Mengapa Menggabungkan INNER JOIN &amp; LEFT JOIN?
            </h3>
            <p class="text-sm text-slate-600 leading-relaxed">
              View <span class="font-mono">vw_laporan_reservasi_lengkap</span> bertindak sebagai tabel virtual yang menyatukan 6 tabel relasional sekaligus tanpa menyimpan salinan data ganda. Fitur <strong>Cek Booking</strong>, <strong>Kwitansi Resmi</strong>, dan <strong>Dashboard Admin</strong> membaca langsung dari View ini.
            </p>
          </div>

          <div class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="p-4 bg-[#F8FAFC] rounded-xl border border-slate-200 space-y-2">
              <div class="font-semibold text-[#007A33]">INNER JOIN (Relasi Wajib Ada)</div>
              <p class="text-slate-600 leading-relaxed">
                Menghubungkan <span class="font-mono text-[#0F1F17]">reservasi</span> dengan:
              </p>
              <ul class="space-y-1 text-slate-700 font-mono">
                <li>1. public.tamu (r.id_tamu = t.id_tamu)</li>
                <li>2. public.kamar (r.id_kamar = k.id_kamar)</li>
                <li>3. public.kategori_kamar (k.id_kategori = kk.id_kategori)</li>
              </ul>
              <p class="text-slate-500 pt-1">Setiap reservasi dijamin memiliki identitas tamu, unit kamar, dan kategori suite.</p>
            </div>

            <div class="p-4 bg-[#F8FAFC] rounded-xl border border-slate-200 space-y-2">
              <div class="font-semibold text-[#0F1F17]">LEFT JOIN + COALESCE (Relasi Opsional)</div>
              <p class="text-slate-600 leading-relaxed">
                Menghubungkan <span class="font-mono text-[#0F1F17]">reservasi</span> dengan:
              </p>
              <ul class="space-y-1 text-slate-700 font-mono">
                <li>4. public.pembayaran (r.id_reservasi = p.id_reservasi)</li>
                <li>5. public.voucher_promo (r.id_voucher = vp.id_voucher)</li>
              </ul>
              <p class="text-slate-500 pt-1">Jika tamu memesan tanpa promo (<span class="font-mono">NULL</span>), baris reservasi tetap tampil dengan nilai cadangan <span class="font-mono">COALESCE(..., '-')</span>.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- BAGIAN 05: SCALAR SUBQUERY, AGREGASI & 7 TABEL RELASIONAL -->
      <div id="bagian-subquery" class="scroll-mt-24 pt-8 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-5 space-y-4">
          <span class="text-xs font-semibold uppercase tracking-wider text-[#007A33] block">Bagian 05 &middot; Subquery &amp; Agregasi KPI</span>
          <h3 class="text-2xl font-serif font-bold text-[#0F1F17]">
            Scalar Subquery &amp; FILTER Clause
          </h3>
          <p class="text-sm text-slate-600 leading-relaxed">
            <strong>Scalar Subquery</strong> adalah query di dalam query yang menghasilkan tepat satu nilai tunggal. Di Dashboard Admin, sistem membandingkan <span class="font-mono">tarif_per_malam</span> setiap unit terhadap <span class="font-mono">(SELECT AVG(tarif_per_malam) FROM kamar)</span> untuk menyaring unit kelas premium secara dinamis.
          </p>
          <p class="text-sm text-slate-600 leading-relaxed">
            Untuk metrik KPI real-time, sistem juga memanfaatkan sintaks khas PostgreSQL <span class="font-mono">COUNT(*) FILTER (WHERE ...)</span> agar jumlah kamar Terisi, Tersedia, dan Pemeliharaan dihitung dalam satu kali pemindaian tabel.
          </p>
        </div>

        <div id="bagian-tabel" class="scroll-mt-24 lg:col-span-7 space-y-4">
          <span class="text-xs font-semibold uppercase tracking-wider text-[#007A33] block">Bagian 06 &middot; 7 Tabel &amp; Referential Integrity</span>
          <h3 class="text-2xl font-serif font-bold text-[#0F1F17]">
            Struktur Skema &amp; Aturan Foreign Key
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="p-3.5 bg-[#F8FAFC] rounded-lg border border-slate-200">
              <strong class="font-mono text-[#007A33]">1. kategori_kamar &amp; 2. kamar</strong>
              <p class="text-slate-600 mt-1">Relasi <span class="font-mono">1:N</span> dengan <span class="font-mono">ON DELETE RESTRICT</span> dan <span class="font-mono">CHECK (tarif_per_malam &gt; 0)</span>.</p>
            </div>
            <div class="p-3.5 bg-[#F8FAFC] rounded-lg border border-slate-200">
              <strong class="font-mono text-[#007A33]">3. tamu &amp; 4. voucher_promo</strong>
              <p class="text-slate-600 mt-1">Email tamu dan kode promo dijaga unik (<span class="font-mono">UNIQUE</span>) serta diskon dibatasi <span class="font-mono">BETWEEN 1 AND 100</span>.</p>
            </div>
            <div class="p-3.5 bg-[#F8FAFC] rounded-lg border border-slate-200">
              <strong class="font-mono text-[#007A33]">5. reservasi &amp; 6. pembayaran</strong>
              <p class="text-slate-600 mt-1">Pembayaran terikat <span class="font-mono">ON DELETE CASCADE</span>, sementara penghapusan kamar ditolak jika ada riwayat reservasi.</p>
            </div>
            <div class="p-3.5 bg-[#F8FAFC] rounded-lg border border-slate-200">
              <strong class="font-mono text-[#007A33]">7. log_audit_reservasi</strong>
              <p class="text-slate-600 mt-1">Tabel pencatatan kronologis permanen yang hanya diisi secara otomatis oleh Trigger PostgreSQL.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- BAGIAN 07: PENJELAJAH KODE SQL INTERAKTIF -->
      <div class="pt-4 space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span class="text-xs font-semibold uppercase tracking-wider text-[#007A33] block">Bagian 07 &middot; Cuplikan Kode SQL Langsung dari Skema Sistem</span>
            <h3 class="text-xl sm:text-2xl font-serif font-bold text-[#0F1F17]">Eksplorasi Implementasi PL/pgSQL</h3>
          </div>

          <div class="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg" role="tablist" aria-label="Pilih objek SQL untuk dilihat">
            ${snippetTabsHtml}
          </div>
        </div>

        <div class="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          ${snippetPanelsHtml}
        </div>
      </div>

    </div>
  </section>`;
}
