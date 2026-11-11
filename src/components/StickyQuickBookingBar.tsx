import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Users, ArrowUp, CalendarCheck } from 'lucide-react';
import { BookingDates, calculateNights } from '../utils/booking';

interface StickyQuickBookingBarProps {
  dates: BookingDates;
  guestCount: number;
  onOpenBooking: () => void;
  onScrollToTop: () => void;
}

export const StickyQuickBookingBar: React.FC<StickyQuickBookingBarProps> = ({
  dates,
  guestCount,
  onOpenBooking,
  onScrollToTop,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled past 650px (past hero)
      if (window.scrollY > 650) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const nights = calculateNights(dates.checkIn, dates.checkOut);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-40 max-w-xl"
        >
          <div className="bg-[#0F1F17]/95 backdrop-blur-md text-white border border-white/20 rounded-full px-4 py-2.5 shadow-2xl flex items-center justify-between gap-4">
            {/* Stay info micro-details */}
            <div className="flex items-center gap-3 text-xs">
              <div className="hidden sm:flex items-center gap-1.5 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>
                  {dates.checkIn.split('-').slice(1).join('/')} - {dates.checkOut.split('-').slice(1).join('/')}
                </span>
                <span className="text-[#D4AF37] font-semibold">({nights} Malam)</span>
              </div>

              <div className="flex items-center gap-1 text-slate-300">
                <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{guestCount} Tamu</span>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={onOpenBooking}
                className="px-4 py-2 bg-[#007A33] hover:bg-[#005F27] text-white font-semibold text-xs uppercase tracking-wider rounded-full shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Pesan Kamar</span>
              </motion.button>

              <button
                onClick={onScrollToTop}
                aria-label="Kembali ke atas"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
