import 'node:process';
import express from 'express';
import cors from 'cors';
import storiesRouter from './routes/stories';
import scrapeRouter from './routes/scrape';
import graphRouter from './routes/graph';
import { startCronJobs } from './cron';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin "${origin}" not allowed`));
    },
    credentials: true,
  }),
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString(), uptime: process.uptime() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/stories', storiesRouter);
app.use('/api/scrape', scrapeRouter);
app.use('/api/graph', graphRouter);

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`FunnyNews backend listening on :${PORT}`);
  console.log(`  CORS origins: ${allowedOrigins.length ? allowedOrigins.join(', ') : '* (all)'}`);
  startCronJobs();
});
