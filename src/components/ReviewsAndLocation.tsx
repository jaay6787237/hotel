import React, { useState } from 'react';
import { REVIEWS_DATA } from '../data/resortData';
import { Star, MapPin, Phone, Mail, CheckCircle2, ShieldCheck, Send } from 'lucide-react';

export const ReviewsAndLocation: React.FC = () => {
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySent, setInquirySent] = useState(false);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inquiryName && inquiryEmail) {
      setInquirySent(true);
    }
  };

  return (
    <>
      {/* GUEST REVIEWS SECTION */}
      <section id="reviews" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#007A33] mb-3">
            <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
            <span>Ulasan Kehormatan Tamu</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F1F17] tracking-tight">
            Dicintai oleh Wisatawan Nusantara & Mancanegara
          </h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Temukan alasan para pemimpin bisnis, pasangan, dan keluarga memilih Bukit Randu sebagai suaka liburan penuh ketenteraman di Lampung.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {REVIEWS_DATA.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* 5 Gold Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                  ))}
                  <span className="text-xs font-semibold text-slate-700 ml-2">5.0 / 5.0</span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                  "{rev.comment}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-semibold text-slate-900">{rev.guestName}</h4>
                  <span className="text-slate-500">{rev.residenceCity}</span>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 text-[11px] font-medium text-[#007A33]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Kunjungan Terverifikasi</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">{rev.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LOCATION & HILLTOP CONCIERGE SECTION */}
      <section id="location" className="py-20 bg-[#F8FAFC] border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Location & Transport Map Highlights */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#007A33] block mb-2">
                  Lokasi Puncak Bukit yang Menenangkan
                </span>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F1F17] tracking-tight">
                  Berada di Ketinggian Bandar Lampung
                </h2>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                  Terletak di kawasan Kebon Jeruk hanya beberapa menit dari pusat kota Tanjung Karang. Bukit Randu berada di puncak perbukitan, memadukan ketenangan alami dengan aksesibilitas cepat menuju pusat bisnis dan pantai.
                </p>
              </div>

              {/* Address Card */}
              <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#007A33] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700">
                  <strong className="text-sm font-serif font-bold text-slate-900 block">
                    Bukit Randu Hotel & Resort
                  </strong>
                  <span>Jl. Kamboja No. 1-2, Kebon Jeruk, Kec. Tanjung Karang Timur, Kota Bandar Lampung, Lampung 35121, Indonesia</span>
                </div>
              </div>

              {/* Transit Distances */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">Bandara (TKG)</span>
                  <span className="text-base font-serif font-bold text-[#007A33]">35 Menit</span>
                  <span className="text-[10px] text-slate-400 block">Antar-Jemput Tersedia</span>
                </div>

                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">Stasiun Kereta</span>
                  <span className="text-base font-serif font-bold text-[#007A33]">8 Menit</span>
                  <span className="text-[10px] text-slate-400 block">Tanjung Karang</span>
                </div>

                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">Teluk Lampung</span>
                  <span className="text-base font-serif font-bold text-[#007A33]">15 Menit</span>
                  <span className="text-[10px] text-slate-400 block">Kawasan Teluk Betung</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#007A33]" />
                  <span>+62 721 256811 / +62 811 792 568</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#007A33]" />
                  <span>reservation@bukitrandu.com</span>
                </div>
              </div>
            </div>

            {/* Right: Concierge Inquiry Box */}
            <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-lg">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] block mb-1">
                Layanan Pramutamu Resor
              </span>
              <h3 className="text-2xl font-serif font-bold text-[#0F1F17] mb-2">
                Ada Pertanyaan atau Permintaan Khusus?
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Tim resepsionis dan pramutamu kami siap melayani Anda 24 jam setiap hari untuk bantuan penjemputan bandara, paket jamuan, maupun reservasi khusus.
              </p>

              {!inquirySent ? (
                <form onSubmit={handleInquirySubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold uppercase tracking-wider text-slate-700 block mb-1">
                      Nama Lengkap Anda
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="cth. Budi Santoso"
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:border-[#007A33] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-semibold uppercase tracking-wider text-slate-700 block mb-1">
                      Email atau Nomor WhatsApp
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="cth. budi@example.com / 0812..."
                      value={inquiryEmail}
                      onChange={(e) => setInquiryEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:border-[#007A33] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-semibold uppercase tracking-wider text-slate-700 block mb-1">
                      Pesan atau Pertanyaan Anda
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Tanyakan mengenai ketersediaan kamar, paket romantis, atau shuttle bandara..."
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:border-[#007A33] focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#007A33] hover:bg-[#005F27] text-white font-semibold uppercase tracking-wider rounded flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Pesan ke Pramutamu</span>
                  </button>
                </form>
              ) : (
                <div className="p-6 bg-emerald-50 text-center rounded-lg space-y-3">
                  <ShieldCheck className="w-8 h-8 text-[#007A33] mx-auto" />
                  <h4 className="font-serif font-bold text-slate-900 text-lg">Pesan Berhasil Terkirim</h4>
                  <p className="text-xs text-slate-600">
                    Terima kasih Bapak/Ibu {inquiryName}. Tim layanan tamu Bukit Randu akan segera menghubungi Anda melalui {inquiryEmail}.
                  </p>
                  <button
                    onClick={() => setInquirySent(false)}
                    className="text-xs text-[#007A33] font-semibold underline hover:text-[#005F27]"
                  >
                    Kirim pesan lainnya
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>
    </>
  );
};
