# Deployment Guide

---

## Prerequisites

- **Node.js** v18+
- A **Firebase project** with Firestore enabled
- A **Groq API key** (free) — [console.groq.com/keys](https://console.groq.com/keys)
- A **Google AI Studio key** (Gemini fallback) — [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- Optional: Reddit OAuth app credentials for Reddit scraping

---

## Local Development

### 1. Clone and install

```bash
git clone https://github.com/sanketmuchhala/NewsSite
cd NewsSite

npm install          # frontend deps
cd backend && npm install && cd ..
```

### 2. Configure environment variables

**Frontend** (`.env.local`):

```bash
cp .env.example .env.local
# fill in Firebase web SDK keys + Admin SDK service account + GEMINI_API_KEY
```

**Backend** (`backend/.env`):

```bash
cp backend/.env.example backend/.env
# fill in Firebase Admin SDK + GROQ_API_KEY + GEMINI_API_KEY
```

See the [environment variables reference](./env.md) for every key.

### 3. Start both services

```bash
# Terminal 1 — Next.js dev server
npm run dev              # http://localhost:3000

# Terminal 2 — Express backend
cd backend && npm run dev  # http://localhost:3001
```

The Next.js app proxies scrape/backend calls to `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3001`).

### 4. Seed stories

Trigger a manual scrape to populate Firestore:

```bash
curl -X POST http://localhost:3001/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"maxPerSource": 5}'
```

Trigger a digest once stories exist:

```bash
curl -X POST http://localhost:3001/api/digest/generate
```

---

## Production — Vercel (Frontend)

1. **Import** the repo in the Vercel dashboard.
2. **Build command:** `npm run build` (root)
3. **Output directory:** `.next`
4. **Add environment variables** — all `NEXT_PUBLIC_*` vars plus Admin SDK vars.
5. Deploy triggers on every push to `main`.

---

## Production — Railway (Backend)

The Express daemon uses **Railpack** for zero-config builds (configured in [`backend/railway.toml`](../backend/railway.toml)).

### Steps

1. Create a new **Railway service** and connect the GitHub repo.
2. Set **Root directory** to `backend/` in the service settings.
3. Add environment variables (see [env.md](./env.md) — backend section).
4. Deploy.

Railway keeps the container running so `node-cron` fires on schedule.

### Scaling note

The scrape cron is CPU-light but network-heavy. The default Railway shared CPU instance handles it fine. If you increase `SCRAPE_MAX_PER_SOURCE` beyond 50, consider bumping to a dedicated instance to avoid LLM request timeouts.

---

## Firestore indexes

Create these composite indexes in the Firebase console (or via `firestore.indexes.json`) to avoid "requires an index" errors in production:

```json
{
  "indexes": [
    {
      "collectionGroup": "stories",
      "fields": [
        { "fieldPath": "source_type", "order": "ASCENDING" },
        { "fieldPath": "scraped_at",  "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "stories",
      "fields": [
        { "fieldPath": "category",  "order": "ASCENDING" },
        { "fieldPath": "scraped_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "stories",
      "fields": [
        { "fieldPath": "needs_reprocess", "order": "ASCENDING" },
        { "fieldPath": "scraped_at",      "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## Monitoring

- **Agent activity:** `GET /api/scrape/runs` — last N `feed_runs` records show counts and errors per cycle.
- **Digest status:** `GET /api/digest/latest` — confirms today's digest was generated.
- **Health check:** `GET /health` — Railway can be configured to ping this endpoint for uptime monitoring.
- **Logs:** Railway's built-in log view streams stdout from the daemon. Each agent prefixes its log lines: `[cron]`, `[ScrapeAgent]`, `[RelationshipAgent]`, `[DigestAgent]`.
