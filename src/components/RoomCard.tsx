import React from 'react';
import { motion } from 'motion/react';
import { Users, Maximize2, Bed, Eye, ArrowRight, Check, Heart } from 'lucide-react';
import { Room, formatCurrency, calculateNights } from '../utils/booking';

interface RoomCardProps {
  room: Room;
  currency: 'IDR' | 'USD';
  checkIn: string;
  checkOut: string;
  discountPercentage: number;
  isFavorite: boolean;
  onToggleFavorite: (roomId: string) => void;
  onViewDetails: (room: Room) => void;
  onSelectRoom: (room: Room) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  currency,
  checkIn,
  checkOut,
  discountPercentage,
  isFavorite,
  onToggleFavorite,
  onViewDetails,
  onSelectRoom,
}) => {
  const nights = calculateNights(checkIn, checkOut);
  const baseRate = currency === 'IDR' ? room.basePriceIdr : room.basePriceUsd;
  
  const discountedRate = discountPercentage > 0 
    ? Math.round(baseRate * (1 - discountPercentage / 100))
    : baseRate;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', damping: 20, stiffness: 250 }}
      className="group bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-[#D4AF37]/60 transition-colors duration-300 flex flex-col justify-between"
    >
      {/* 16:10 Photography Header */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={room.image}
          alt={room.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        {/* Top Badges & Wishlist Heart Button */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5 pointer-events-none">
            <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-white/95 text-[#007A33] border border-[#007A33]/20 rounded-full shadow-xs">
              {room.view}
            </span>
            {room.featured && (
              <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-[#D4AF37] text-white rounded-full shadow-xs">
                Suite Pilihan
              </span>
            )}
          </div>

          {/* Interactive Wishlist Heart Button */}
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(room.id);
            }}
            aria-label={isFavorite ? 'Hapus dari favorit' : 'Simpan ke favorit'}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xs flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'
              }`}
            />
          </motion.button>
        </div>

        {/* Bottom Key Specs Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-4 text-xs text-white/95 font-medium">
          <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
            <Maximize2 className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{room.sqm} m²</span>
          </div>
          <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
            <Bed className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{room.bedType}</span>
          </div>
          <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
            <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Hingga {room.maxGuests} Tamu</span>
          </div>
        </div>
      </div>

      {/* Room Details & Copy */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xl sm:text-2xl font-serif font-semibold text-[#0F1F17] group-hover:text-[#007A33] transition-colors leading-snug">
            {room.name}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
            {room.tagline}
          </p>

          {/* Key Inclusions */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
            {room.amenities.slice(0, 3).map((amenity, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span>{amenity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing & CTA Controls */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Tarif per Malam
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              {discountPercentage > 0 && (
                <span className="text-xs text-slate-600 line-through tabular-nums">
                  {formatCurrency(baseRate, currency)}
                </span>
              )}
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#0F1F17] tabular-nums">
                {formatCurrency(discountedRate, currency)}
              </span>
              <span className="text-xs text-slate-600">/ malam</span>
            </div>
            {nights > 1 && (
              <span className="text-[11px] text-slate-600 block mt-0.5 tabular-nums">
                Total untuk {nights} malam: {formatCurrency(discountedRate * nights, currency)}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onViewDetails(room)}
              className="px-3.5 py-2.5 text-xs font-semibold text-[#007A33] border border-[#D4AF37] hover:bg-[#D4AF37]/10 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Detail</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelectRoom(room)}
              className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-[#007A33] hover:bg-[#005F27] rounded shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <span>Pesan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
