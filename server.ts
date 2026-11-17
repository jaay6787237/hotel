import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import app from './api/index.ts';
import { isUsingSupabasePg } from './src/db/index.ts';
import { isUsingSupabaseApi } from './src/lib/supabase-admin.ts';

dotenv.config();

const port = parseInt(process.env.PORT || '3000', 10);

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
    const provider = isUsingSupabasePg()
      ? 'Supabase PostgreSQL (Pool)'
      : isUsingSupabaseApi()
        ? 'Supabase PostgreSQL (API)'
        : 'Cloud SQL PostgreSQL';
    console.log(`[Bukit Randu Server] Backend live on port ${port} with ${provider}`);
  });
}

startServer();
