import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';

interface FooterProps {
  onOpenSqlModal?: () => void;
  onOpenApiKeyModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSqlModal, onOpenApiKeyModal }) => {
  return (
    <footer className="bg-[#0F1F17] text-slate-300 pt-16 pb-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand & Editorial Heritage */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-2xl font-serif font-bold text-white tracking-tight">
              Bukit Randu
              <span className="text-xs font-sans font-medium uppercase tracking-widest text-[#D4AF37] ml-2">
                Hospitality
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
              Suaka puncak bukit terkemuka di Bandar Lampung. Memadukan ketinggian panorama 216 meter di atas permukaan laut dengan kehangatan keramahan khas Nusantara, seni kuliner autentik, dan ketenangan kolam renang infinity tepi tebing.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-medium pt-2">
              <span>Anggota Resmi Perhimpunan Hotel dan Restoran Indonesia (PHRI)</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Akomodasi & Kuliner
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="#suites" className="hover:text-white transition-colors">Royal Presidential Suite</a>
              </li>
              <li>
                <a href="#suites" className="hover:text-white transition-colors">Grand Horizon Hillside Villa</a>
              </li>
              <li>
                <a href="#suites" className="hover:text-white transition-colors">Deluxe Panoramic Sanctuary</a>
              </li>
              <li>
                <a href="#dining" className="hover:text-white transition-colors">Restoran Bukit Randu</a>
              </li>
              <li>
                <a href="#experiences" className="hover:text-white transition-colors">Apsara Hillside Spa</a>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Kontak & Pramutamu
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>Jl. Kamboja No. 1-2, Kebon Jeruk, Bandar Lampung 35121, Indonesia</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>+62 721 256811 / +62 811 792 568</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>reservation@bukitrandu.com</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Bukit Randu Hotel & Resort. Hak cipta dilindungi undang-undang.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-400">Kebijakan Privasi</a>
            <a href="#" className="hover:text-slate-400">Ketentuan Reservasi</a>
            <a href="#" className="hover:text-slate-400">Panduan Menginap</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
