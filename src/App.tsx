import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ReservationBar } from './components/ReservationBar';
import { RoomSection } from './components/RoomSection';
import { DiningExperienceSection } from './components/DiningExperienceSection';
import { ReviewsAndLocation } from './components/ReviewsAndLocation';
import { Footer } from './components/Footer';
import { BookingModal } from './components/BookingModal';
import { RoomDetailModal } from './components/RoomDetailModal';
import { DatabaseSchemaModal } from './components/DatabaseSchemaModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { StickyQuickBookingBar } from './components/StickyQuickBookingBar';
import { Toast, ToastMessage } from './components/Toast';
import { ROOMS_DATA } from './data/resortData';
import { Room, BookingDates, getPromoDiscountPercentage } from './utils/booking';

export default function App() {
  const [currency, setCurrency] = useState<'IDR' | 'USD'>('IDR');
  
  // Default to upcoming dates (7 days from now for 2 nights)
  const today = new Date();
  const defaultCheckIn = new Date(today);
  defaultCheckIn.setDate(today.getDate() + 7);
  const defaultCheckOut = new Date(defaultCheckIn);
  defaultCheckOut.setDate(defaultCheckIn.getDate() + 2);

  const [dates, setDates] = useState<BookingDates>({
    checkIn: defaultCheckIn.toISOString().split('T')[0],
    checkOut: defaultCheckOut.toISOString().split('T')[0],
  });

  const [guestCount, setGuestCount] = useState<number>(2);
  const [promoCode, setPromoCode] = useState<string>('');

  const [detailModalRoom, setDetailModalRoom] = useState<Room | null>(null);
  const [bookingModalRoom, setBookingModalRoom] = useState<Room | null>(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);

  // Micro-interaction state: Saved Wishlist Favorites
  const [favorites, setFavorites] = useState<string[]>(['royal-presidential-suite']);

  // Micro-interaction state: Animated Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, description?: string, type: ToastMessage['type'] = 'success') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const discountPercentage = getPromoDiscountPercentage(promoCode);

  const handleToggleCurrency = () => {
    setCurrency((prev) => {
      const next = prev === 'IDR' ? 'USD' : 'IDR';
      addToast(
        `Mata uang diubah ke ${next}`,
        next === 'IDR' ? 'Tarif ditampilkan dalam Rupiah Indonesia' : 'Tarif ditampilkan dalam US Dollar',
        'info'
      );
      return next;
    });
  };

  const handleToggleFavorite = (roomId: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(roomId);
      const room = ROOMS_DATA.find((r) => r.id === roomId);
      if (exists) {
        addToast(
          'Dihapus dari Favorit',
          `${room?.name || 'Akomodasi'} dihapus dari daftar impian Anda.`,
          'info'
        );
        return prev.filter((id) => id !== roomId);
      } else {
        addToast(
          'Disimpan ke Favorit',
          `${room?.name || 'Akomodasi'} berhasil ditambahkan ke daftar impian Anda.`,
          'favorite'
        );
        return [...prev, roomId];
      }
    });
  };

  const handleScrollToBooking = () => {
    const el = document.getElementById('reservation-bar');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToSuites = () => {
    const el = document.getElementById('suites');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDetailModal = (room: Room) => {
    setDetailModalRoom(room);
  };

  const handleOpenBookingModal = (room: Room) => {
    setBookingModalRoom(room);
  };

  const handlePromoAppliedToast = (code: string, discount: number) => {
    addToast(
      `Kode Promo ${code} Aktif!`,
      `Potongan harga sebesar ${discount}% berhasil diterapkan pada semua tarif suite.`,
      'promo'
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F1F17] relative">
      {/* Top Bar Navigation */}
      <Navbar
        onBookNowClick={handleScrollToBooking}
        currency={currency}
        onToggleCurrency={handleToggleCurrency}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      {/* Hero Section */}
      <main className="flex-1">
        <Hero
          onCheckDates={handleScrollToBooking}
          onExploreSuites={handleScrollToSuites}
        />

        {/* Floating Reservation Segmented Bar */}
        <ReservationBar
          dates={dates}
          onDatesChange={setDates}
          guestCount={guestCount}
          onGuestCountChange={setGuestCount}
          promoCode={promoCode}
          onPromoCodeChange={setPromoCode}
          onSearch={handleScrollToSuites}
          onPromoAppliedToast={handlePromoAppliedToast}
        />

        {/* Suites & Accommodations Grid */}
        <RoomSection
          rooms={ROOMS_DATA}
          currency={currency}
          checkIn={dates.checkIn}
          checkOut={dates.checkOut}
          discountPercentage={discountPercentage}
          guestCount={guestCount}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          onViewDetails={handleOpenDetailModal}
          onSelectRoom={handleOpenBookingModal}
        />

        {/* Hilltop Dining & Wellness Showcase */}
        <DiningExperienceSection />

        {/* Reviews, Location, & Concierge */}
        <ReviewsAndLocation />
      </main>

      {/* Footer */}
      <Footer
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      {/* Sticky Quick Booking Micro-Interaction Bar */}
      <StickyQuickBookingBar
        dates={dates}
        guestCount={guestCount}
        onOpenBooking={() => {
          // Open default or first featured room
          handleOpenBookingModal(ROOMS_DATA[0]);
        }}
        onScrollToTop={handleScrollToTop}
      />

      {/* Toast Notification Micro-Interactions */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />

      {/* Room Details Modal */}
      <RoomDetailModal
        room={detailModalRoom}
        isOpen={!!detailModalRoom}
        onClose={() => setDetailModalRoom(null)}
        onReserve={(room) => {
          setDetailModalRoom(null);
          setBookingModalRoom(room);
        }}
        currency={currency}
      />

      {/* Multi-step Reservation Modal with Rate Breakdown */}
      <BookingModal
        isOpen={!!bookingModalRoom}
        onClose={() => setBookingModalRoom(null)}
        room={bookingModalRoom}
        dates={dates}
        onDatesChange={setDates}
        currency={currency}
        initialPromoCode={promoCode}
        onCopyToast={(text) => addToast('Berhasil Disalin', text, 'success')}
      />

      {/* SQL Architecture & RDBMS Schema Catalog Modal */}
      <DatabaseSchemaModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
        onShowToast={(msg) => addToast('Basis Data SQL', msg, 'info')}
      />

      {/* Data Security & API Key Management Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onShowToast={(msg) => addToast('Keamanan API', msg, 'info')}
      />
    </div>
  );
}
