import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { requireAuthOrApiKey, AuthenticatedRequest } from './src/middleware/auth.ts';
import {
  getRoomsFromDb,
  getPromoCodesFromDb,
  createReservationInDb,
  getReservationsReport,
  getApiKeysFromDb,
  generateNewApiKey,
} from './src/db/queries.ts';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// 1. Health & Database Connection Diagnostic
app.get('/api/health', async (_req, res) => {
  try {
    const rooms = await getRoomsFromDb();
    res.json({
      status: 'healthy',
      database: 'PostgreSQL (Cloud SQL)',
      roomCount: rooms.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'PostgreSQL error',
      error: error.message || 'Database connection error',
    });
  }
});

// 2. Public Catalog Endpoints (Cached / Loaded from PostgreSQL)
app.get('/api/rooms', async (_req, res) => {
  try {
    const rooms = await getRoomsFromDb();
    res.json({ success: true, data: rooms });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/promo-codes', async (_req, res) => {
  try {
    const promos = await getPromoCodesFromDb();
    res.json({ success: true, data: promos });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Booking Reservation Submission (Persisted directly to Cloud SQL)
app.post('/api/reservations', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.id || !payload.roomId || !payload.guestName || !payload.guestEmail) {
      return res.status(400).json({
        success: false,
        error: 'Data pemesanan tidak lengkap (id, roomId, guestName, guestEmail wajib diisi).',
      });
    }

    const result = await createReservationInDb(payload);
    res.status(201).json({
      success: true,
      message: 'Reservasi berhasil disimpan ke basis data PostgreSQL.',
      data: result,
    });
  } catch (error: any) {
    console.error('API /api/reservations failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Secure Endpoint: Riwayat Reservasi (Multi-Join) - Wajib Firebase Token atau API Key
app.get('/api/reservations', requireAuthOrApiKey, async (req: AuthenticatedRequest, res) => {
  try {
    const report = await getReservationsReport();
    res.json({
      success: true,
      authenticatedAs: req.user ? 'Firebase User' : req.apiKeyClient?.name,
      totalRecords: report.length,
      data: report,
    });
  } catch (error: any) {
    console.error('API GET /api/reservations failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Secure Endpoint: Manajemen Kunci API Keamanan Data (API Keys)
app.get('/api/keys', async (_req, res) => {
  try {
    const keys = await getApiKeysFromDb();
    res.json({ success: true, data: keys });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/keys/generate', async (req, res) => {
  try {
    const { name, role } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, error: 'Nama kunci API wajib diisi.' });
    }

    const result = await generateNewApiKey(name.trim(), role || 'read_write');
    res.status(201).json({
      success: true,
      message: 'Kunci API baru berhasil diterbitkan dan disimpan dengan enkripsi SHA-256.',
      data: result,
    });
  } catch (error: any) {
    console.error('Failed to generate key:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Vite Dev Server Middleware or Production Static Serve
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Bukit Randu Server] Backend live on port ${port} with Cloud SQL PostgreSQL`);
  });
}

startServer();
