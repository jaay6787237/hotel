import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Room } from '../utils/booking';
import { RoomCard } from './RoomCard';
import { Sparkles, SlidersHorizontal, RotateCcw, Heart } from 'lucide-react';

interface RoomSectionProps {
  rooms: Room[];
  currency: 'IDR' | 'USD';
  checkIn: string;
  checkOut: string;
  discountPercentage: number;
  guestCount: number;
  favorites: string[];
  onToggleFavorite: (roomId: string) => void;
  onViewDetails: (room: Room) => void;
  onSelectRoom: (room: Room) => void;
}

type CategoryFilter = 'all' | 'suite' | 'villa' | 'executive' | 'family' | 'favorites';

export const RoomSection: React.FC<RoomSectionProps> = ({
  rooms,
  currency,
  checkIn,
  checkOut,
  discountPercentage,
  guestCount,
  favorites,
  onToggleFavorite,
  onViewDetails,
  onSelectRoom,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  const categories: { key: CategoryFilter; label: string; count?: number }[] = [
    { key: 'all', label: 'Semua Akomodasi' },
    { key: 'suite', label: 'Suite Panorama' },
    { key: 'villa', label: 'Villa Bukit' },
    { key: 'executive', label: 'Retreat Eksekutif' },
    { key: 'family', label: 'Residensi Keluarga' },
    { key: 'favorites', label: `Disimpan (${favorites.length})` },
  ];

  const filteredRooms = useMemo(() => {
    let result = rooms.filter((r) => {
      if (selectedCategory === 'favorites') {
        return favorites.includes(r.id);
      }
      const matchCategory = selectedCategory === 'all' || r.category === selectedCategory;
      const matchGuests = r.maxGuests >= guestCount;
      return matchCategory && matchGuests;
    });

    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.basePriceIdr - b.basePriceIdr);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.basePriceIdr - a.basePriceIdr);
    }

    return result;
  }, [rooms, selectedCategory, guestCount, sortBy, favorites]);

  return (
    <section id="suites" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#007A33] mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Sanctuary Puncak Bukit</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F1F17] tracking-tight">
          Suite, Paviliun & Villa Pribadi Bukit
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
          Dirancang dengan kayu jati nusantara, teras lapang, dan dinding kaca panorama untuk menghadirkan keasrian bukit dan cakrawala Teluk Lampung tepat di samping Anda.
        </p>
      </div>

      {/* Filter and Sort Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-4 border-b border-slate-200">
        {/* Animated Sliding Category Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`relative px-3.5 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                  isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeCategoryPill"
                    className="absolute inset-0 bg-[#007A33] rounded shadow-xs"
                    transition={{ type: 'spring', damping: 24, stiffness: 320 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {cat.key === 'favorites' && (
                    <Heart className={`w-3 h-3 ${isActive ? 'fill-white' : 'fill-slate-400'}`} />
                  )}
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sort Selector with Micro-Transition */}
        <div className="flex items-center gap-3 self-end md:self-auto text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Urutkan:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-700 font-medium text-xs focus:outline-hidden focus:border-[#007A33] transition-colors cursor-pointer"
          >
            <option value="featured">Pilihan Utama</option>
            <option value="price-asc">Tarif: Rendah ke Tinggi</option>
            <option value="price-desc">Tarif: Tinggi ke Rendah</option>
          </select>
        </div>
      </div>

      {/* Room Grid with AnimatePresence */}
      <AnimatePresence mode="wait">
        {filteredRooms.length > 0 ? (
          <motion.div
            key={selectedCategory + sortBy}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                currency={currency}
                checkIn={checkIn}
                checkOut={checkOut}
                discountPercentage={discountPercentage}
                isFavorite={favorites.includes(room.id)}
                onToggleFavorite={onToggleFavorite}
                onViewDetails={onViewDetails}
                onSelectRoom={onSelectRoom}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-lg border border-slate-200 p-8 max-w-lg mx-auto"
          >
            <p className="text-base font-semibold text-slate-800">
              {selectedCategory === 'favorites'
                ? 'Belum ada suite yang Anda simpan ke daftar favorit.'
                : `Tidak ada kamar yang sesuai dengan kriteria ${guestCount} tamu pada kategori ini.`}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {selectedCategory === 'favorites'
                ? 'Klik ikon hati pada kamar mana pun untuk menyimpannya di sini.'
                : 'Coba sesuaikan jumlah tamu atau pilih "Semua Akomodasi" untuk menjelajahi villa lainnya.'}
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
              }}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#007A33] border border-[#007A33] rounded hover:bg-[#007A33]/5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter Kategori</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
