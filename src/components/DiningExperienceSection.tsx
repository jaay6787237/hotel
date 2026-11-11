import React, { useState } from 'react';
import { EXPERIENCES_DATA, Experience } from '../data/resortData';
import { Utensils, Clock, Sparkles, Check, ArrowRight, X } from 'lucide-react';

export const DiningExperienceSection: React.FC = () => {
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    name: '',
    guests: '2',
    date: '2026-11-20',
    time: '18:30',
    notes: 'Meja teras panorama sunset diutamakan',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleOpenReserve = (exp: Experience) => {
    setSelectedExperience(exp);
    setSubmitted(false);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="dining" className="py-20 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#007A33] mb-3">
            <Utensils className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Seni Kuliner Puncak & Kebugaran Alami</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F1F17] tracking-tight">
            Restoran Bukit Randu & Kebugaran Pegunungan
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Berada 216 meter di atas pantai, setiap hidangan di Restoran Bukit Randu dan setiap momen di kolam infinity menawarkan pemandangan spektakuler di atas gemerlap Teluk Lampung.
          </p>
        </div>

        {/* Featured Big Showcase: Restoran Bukit Randu */}
        <div className="mb-14 rounded-xl border border-slate-200 bg-[#F8FAFC] overflow-hidden shadow-xs hover:shadow-lg transition-shadow">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 relative min-h-[340px] lg:min-h-[460px]">
              <img
                src="/assets/images/dining_hilltop_1794410440842.jpg"
                alt="Teras Makan Malam Romantis Restoran Bukit Randu saat senja"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-black/60 backdrop-blur-md text-[#D4AF37] border border-[#D4AF37]/30 rounded-full">
                  Teras Puncak Ikonik
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 lg:p-10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] block mb-1">
                  Seni Gastronomi Nusantara & Barat
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#0F1F17] leading-tight">
                  Restoran Bukit Randu
                </h3>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                  Rayakan malam istimewa Anda di restoran puncak bukit terkemuka di Lampung. Nikmati hidangan autentik Seruit khas Lampung, olahan hidangan laut pesisir segar, serta Australian Wagyu Ribeye di bawah hamparan bintang saat kota Bandar Lampung mulai berpendar keemasan.
                </p>

                <div className="mt-6 space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#007A33]" />
                    <span>Buka Setiap Hari: 06:00 - 23:00 (Sarapan, Makan Siang & Makan Malam Senja)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span>Live Acoustic Jazz setiap Jumat & Sabtu malam</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                    Reservasi Meja
                  </span>
                  <span className="text-xs font-medium text-slate-800">
                    Prioritas reservasi meja bagi tamu menginap
                  </span>
                </div>
                <button
                  onClick={() => handleOpenReserve(EXPERIENCES_DATA[0])}
                  className="px-5 py-2.5 bg-[#007A33] hover:bg-[#005F27] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>Pesan Meja</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Experiences: Horizon Pool & Spa */}
        <div id="experiences" className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {EXPERIENCES_DATA.slice(1).map((exp) => (
            <div
              key={exp.id}
              className="group bg-[#F8FAFC] rounded-lg border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                <img
                  src={exp.image}
                  alt={exp.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <span className="text-xs uppercase font-semibold text-[#D4AF37] tracking-wider block">
                    {exp.subtitle}
                  </span>
                  <h4 className="text-xl font-serif font-bold text-white mt-0.5">
                    {exp.title}
                  </h4>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {exp.description}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                    <span>{exp.hours}</span>
                    <span className="text-[#007A33] font-medium">{exp.highlight}</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => handleOpenReserve(exp)}
                    className="px-4 py-2 border border-[#007A33] text-[#007A33] hover:bg-[#007A33] hover:text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Reservasi & Pilih Jam
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experience / Table Reservation Modal */}
      {isModalOpen && selectedExperience && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#0F1F17]/60 backdrop-blur-xs"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative bg-white w-full max-w-lg rounded-lg shadow-2xl border border-slate-200 z-10 overflow-hidden">
            <div className="px-6 py-4 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#007A33]">
                  Pemesanan Khusus Tamu
                </span>
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  {selectedExperience.title}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {!submitted ? (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1">
                      Nama Tamu
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="cth. Maulana Jaya"
                      value={reservationForm.name}
                      onChange={(e) => setReservationForm({ ...reservationForm, name: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded focus:border-[#007A33] focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1">
                        Tanggal Pilihan
                      </label>
                      <input
                        type="date"
                        required
                        value={reservationForm.date}
                        onChange={(e) => setReservationForm({ ...reservationForm, date: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:border-[#007A33] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1">
                        Pilihan Waktu
                      </label>
                      <select
                        value={reservationForm.time}
                        onChange={(e) => setReservationForm({ ...reservationForm, time: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:border-[#007A33] focus:outline-hidden bg-white"
                      >
                        <option value="12:00">12:00 (Makan Siang)</option>
                        <option value="17:30">17:30 (Santap Senja)</option>
                        <option value="18:30">18:30 (Makan Malam Romantis)</option>
                        <option value="20:00">20:00 (Makan Malam Larut)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1">
                      Jumlah Tamu
                    </label>
                    <select
                      value={reservationForm.guests}
                      onChange={(e) => setReservationForm({ ...reservationForm, guests: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:border-[#007A33] focus:outline-hidden bg-white"
                    >
                      <option value="1">1 Orang</option>
                      <option value="2">2 Orang (Pasangan)</option>
                      <option value="4">4 Orang (Keluarga)</option>
                      <option value="6">6+ Orang (Rombongan VIP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1">
                      Permintaan Khusus & Lokasi Meja
                    </label>
                    <input
                      type="text"
                      value={reservationForm.notes}
                      onChange={(e) => setReservationForm({ ...reservationForm, notes: e.target.value })}
                      placeholder="cth. Meja tepi teras panorama, perayaan ulang tahun..."
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded focus:border-[#007A33] focus:outline-hidden"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 bg-[#007A33] hover:bg-[#005F27] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-xs cursor-pointer transition-colors"
                    >
                      Kirim Permintaan Reservasi
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-12 h-12 bg-[#007A33] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="text-xl font-serif font-bold text-slate-900">
                    Reservasi Berhasil Diterima
                  </h4>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Terima kasih Bapak/Ibu {reservationForm.name}. Reservasi untuk {reservationForm.guests} orang pada tanggal {reservationForm.date} pukul {reservationForm.time} telah terdaftar pada tim Maître d'hôtel kami.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="mt-4 px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase rounded"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
