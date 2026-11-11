import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowDown, CloudSun, Wind, Thermometer } from 'lucide-react';

interface HeroProps {
  onExploreSuites: () => void;
  onCheckDates: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreSuites, onCheckDates }) => {
  const [showWeatherTooltip, setShowWeatherTooltip] = useState(false);

  return (
    <section className="relative min-h-[620px] lg:min-h-[720px] flex items-center justify-center overflow-hidden bg-[#0F1F17]">
      {/* Background Image with Measured Contrast Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/bukit_randu_hero_1794410439341.jpg"
          alt="Resor Bukit Randu dengan pemandangan panorama Teluk Bandar Lampung"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
        />
        {/* Cinematic gradient overlays for crystal clear text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1F17] via-[#0F1F17]/50 to-[#0F1F17]/30" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Hero Content Box */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center">
        {/* Overline Badge & Live Hill Atmosphere Micro-Interaction */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[#D4AF37] text-xs font-semibold uppercase tracking-[0.08em]">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Destinasi Ikonik Puncak Bukit Bandar Lampung</span>
          </div>

          {/* Interactive Live Hill Climate Badge */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowWeatherTooltip(!showWeatherTooltip)}
              onMouseEnter={() => setShowWeatherTooltip(true)}
              onMouseLeave={() => setShowWeatherTooltip(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
            >
              <CloudSun className="w-3.5 h-3.5 text-amber-300" />
              <span>24°C Sejuk</span>
              <span className="text-white/40">·</span>
              <Wind className="w-3.5 h-3.5 text-emerald-300" />
              <span>Angin Lembah 11 km/j</span>
            </motion.button>

            {/* Micro-Tooltip */}
            <AnimatePresence>
              {showWeatherTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white text-slate-800 rounded-lg shadow-xl text-left text-xs border border-slate-200 pointer-events-none z-30"
                >
                  <div className="flex items-center gap-1.5 font-semibold text-[#007A33] mb-1">
                    <Thermometer className="w-3.5 h-3.5" />
                    <span>Mikroklimat Puncak Bukit</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Ketinggian 216m menghasilkan suhu udara lebih sejuk 3-4°C dibandingkan kawasan pesisir bawah Bandar Lampung.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Major Headline in Playfair Display */}
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-[1.15] mb-6"
          style={{ textWrap: 'balance' }}
        >
          Kemewahan Tenang di Atas Panorama Teluk Lampung
        </h1>

        {/* Editorial Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-200 font-normal leading-relaxed mb-10">
          Nikmati ketenangan di ketinggian perbukitan. Rasakan kehangatan keramahan khas Nusantara, kolam renang tanpa batas tepi tebing, dan santap malam romantis 216 meter di atas gemerlap kota.
        </p>

        {/* Primary & Secondary Action CTAs with Micro-Interaction */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={onCheckDates}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#007A33] hover:bg-[#005F27] text-white font-semibold text-xs tracking-wider uppercase rounded shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            Cek Ketersediaan Kamar
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={onExploreSuites}
            className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-[#D4AF37] font-semibold text-xs tracking-wider uppercase rounded backdrop-blur-xs transition-all cursor-pointer"
          >
            Jelajahi Suite & Villa
          </motion.button>
        </div>

        {/* Proof of Distinction Strips */}
        <div className="mt-14 pt-8 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-12 w-full text-slate-200">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-white font-serif text-2xl font-bold">
              <span>216 m</span>
            </div>
            <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold mt-1">
              Di Atas Permukaan Laut
            </span>
            <span className="text-xs text-slate-300 mt-0.5">Hembusan angin bukit nan sejuk</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-white font-serif text-2xl font-bold">
              <span>360°</span>
            </div>
            <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold mt-1">
              Panorama Alami
            </span>
            <span className="text-xs text-slate-300 mt-0.5">Lembah hijau & garis laut Teluk Lampung</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-white font-serif text-2xl font-bold">
              <span>4.9 / 5.0</span>
            </div>
            <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold mt-1">
              Kepuasan Tamu
            </span>
            <span className="text-xs text-slate-300 mt-0.5">Lebih dari 2.400 ulasan terverifikasi</span>
          </div>
        </div>
      </div>

      {/* Gentle Scroll Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 animate-bounce hidden md:block">
        <ArrowDown className="w-5 h-5" />
      </div>
    </section>
  );
};
