import React, { useState } from 'react';
import { Menu, X, Calendar, Globe, Database, KeyRound } from 'lucide-react';

interface NavbarProps {
  onBookNowClick: () => void;
  currency: 'IDR' | 'USD';
  onToggleCurrency: () => void;
  onOpenSqlModal: () => void;
  onOpenApiKeyModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onBookNowClick,
  currency,
  onToggleCurrency,
  onOpenSqlModal,
  onOpenApiKeyModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="/"
            className="flex items-baseline gap-2 text-2xl lg:text-3xl font-serif font-semibold tracking-tight text-[#0F1F17] hover:text-[#007A33] transition-colors whitespace-nowrap shrink-0"
          >
            Bukit Randu
            <span className="text-xs font-sans font-medium uppercase tracking-widest text-[#D4AF37] ml-1">
              Resort & Spa
            </span>
          </a>

          {/* Zone 2: 4–5 clean single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-8 text-[14px] font-medium text-slate-700">
            <button
              onClick={() => scrollToSection('suites')}
              className="hover:text-[#007A33] transition-colors whitespace-nowrap cursor-pointer"
            >
              Suite & Villa
            </button>
            <button
              onClick={() => scrollToSection('dining')}
              className="hover:text-[#007A33] transition-colors whitespace-nowrap cursor-pointer"
            >
              Restoran Bukit
            </button>
            <button
              onClick={() => scrollToSection('experiences')}
              className="hover:text-[#007A33] transition-colors whitespace-nowrap cursor-pointer"
            >
              Kebugaran & Spa
            </button>
            <button
              onClick={() => scrollToSection('reviews')}
              className="hover:text-[#007A33] transition-colors whitespace-nowrap cursor-pointer"
            >
              Ulasan Tamu
            </button>
            <button
              onClick={() => scrollToSection('location')}
              className="hover:text-[#007A33] transition-colors whitespace-nowrap cursor-pointer"
            >
              Lokasi & Kontak
            </button>
            <button
              onClick={onOpenSqlModal}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors whitespace-nowrap cursor-pointer"
              title="Lihat Arsitektur Basis Data: Trigger, SP, SF, Subquery, & Multi-Join"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Arsitektur SQL</span>
            </button>
            <button
              onClick={onOpenApiKeyModal}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 text-slate-800 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors whitespace-nowrap cursor-pointer"
              title="Keamanan Data: Manajemen Kunci API PostgreSQL (SHA-256)"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>Keamanan API</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action + currency switcher */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Currency switcher */}
            <button
              onClick={onToggleCurrency}
              aria-label={`Ubah mata uang, saat ini ${currency}`}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded text-slate-700 border border-slate-200 hover:border-[#007A33] transition-colors bg-white cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{currency}</span>
            </button>

            {/* Primary booking button */}
            <button
              onClick={onBookNowClick}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold tracking-wider uppercase text-white bg-[#007A33] hover:bg-[#005F27] rounded shadow-xs transition-colors whitespace-nowrap cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Pesan Kamar</span>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-[#007A33] focus:outline-hidden"
              aria-label="Buka menu navigasi"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation tray */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-4 pb-6 space-y-3 shadow-lg">
          <button
            onClick={() => scrollToSection('suites')}
            className="block w-full text-left py-2 text-base font-medium text-slate-800 hover:text-[#007A33]"
          >
            Suite & Villa
          </button>
          <button
            onClick={() => scrollToSection('dining')}
            className="block w-full text-left py-2 text-base font-medium text-slate-800 hover:text-[#007A33]"
          >
            Restoran Bukit
          </button>
          <button
            onClick={() => scrollToSection('experiences')}
            className="block w-full text-left py-2 text-base font-medium text-slate-800 hover:text-[#007A33]"
          >
            Kebugaran & Spa
          </button>
          <button
            onClick={() => scrollToSection('reviews')}
            className="block w-full text-left py-2 text-base font-medium text-slate-800 hover:text-[#007A33]"
          >
            Ulasan Tamu
          </button>
          <button
            onClick={() => scrollToSection('location')}
            className="block w-full text-left py-2 text-base font-medium text-slate-800 hover:text-[#007A33]"
          >
            Lokasi & Kontak
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenSqlModal();
            }}
            className="flex items-center gap-2 w-full text-left py-2 text-base font-medium text-emerald-800 hover:text-emerald-950"
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Arsitektur SQL & RDBMS</span>
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenApiKeyModal();
            }}
            className="flex items-center gap-2 w-full text-left py-2 text-base font-medium text-amber-800 hover:text-amber-950"
          >
            <KeyRound className="w-4 h-4 text-amber-600" />
            <span>Keamanan Data & API Key</span>
          </button>
          <div className="pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onBookNowClick();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold tracking-wider uppercase text-white bg-[#007A33] rounded hover:bg-[#005F27]"
            >
              <Calendar className="w-4 h-4" />
              <span>Pesan Kamar Sekarang</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
