import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Check,
  Calendar,
  ShieldCheck,
  Clock,
  Sparkles,
  Printer,
  ChevronRight,
  ArrowLeft,
  Coffee,
  Waves,
  Wifi,
  Car,
  Copy,
} from 'lucide-react';
import {
  Room,
  BookingDates,
  calculateRateBreakdown,
  formatCurrency,
  validateGuestDetails,
  generateBookingReference,
  GuestDetails,
} from '../utils/booking';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  dates: BookingDates;
  onDatesChange: (dates: BookingDates) => void;
  currency: 'IDR' | 'USD';
  initialPromoCode: string;
  onCopyToast?: (text: string) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  room,
  dates,
  onDatesChange,
  currency,
  initialPromoCode,
  onCopyToast,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [promoInput, setPromoInput] = useState(initialPromoCode);
  const [guestDetails, setGuestDetails] = useState<GuestDetails>({
    fullName: '',
    email: '',
    phone: '',
    specialRequests: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof GuestDetails, string>>>({});
  const [confirmedBookingRef, setConfirmedBookingRef] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  if (!isOpen || !room) return null;

  const breakdown = calculateRateBreakdown(room, dates, promoInput, currency);

  const handleNextToGuest = () => {
    setStep(2);
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateGuestDetails(guestDetails);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    const refCode = generateBookingReference();
    setConfirmedBookingRef(refCode);
    setStep(3);

    // Persist directly to Cloud SQL PostgreSQL via backend Express endpoint
    fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: refCode,
        roomId: room.id,
        promoCode: promoInput || undefined,
        guestName: guestDetails.fullName || 'Tamu Terhormat',
        guestEmail: guestDetails.email,
        guestPhone: guestDetails.phone,
        guestCity: 'Bandar Lampung',
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
        nights: breakdown.nights,
        guestCount: 2,
        specialRequests: guestDetails.specialRequests || undefined,
        subtotal: breakdown.subtotal.toString(),
        discount: breakdown.discountAmount.toString(),
        serviceFee: breakdown.serviceChargeAmount.toString(),
        tax: breakdown.taxAmount.toString(),
        total: breakdown.totalAmount.toString(),
        paymentMethod: 'Transfer Virtual Account (BCA/Mandiri)',
      }),
    }).catch((err) => console.error('Gagal sinkronisasi ke database Cloud SQL:', err));
  };

  const handleCopyBookingRef = (ref: string) => {
    navigator.clipboard?.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
    if (onCopyToast) {
      onCopyToast(`Kode booking ${ref} berhasil disalin ke clipboard!`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Soft Scrim Backdrop with 4px backdrop blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[#0F1F17]/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (step !== 3) onClose();
        }}
      />

      {/* Modal Dialog Card with Spring Entrance */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative bg-white w-full max-w-4xl rounded-lg shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col my-auto max-h-[92vh]"
      >
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
                aria-label="Kembali ke langkah sebelumnya"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#007A33]">
                {step === 1 && 'Langkah 1 dari 3: Rincian Reservasi'}
                {step === 2 && 'Langkah 2 dari 3: Data Tamu & Kontak'}
                {step === 3 && 'Reservasi Terkonfirmasi & Dijamin'}
              </span>
              <h3 className="text-lg font-serif font-bold text-[#0F1F17]">
                {step === 3 ? 'Voucher Konfirmasi Reservasi' : room.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
            aria-label="Tutup jendela reservasi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* STEP 1: REVIEW AND MODIFY CONFIGURATION */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Room Snapshot Header */}
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-[#F8FAFC] rounded-lg border border-slate-200">
                <img
                  src={room.image}
                  alt={room.name}
                  referrerPolicy="no-referrer"
                  className="w-full sm:w-36 h-24 object-cover rounded"
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D4AF37]">
                      {room.view}
                    </span>
                    <h4 className="font-serif font-bold text-slate-900 text-lg">{room.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{room.bedType} · {room.sqm} m² · Hingga {room.maxGuests} tamu</p>
                  </div>
                  <div className="text-xs text-[#007A33] font-medium flex items-center gap-1.5 mt-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Jaminan Tarif Terbaik dengan Fleksibilitas Reschedule</span>
                  </div>
                </div>
              </div>

              {/* Date & Stay Adjustments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 border border-slate-200 rounded bg-white hover:border-[#007A33] transition-colors">
                  <label htmlFor="modal-checkin-date" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    Tanggal Check-in
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#007A33]" />
                    <input
                      id="modal-checkin-date"
                      type="date"
                      value={dates.checkIn}
                      onChange={(e) => onDatesChange({ ...dates, checkIn: e.target.value })}
                      className="w-full font-medium text-slate-800 text-sm focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="p-3 border border-slate-200 rounded bg-white hover:border-[#007A33] transition-colors">
                  <label htmlFor="modal-checkout-date" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    Tanggal Check-out
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#007A33]" />
                    <input
                      id="modal-checkout-date"
                      type="date"
                      value={dates.checkOut}
                      min={dates.checkIn}
                      onChange={(e) => onDatesChange({ ...dates, checkOut: e.target.value })}
                      className="w-full font-medium text-slate-800 text-sm focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Promo Code Input Bar */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Kode Promo:</span>
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="cth. HILLTOP15"
                    className="px-3 py-1.5 text-xs uppercase bg-white border border-slate-300 rounded focus:border-[#007A33] focus:outline-hidden font-mono"
                  />
                </div>
                {breakdown.discountPercentage > 0 ? (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-xs font-semibold text-[#007A33] flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    Diskon {breakdown.discountPercentage}% Diterapkan ({breakdown.appliedPromo})
                  </motion.span>
                ) : (
                  <span className="text-xs text-slate-400">Gunakan kode HILLTOP15 untuk diskon 15% VIP</span>
                )}
              </div>

              {/* Rate Breakdown Table */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Rincian Tarif Terperinci ({breakdown.nights} Malam)
                </h4>
                <div className="border border-slate-200 rounded overflow-hidden text-sm">
                  <div className="flex items-center justify-between p-3 bg-[#FFFFFF] border-b border-slate-100">
                    <span className="text-slate-700">
                      Tarif Kamar ({breakdown.nights} Malam × {formatCurrency(breakdown.roomBaseRate, currency)})
                    </span>
                    <span className="font-medium text-slate-900 tabular-nums">
                      {formatCurrency(breakdown.subtotal, currency)}
                    </span>
                  </div>

                  {breakdown.discountAmount > 0 && (
                    <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border-b border-slate-100 text-[#007A33]">
                      <span>Diskon Keistimewaan VIP ({breakdown.discountPercentage}%)</span>
                      <span className="font-semibold tabular-nums">
                        -{formatCurrency(breakdown.discountAmount, currency)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-[#FFFFFF] border-b border-slate-100 text-slate-600">
                    <span>Pajak Pemerintah PPN (10%)</span>
                    <span className="tabular-nums">{formatCurrency(breakdown.taxAmount, currency)}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border-b border-slate-100 text-slate-600">
                    <span>Biaya Layanan Resor Bukit (5%)</span>
                    <span className="tabular-nums">
                      {formatCurrency(breakdown.serviceChargeAmount, currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-emerald-50/60 font-semibold text-[#0F1F17] text-base">
                    <span>Estimasi Total Pembayaran Saat Check-In</span>
                    <span className="text-xl font-serif font-bold text-[#007A33] tabular-nums">
                      {formatCurrency(breakdown.totalAmount, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Included Amenities Guarantee */}
              <div className="p-4 bg-amber-50/40 border border-[#D4AF37]/30 rounded-lg">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#735C00] block mb-2">
                  Fasilitas Gratis Termasuk Dalam Reservasi Ini:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Sarapan Prasmanan Harian</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Kolam Renang Infinity</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Wi-Fi Serat Optik Cepat</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Antar-Jemput Kawasan Bukit</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: GUEST DETAILS FORM */}
          {step === 2 && (
            <form id="guest-form" onSubmit={handleGuestSubmit} className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-[#007A33] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Konfirmasi Instan. Tidak memerlukan kartu kredit hari ini; pembayaran langsung saat tiba di meja resepsionis.</span>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1">
                  Nama Lengkap Tamu Utama *
                </label>
                <input
                  type="text"
                  value={guestDetails.fullName}
                  onChange={(e) => setGuestDetails({ ...guestDetails, fullName: e.target.value })}
                  placeholder="cth. Maulana Jaya"
                  className={`w-full px-4 py-2.5 text-sm border rounded focus:outline-hidden ${
                    errors.fullName ? 'border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-[#007A33]'
                  }`}
                />
                {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1">
                    Alamat Email (Untuk Pengiriman Voucher) *
                  </label>
                  <input
                    type="email"
                    value={guestDetails.email}
                    onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
                    placeholder="tamu@example.com"
                    className={`w-full px-4 py-2.5 text-sm border rounded focus:outline-hidden ${
                      errors.email ? 'border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-[#007A33]'
                    }`}
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1">
                    Nomor WhatsApp atau Ponsel Aktif *
                  </label>
                  <input
                    type="tel"
                    value={guestDetails.phone}
                    onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value })}
                    placeholder="+62 812-3456-7890"
                    className={`w-full px-4 py-2.5 text-sm border rounded focus:outline-hidden ${
                      errors.phone ? 'border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-[#007A33]'
                    }`}
                  />
                  {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1">
                  Permintaan Khusus atau Catatan Kedatangan (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={guestDetails.specialRequests}
                  onChange={(e) => setGuestDetails({ ...guestDetails, specialRequests: e.target.value })}
                  placeholder="cth. Penjemputan Bandara Radin Inten II, dekorasi ulang tahun romantis, lantai tinggi..."
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded focus:border-[#007A33] focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Waktu Standar Check-in: 14:00 · Check-out: 12:00 siang</span>
                </div>
                <span className="text-[#007A33] font-semibold">Gratis pembatalan hingga 48 jam sebelum jadwal</span>
              </div>
            </form>
          )}

          {/* STEP 3: CONFIRMATION VOUCHER */}
          {step === 3 && confirmedBookingRef && (
            <div id="printable-voucher" className="space-y-6 text-center sm:text-left">
              <div className="p-6 bg-emerald-50/70 border border-[#007A33]/30 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#007A33] rounded-full flex items-center justify-center text-white shrink-0 shadow-md">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#007A33]">
                      Reservasi Terkonfirmasi
                    </span>
                    <h4 className="text-2xl font-serif font-bold text-slate-900">
                      Kami Menyambut Kedatangan Anda
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Surat konfirmasi dan panduan kedatangan telah dikirimkan ke {guestDetails.email}
                    </p>
                  </div>
                </div>

                <div className="text-center sm:text-right bg-white px-4 py-2.5 rounded border border-slate-200 shadow-xs flex items-center gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Kode Booking
                    </span>
                    <span className="font-mono font-bold text-lg text-[#007A33]">
                      {confirmedBookingRef}
                    </span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleCopyBookingRef(confirmedBookingRef)}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Salin kode booking"
                  >
                    {copiedRef ? <Check className="w-4 h-4 text-[#007A33]" /> : <Copy className="w-4 h-4" />}
                  </motion.button>
                </div>
              </div>

              {/* Schedule Summary Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-200 rounded-lg p-4 bg-white text-xs">
                <div>
                  <span className="font-semibold text-slate-400 uppercase text-[10px] block">Akomodasi Dipesan</span>
                  <span className="font-serif font-bold text-slate-900 text-sm block mt-1">{room.name}</span>
                  <span className="text-slate-500">{room.bedType}</span>
                </div>

                <div>
                  <span className="font-semibold text-slate-400 uppercase text-[10px] block">Tanggal & Durasi</span>
                  <span className="font-medium text-slate-900 text-sm block mt-1">
                    {dates.checkIn} s/d {dates.checkOut}
                  </span>
                  <span className="text-[#007A33] font-medium">{breakdown.nights} Malam</span>
                </div>

                <div>
                  <span className="font-semibold text-slate-400 uppercase text-[10px] block">Tamu Utama</span>
                  <span className="font-medium text-slate-900 text-sm block mt-1">{guestDetails.fullName}</span>
                  <span className="text-slate-500">{guestDetails.phone}</span>
                </div>
              </div>

              {/* Final Amount Statement */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Total Pembayaran Saat Check-In (Termasuk Semua Pajak & Layanan)</span>
                  <span className="text-xs text-slate-400">Menerima Tunai, Debit, Kartu Kredit Visa/Mastercard, dan QRIS di Meja Resepsionis</span>
                </div>
                <span className="text-2xl font-serif font-bold text-[#007A33] tabular-nums">
                  {formatCurrency(breakdown.totalAmount, currency)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-slate-200 flex items-center justify-between">
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={handleNextToGuest}
                className="px-6 py-2.5 bg-[#007A33] hover:bg-[#005F27] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
              >
                <span>Lanjut ke Data Tamu</span>
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Kembali ke Tarif
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                form="guest-form"
                className="px-6 py-2.5 bg-[#007A33] hover:bg-[#005F27] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
              >
                <span>Konfirmasi & Kunci Reservasi</span>
                <Check className="w-4 h-4" />
              </motion.button>
            </>
          )}

          {step === 3 && (
            <>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 text-xs font-semibold text-[#007A33] border border-[#007A33] rounded hover:bg-[#007A33]/5 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Voucher</span>
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-[#007A33] hover:bg-[#005F27] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-xs cursor-pointer transition-colors"
              >
                Selesai
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
