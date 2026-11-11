import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Sparkles, Heart, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'favorite' | 'promo';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.92, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-slate-200 p-3.5 flex items-start gap-3"
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {toast.type === 'favorite' ? (
                <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Heart className="w-4 h-4 fill-rose-600" />
                </div>
              ) : toast.type === 'promo' ? (
                <div className="w-7 h-7 rounded-full bg-amber-50 text-[#D4AF37] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
              ) : toast.type === 'info' ? (
                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-50 text-[#007A33] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-semibold text-slate-900 leading-tight">
                {toast.title}
              </h5>
              {toast.description && (
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                  {toast.description}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors cursor-pointer"
              aria-label="Tutup notifikasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
