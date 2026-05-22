import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';

const app = express();

function isAllowedOrigin(origin) {
  if (!origin) return true;

  const allowed =
    process.env.CORS_ORIGIN?.split(',')
      .map((value) => value.trim())
      .filter(Boolean) ?? [];

  if (allowed.includes(origin)) return true;
  if (/^http:\/\/localhost:\d+$/.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;

  return allowed.length === 0;
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, origin ?? true);
        return;
      }

      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    name: 'centraldrinks-backend',
    message: 'API activa. Probá GET /health o POST /api/auth/login',
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, name: 'centraldrinks-backend' });
});

app.use('/api', routes);
app.use(routes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  const message = err instanceof Error ? err.message : 'Error interno';
  const status = err.status ?? 500;
  res.status(status).json({ error: message });
});

export default app;
