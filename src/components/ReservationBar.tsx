import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Users, Tag, Search, Check, Sparkles, Copy } from 'lucide-react';
import { BookingDates, getPromoDiscountPercentage } from '../utils/booking';

interface ReservationBarProps {
  dates: BookingDates;
  onDatesChange: (dates: BookingDates) => void;
  guestCount: number;
  onGuestCountChange: (count: number) => void;
  promoCode: string;
  onPromoCodeChange: (code: string) => void;
  onSearch: () => void;
  onPromoAppliedToast?: (code: string, discount: number) => void;
}

export const ReservationBar: React.FC<ReservationBarProps> = ({
  dates,
  onDatesChange,
  guestCount,
  onGuestCountChange,
  promoCode,
  onPromoCodeChange,
  onSearch,
  onPromoAppliedToast,
}) => {
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const discountPercentage = getPromoDiscountPercentage(promoCode);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return { day: '18', monthYear: 'Nov 2026', weekday: 'Rabu' };
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const monthYear = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    const weekday = date.toLocaleDateString('id-ID', { weekday: 'long' });
    return { day, monthYear, weekday };
  };

  const checkInDisplay = formatDisplayDate(dates.checkIn);
  const checkOutDisplay = formatDisplayDate(dates.checkOut);

  const handleApplyQuickPromo = (code: string) => {
    setShowPromoInput(true);
    onPromoCodeChange(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    const discount = getPromoDiscountPercentage(code);
    if (onPromoAppliedToast) {
      onPromoAppliedToast(code, discount);
    }
  };

  return (
    <div id="reservation-bar" className="relative z-20 -mt-10 sm:-mt-14 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-2 sm:p-3 transition-shadow hover:shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-2 sm:gap-3 items-stretch">
          
          {/* Check-In Date Module */}
          <div className="lg:col-span-3 bg-[#F8FAFC] hover:bg-[#F2F4F6] border border-slate-200/80 rounded p-3 transition-colors flex flex-col justify-between relative group">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <label htmlFor="check-in-input" className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Tanggal Check-In
              </label>
              <Calendar className="w-3.5 h-3.5 text-[#007A33]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-serif font-bold text-[#0F1F17]">
                {checkInDisplay.day}
              </span>
              <div className="flex flex-col text-xs text-slate-600">
                <span className="font-medium text-slate-900 capitalize">{checkInDisplay.monthYear}</span>
                <span className="text-slate-500 capitalize">{checkInDisplay.weekday}</span>
              </div>
            </div>
            <input
              id="check-in-input"
              type="date"
              value={dates.checkIn}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                const newCheckIn = e.target.value;
                if (newCheckIn >= dates.checkOut) {
                  const nextDay = new Date(newCheckIn);
                  nextDay.setDate(nextDay.getDate() + 1);
                  onDatesChange({
                    checkIn: newCheckIn,
                    checkOut: nextDay.toISOString().split('T')[0],
                  });
                } else {
                  onDatesChange({ ...dates, checkIn: newCheckIn });
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>

          {/* Check-Out Date Module */}
          <div className="lg:col-span-3 bg-[#F8FAFC] hover:bg-[#F2F4F6] border border-slate-200/80 rounded p-3 transition-colors flex flex-col justify-between relative group">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <label htmlFor="check-out-input" className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Tanggal Check-Out
              </label>
              <Calendar className="w-3.5 h-3.5 text-[#007A33]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-serif font-bold text-[#0F1F17]">
                {checkOutDisplay.day}
              </span>
              <div className="flex flex-col text-xs text-slate-600">
                <span className="font-medium text-slate-900 capitalize">{checkOutDisplay.monthYear}</span>
                <span className="text-slate-500 capitalize">{checkOutDisplay.weekday}</span>
              </div>
            </div>
            <input
              id="check-out-input"
              type="date"
              value={dates.checkOut}
              min={dates.checkIn}
              onChange={(e) => onDatesChange({ ...dates, checkOut: e.target.value })}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>

          {/* Guests & Room Occupancy Module */}
          <div className="lg:col-span-3 bg-[#F8FAFC] border border-slate-200/80 rounded p-3 flex flex-col justify-between relative">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Tamu & Kamar
              </span>
              <Users className="w-3.5 h-3.5 text-[#007A33]" />
            </div>

            <button
              type="button"
              onClick={() => setShowGuestDropdown(!showGuestDropdown)}
              className="text-left flex items-baseline gap-2 w-full cursor-pointer focus:outline-hidden"
              aria-label="Pilih jumlah tamu"
            >
              <span className="text-3xl font-serif font-bold text-[#0F1F17] tabular-nums">
                {guestCount.toString().padStart(2, '0')}
              </span>
              <div className="flex flex-col text-xs text-slate-600">
                <span className="font-medium text-slate-900">{guestCount} Tamu</span>
                <span className="text-slate-500">1 Kamar / Villa</span>
              </div>
            </button>

            {/* Stepper Popover with AnimatePresence */}
            <AnimatePresence>
              {showGuestDropdown && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-slate-200 p-4 z-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-semibold text-slate-900 block">Total Tamu</span>
                      <span className="text-xs text-slate-500">Dewasa & Anak-anak</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (guestCount > 1) onGuestCountChange(guestCount - 1);
                        }}
                        className="w-8 h-8 rounded border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                        disabled={guestCount <= 1}
                        aria-label="Kurangi jumlah tamu"
                      >
                        -
                      </motion.button>
                      <motion.span
                        key={guestCount}
                        initial={{ scale: 1.2, color: '#007A33' }}
                        animate={{ scale: 1, color: '#0F1F17' }}
                        className="font-serif font-bold text-lg w-6 text-center tabular-nums"
                      >
                        {guestCount}
                      </motion.span>
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (guestCount < 8) onGuestCountChange(guestCount + 1);
                        }}
                        className="w-8 h-8 rounded border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                        disabled={guestCount >= 8}
                        aria-label="Tambah jumlah tamu"
                      >
                        +
                      </motion.button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowGuestDropdown(false)}
                      className="text-xs font-semibold uppercase tracking-wider text-[#007A33] hover:underline cursor-pointer"
                    >
                      Selesai
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action / Search Button Module with Micro-Interaction */}
          <div className="lg:col-span-3 flex flex-col justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onSearch}
              className="w-full h-full min-h-[56px] bg-[#007A33] hover:bg-[#005F27] text-white font-semibold text-xs tracking-wider uppercase rounded shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 px-4 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Cek Ketersediaan</span>
            </motion.button>
          </div>
        </div>

        {/* Promo Code Drawer & Quick Suggestion Bar */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs px-1 gap-2">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-slate-600 font-medium">Punya kode promo eksklusif?</span>
            {!showPromoInput ? (
              <button
                type="button"
                onClick={() => setShowPromoInput(true)}
                className="text-[#007A33] font-semibold hover:underline cursor-pointer"
              >
                Masukkan Kode Promo
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="cth. HILLTOP15"
                  value={promoCode}
                  onChange={(e) => onPromoCodeChange(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-[#007A33] uppercase"
                />
                {discountPercentage > 0 && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-flex items-center gap-1 text-[#007A33] font-semibold"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Diskon {discountPercentage}% Diterapkan!
                  </motion.span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
            <span>Coba kode istimewa:</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => handleApplyQuickPromo('HILLTOP15')}
              className="inline-flex items-center gap-1 font-mono font-semibold text-[#007A33] bg-[#007A33]/10 px-2 py-0.5 rounded text-[11px] hover:bg-[#007A33]/20 cursor-pointer"
            >
              {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>HILLTOP15</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};
