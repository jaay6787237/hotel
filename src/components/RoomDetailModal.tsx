import React from 'react';
import { motion } from 'motion/react';
import { X, Check, Users, Maximize2, Bed, ArrowRight, Sparkles } from 'lucide-react';
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
  if (!isOpen || !room) return null;

  const baseRate = currency === 'IDR' ? room.basePriceIdr : room.basePriceUsd;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[#0F1F17]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative bg-white w-full max-w-3xl rounded-lg shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col my-auto max-h-[90vh]"
      >
        {/* Header Close Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors cursor-pointer"
          aria-label="Tutup jendela rincian"
        >
          <X className="w-5 h-5" />
        </motion.button>

        {/* Big Photography Header */}
        <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden shrink-0">
          <img
            src={room.image}
            alt={room.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] block mb-1">
              {room.view}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold leading-tight">
              {room.name}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Room Metrics Strip */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-[#F8FAFC] border border-slate-200 rounded-lg text-center text-xs">
            <div className="p-1 rounded hover:bg-white transition-colors">
              <span className="text-slate-500 uppercase text-[10px] block font-semibold">Luas Hunian</span>
              <div className="flex items-center justify-center gap-1.5 mt-1 font-serif text-slate-900 font-bold text-base">
                <Maximize2 className="w-4 h-4 text-[#007A33]" />
                <span>{room.sqm} m²</span>
              </div>
            </div>
            <div className="p-1 rounded hover:bg-white transition-colors">
              <span className="text-slate-500 uppercase text-[10px] block font-semibold">Tempat Tidur</span>
              <div className="flex items-center justify-center gap-1.5 mt-1 font-serif text-slate-900 font-bold text-base">
                <Bed className="w-4 h-4 text-[#007A33]" />
                <span>{room.bedType}</span>
              </div>
            </div>
            <div className="p-1 rounded hover:bg-white transition-colors">
              <span className="text-slate-500 uppercase text-[10px] block font-semibold">Kapasitas</span>
              <div className="flex items-center justify-center gap-1.5 mt-1 font-serif text-slate-900 font-bold text-base">
                <Users className="w-4 h-4 text-[#007A33]" />
                <span>{room.maxGuests} Tamu</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Pengalaman & Keanggunan Suaka
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              {room.description}
            </p>
          </div>

          {/* Amenity Checklist */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Fasilitas & Keistimewaan Suite
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-800">
              {room.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-[#F8FAFC] rounded border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="w-4 h-4 rounded-full bg-[#007A33]/10 text-[#007A33] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Peace of mind highlight */}
          <div className="p-3 bg-amber-50/50 border border-[#D4AF37]/30 rounded flex items-center gap-2.5 text-xs text-slate-700">
            <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>Termasuk prioritas meja di Restoran Bukit Randu dan akses gratis ke Cliffside Horizon Infinity Pool.</span>
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="p-4 sm:px-6 bg-[#F8FAFC] border-t border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Mulai Dari</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#0F1F17] tabular-nums">
                {formatCurrency(baseRate, currency)}
              </span>
              <span className="text-xs text-slate-500">/ malam</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                onClose();
                onReserve(room);
              }}
              className="px-6 py-2.5 bg-[#007A33] hover:bg-[#005F27] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span>Pesan Suite Ini</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
