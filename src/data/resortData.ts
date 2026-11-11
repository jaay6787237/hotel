import { Room } from '../utils/booking';

export const ROOMS_DATA: Room[] = [
  {
    id: 'royal-presidential-suite',
    name: 'Royal Hilltop Presidential Suite',
    tagline: 'Master suite mewah dengan kaca panorama melengkung menghadap pesona Teluk Lampung',
    category: 'suite',
    basePriceIdr: 2850000,
    basePriceUsd: 185,
    maxGuests: 4,
    bedType: 'Super King Bed',
    view: 'Pemandangan Bukit & Teluk',
    sqm: 120,
    image: '/src/assets/images/suite_presidential_1794410440213.jpg',
    description: 'Berada di puncak tertinggi Bukit Randu, Presidential Suite kami menyajikan panorama spektakuler 270 derajat yang memadukan punggung perbukitan hijau asri hingga garis pantai Teluk Lampung yang berkilau. Dilengkapi seni ukir kayu jati nusantara, ruang santai privat, bathtub marmer mewah, dan layanan butler pribadi 24 jam.',
    amenities: [
      'Pemandangan Panorama Bukit & Laut',
      'Tempat Tidur Super King',
      'Sarapan Prasmanan Eksklusif Termasuk',
      'Jacuzzi Marmer Pribadi',
      'Layanan Butler 24 Jam',
      'Wi-Fi Serat Optik Kecepatan Tinggi',
      'Mesin Kopi Espresso & Pilihan Teh Pilihan',
      'Akses Prioritas Horizon Infinity Pool',
    ],
    featured: true,
  },
  {
    id: 'grand-horizon-villa',
    name: 'Grand Horizon Hillside Villa',
    tagline: 'Villa privat di lereng bukit dengan teras kayu jati luas dan daybed luar ruangan',
    category: 'villa',
    basePriceIdr: 3450000,
    basePriceUsd: 225,
    maxGuests: 3,
    bedType: 'King Bed & Daybed',
    view: 'Lembah Hijau & Pegunungan',
    sqm: 145,
    image: '/src/assets/images/villa_panoramic_1794410440783.jpg',
    description: 'Rasakan kedamaian pegunungan di villa mandiri kami. Dikelilingi tanaman tropis alami, teras kayu yang lapang sangat ideal untuk bersantai di pagi hari dan menikmati matahari terbenam, lengkap dengan rain-shower alam terbuka dan wine bar kurasi khusus.',
    amenities: [
      'Daybed Santai Luar Ruangan',
      'Tempat Tidur King',
      'Panorama Lembah Pegunungan',
      'Afternoon Tea Gratis Setiap Sore',
      'Shower Batu Alam Terbuka',
      'Mini Bar & Wine Bar Kurasi',
      'Antar-Jemput Buggy Car Bukit',
      'Fasilitas Minibar Lengkap',
    ],
    featured: true,
  },
  {
    id: 'deluxe-panoramic-sanctuary',
    name: 'Deluxe Panoramic Sanctuary',
    tagline: 'Kamar modern di puncak bukit bersebelahan langsung dengan kolam renang infinity',
    category: 'suite',
    basePriceIdr: 1850000,
    basePriceUsd: 120,
    maxGuests: 2,
    bedType: 'King Bed atau Twin',
    view: 'Kolam Infinity & Horizon Teluk',
    sqm: 65,
    image: '/src/assets/images/bukit_randu_hero_1794410439341.jpg',
    description: 'Dirancang untuk kenyamanan istimewa dengan pemandangan menakjubkan, Deluxe Panoramic Sanctuary memadukan gaya minimalis kontemporer dengan aksen batu alam. Langkah langsung ke dek kolam renang atau nikmati kopi senja dari balkon kaca pribadi Anda.',
    amenities: [
      'Akses Langsung ke Dek Kolam Renang',
      'Pilihan Ranjang King atau Twin',
      'Balkon Panorama Pribadi',
      'Sarapan Prasmanan Termasuk',
      'Meja Kerja Ergonomis & Wi-Fi Cepat',
      'Rainfall Shower Hangat',
      'Brankas Kamar & Layanan Setrika',
    ],
    featured: true,
  },
  {
    id: 'executive-sunset-suite',
    name: 'Executive Sunset Terrace Suite',
    tagline: 'Dirancang khusus bagi pebisnis dan delegasi yang mengutamakan fokus dan kemewahan',
    category: 'executive',
    basePriceIdr: 2150000,
    basePriceUsd: 140,
    maxGuests: 2,
    bedType: 'Ergonomic King Bed',
    view: 'Sunset Barat & Cakrawala Kota',
    sqm: 78,
    image: '/src/assets/images/suite_presidential_1794410440213.jpg',
    description: 'Suaka eksekutif yang memadukan fasilitas workstation modern dengan pemandangan golden hour spektakuler. Termasuk akses eksklusif ke Hilltop Business Lounge, layanan binatu kilat, dan sajian canapé sore.',
    amenities: [
      'Akses Executive Lounge Puncak',
      'Ruang Kerja Ergonomis Modern',
      'Koneksi Wi-Fi 200 Mbps',
      'Balkon Sunset Panorama Barat',
      'Layanan Binatu & Pressing Cepat',
      'Sarapan Harian & Canapé Senja',
      'Smart TV Hiburan Berkualitas',
    ],
  },
  {
    id: 'hillside-family-residence',
    name: 'Hillside Two-Bedroom Residence',
    tagline: 'Ruang hunian dua lantai yang dirancang istimewa untuk liburan keluarga besar',
    category: 'family',
    basePriceIdr: 4200000,
    basePriceUsd: 275,
    maxGuests: 6,
    bedType: '1 King + 2 Twin Beds',
    view: 'Panorama Puncak Bukit 360°',
    sqm: 180,
    image: '/src/assets/images/villa_panoramic_1794410440783.jpg',
    description: 'Nikmati kebersamaan bersama keluarga dalam kemewahan dua kamar tidur terpisah dan paviliun ruang tamu berkonsep terbuka. Dilengkapi ruang makan keluarga, dapur pantry, dek berjemur privat, dan area aman untuk anak-anak.',
    amenities: [
      'Dua Kamar Tidur dengan Kamar Mandi En-Suite',
      'Paviliun Ruang Tamu & Ruang Makan Luas',
      'Sundeck Keluarga Pribadi',
      'Sarapan Gratis untuk 4 Orang Dewasa',
      'Paket Bingkisan Selamat Datang Anak',
      'Layanan Pramutamu Keluarga Khusus',
      'Layanan Santap Kamar 24 Jam',
    ],
  },
];

export interface Experience {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  hours: string;
  highlight: string;
  image: string;
}

export const EXPERIENCES_DATA: Experience[] = [
  {
    id: 'restoran-bukit-randu',
    title: 'Restoran Bukit Randu Fine Dining',
    subtitle: 'Seni Kuliner Istimewa di Atas Gemerlap Kota',
    description: 'Nikmati kelezatan hidangan khas Nusantara autentik dan sajian kuliner internasional kontemporer di teras makan terbuka kami. Saat senja tiba, Bandar Lampung bertransformasi menjadi lautan cahaya berkilau di bawah meja santap Anda.',
    hours: 'Setiap Hari: 06:00 - 23:00',
    highlight: 'Menu Ikonik: Seruit Khas Lampung & Wagyu Ribeye',
    image: '/src/assets/images/dining_hilltop_1794410440842.jpg',
  },
  {
    id: 'horizon-pool',
    title: 'Cliffside Horizon Infinity Pool',
    subtitle: 'Berenang di Tengah Sejuknya Udara Pegunungan',
    description: 'Kolam renang infinity bertingkat dua yang seolah menyatu dengan lembah perbukitan hijau di bawahnya. Nikmati layanan minuman tepi kolam, lounger jati nyaman di bawah payung resor, dan hembusan angin bukit yang menenangkan.',
    hours: 'Setiap Hari: 06:00 - 20:00',
    highlight: 'Sunken Pool Bar & Mocktail Sunset Segar',
    image: '/src/assets/images/bukit_randu_hero_1794410439341.jpg',
  },
  {
    id: 'hilltop-spa',
    title: 'Apsara Hillside Spa & Wellness',
    subtitle: 'Relaksasi Tradisional & Aromaterapi Herbal Alami',
    description: 'Kembalikan kesegaran raga dan ketenangan jiwa dengan perawatan signature kami yang memadukan rempah herbal khas Lampung, terapi batu hangat vulkanik, dan pijatan relaksasi mendalam diiringi alunan suara alam.',
    hours: 'Setiap Hari: 09:00 - 21:00',
    highlight: 'Kompres Rempah Hangat & Rendam Kaki Kerajaan',
    image: '/src/assets/images/villa_panoramic_1794410440783.jpg',
  },
];

export interface Review {
  id: string;
  guestName: string;
  residenceCity: string;
  rating: number;
  date: string;
  roomStayed: string;
  comment: string;
}

export const REVIEWS_DATA: Review[] = [
  {
    id: 'rev-1',
    guestName: 'Dr. Hartono Sasongko',
    residenceCity: 'Jakarta',
    rating: 5,
    date: 'Menginap Oktober 2026',
    roomStayed: 'Royal Hilltop Presidential Suite',
    comment: 'Pemandangan dari Bukit Randu tiada duanya di Bandar Lampung. Terbangun menyambut kabut pagi di atas lembah dan sarapan dengan latar Teluk Lampung sungguh menenteramkan. Pelayanan staf sangat hangat dan profesional.',
  },
  {
    id: 'rev-2',
    guestName: 'Sarah & David Miller',
    residenceCity: 'Singapura',
    rating: 5,
    date: 'Menginap September 2026',
    roomStayed: 'Grand Horizon Hillside Villa',
    comment: 'Kami merayakan ulang tahun pernikahan ke-10 di Hillside Villa. Daybed terbuka di teras menghadap hutan tropis sungguh magis. Santap malam di restoran saat senja dengan pemandangan lampu kota sungguh tak terlupakan.',
  },
  {
    id: 'rev-3',
    guestName: 'Dewi Kartika & Keluarga',
    residenceCity: 'Bandung',
    rating: 5,
    date: 'Menginap Agustus 2026',
    roomStayed: 'Hillside Two-Bedroom Residence',
    comment: 'Keramahan yang luar biasa. Anak-anak sangat menyukai kolam renang infinity dan area tamannya sangat asri terawat. Kami sangat mengapresiasi kemudahan proses booking dan layanan penjemputan bandara yang tepat waktu.',
  },
];
