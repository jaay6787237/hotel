import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Check, Users, Maximize2, Bed, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import { Room, formatCurrency } from '../utils/booking';

interface RoomDetailModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onReserve: (room: Room) => void;
  currency: 'IDR' | 'USD';
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({
  room,
  isOpen,
  onClose,
  onReserve,
  currency,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !room) return null;

  const baseRate = currency === 'IDR' ? room.basePriceIdr : room.basePriceUsd;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-detail-title"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[#0F1F17]/65 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container — Responsive Luxury Split Layout */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 14 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="relative bg-white w-full max-w-4xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col md:flex-row my-auto max-h-[92vh] md:h-[min(640px,90vh)]"
      >
        {/* Left Visual Gallery Column (Compact on mobile, full-height editorial showcase on desktop) */}
        <div className="relative w-full md:w-[44%] h-48 sm:h-56 md:h-full bg-slate-900 overflow-hidden shrink-0">
          <img
            src={room.image}
            alt={room.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1F17]/90 via-[#0F1F17]/25 to-black/20" />

          {/* Mobile Close Button */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={onClose}
            className="md:hidden absolute top-3 right-3 z-20 p-2 bg-black/50 hover:bg-black/75 text-white rounded-full transition-colors cursor-pointer"
            aria-label="Tutup jendela rincian"
          >
            <X className="w-4 h-4" />
          </motion.button>

          {/* Top Left View Pill */}
          <div className="absolute top-4 left-4 right-14 md:right-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-[#D4AF37]/40 text-[11px] font-semibold uppercase tracking-wider text-[#F3E5AB]">
              <MapPin className="w-3 h-3 text-[#D4AF37]" />
              {room.view}
            </span>
          </div>

          {/* Bottom Editorial Caption on Image */}
          <div className="absolute bottom-4 left-5 right-5 text-white">
            {room.featured && (
              <span className="inline-block px-2.5 py-0.5 mb-2 text-[10px] font-bold uppercase tracking-widest bg-[#D4AF37] text-[#0F1F17] rounded-xs">
                Akomodasi Pilihan Resor
              </span>
            )}
            <h2
              id="room-detail-title"
              className="text-xl sm:text-2xl font-serif font-bold leading-snug text-white drop-shadow-xs"
            >
              {room.name}
            </h2>
            <p className="hidden md:block text-xs text-slate-200/90 mt-1.5 leading-relaxed">
              {room.tagline}
            </p>
          </div>
        </div>

        {/* Right Content & Booking Column */}
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          {/* Desktop Modal Top Bar */}
          <div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#F8FAFC] shrink-0">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#007A33] block">
                Rincian Akomodasi Puncak Bukit
              </span>
              <span className="text-xs text-slate-500">
                Bukit Randu Hotel &amp; Resort · Bandar Lampung
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-full transition-colors cursor-pointer"
              aria-label="Tutup jendela rincian"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Scrollable Details Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Key Metrics Strip */}
            <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-lg text-center">
              <div className="px-1">
                <span className="text-slate-500 uppercase text-[10px] block font-semibold tracking-wider">
                  Luas Hunian
                </span>
                <div className="flex items-center justify-center gap-1.5 mt-1 font-serif text-[#0F1F17] font-bold text-sm sm:text-base">
                  <Maximize2 className="w-3.5 h-3.5 text-[#007A33] shrink-0" />
                  <span>{room.sqm} m²</span>
                </div>
              </div>
              <div className="px-1 border-x border-slate-200">
                <span className="text-slate-500 uppercase text-[10px] block font-semibold tracking-wider">
                  Tempat Tidur
                </span>
                <div className="flex items-center justify-center gap-1.5 mt-1 font-serif text-[#0F1F17] font-bold text-xs sm:text-sm leading-tight">
                  <Bed className="w-3.5 h-3.5 text-[#007A33] shrink-0" />
                  <span>{room.bedType}</span>
                </div>
              </div>
              <div className="px-1">
                <span className="text-slate-500 uppercase text-[10px] block font-semibold tracking-wider">
                  Kapasitas
                </span>
                <div className="flex items-center justify-center gap-1.5 mt-1 font-serif text-[#0F1F17] font-bold text-sm sm:text-base">
                  <Users className="w-3.5 h-3.5 text-[#007A33] shrink-0" />
                  <span>{room.maxGuests} Tamu</span>
                </div>
              </div>
            </div>

            {/* Suite Description — Clear & Prominent */}
            <div className="space-y-1.5">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#007A33]">
                Pengalaman &amp; Deskripsi Suite
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {room.description}
              </p>
            </div>

            {/* Amenity Checklist */}
            <div className="space-y-2.5">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Fasilitas &amp; Keistimewaan Termasuk
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-800">
                {room.amenities.map((amenity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 px-3 py-2 bg-[#F8FAFC] rounded-md border border-slate-200/70"
                  >
                    <div className="w-4 h-4 rounded-full bg-[#007A33]/12 text-[#007A33] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="leading-snug">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resort Privileges Highlight */}
            <div className="p-3.5 bg-amber-50/70 border border-[#D4AF37]/35 rounded-lg flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
              <Sparkles className="w-4 h-4 text-[#B8921F] shrink-0 mt-0.5" />
              <span>
                Termasuk prioritas reservasi meja di <strong>Restoran Bukit Randu</strong> dan akses gratis ke <strong>Cliffside Horizon Infinity Pool</strong>.
              </span>
            </div>
          </div>

          {/* Sticky Modal Footer Action Bar */}
          <div className="p-4 sm:px-6 bg-[#F8FAFC] border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block">
                Tarif Terbaik Mulai Dari
              </span>
              <div className="flex items-baseline gap-1.5 flex-wrap sm:flex-nowrap">
                <span className="text-lg sm:text-xl font-serif font-bold text-[#0F1F17] tabular-nums whitespace-nowrap">
                  {formatCurrency(baseRate, currency)}
                </span>
                <span className="text-xs text-slate-500 whitespace-nowrap">/ malam</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="hidden sm:inline-flex px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap"
              >
                Tutup
              </button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  onClose();
                  onReserve(room);
                }}
                className="px-4 sm:px-5 py-2.5 bg-[#007A33] hover:bg-[#005F27] text-white text-xs font-semibold uppercase tracking-wider rounded-md shadow-xs flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                <span>Pesan Suite Ini</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
