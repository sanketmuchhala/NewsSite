# FunnyNews

A news aggregator built for people who enjoy absurd, bizarre, and satirical news. Scrapes 30+ sources across satire, weird news, tech, and cannabis categories, enhances every story with AI-written summaries, and presents them through a fast, filterable feed.

Live at **[funnynews.club](https://funnynews.club)**

---

## What it does

- Scrapes **30+ RSS feeds** (The Onion, Babylon Bee, r/nottheonion, The Verge, High Times, and more)
- Pulls from **Reddit** (nottheonion, FloridaMan, WTF, facepalm, etc.) and **Hacker News**
- Runs each story through **Gemini 2.0 Flash** for a 5–7 sentence deadpan summary and funny score
- Stores everything in **Firestore** with human-readable slug IDs (`florida-man-arrested-lawn-mower-a3f2c1`)
- Auto-scrapes every 2 hours via the Railway backend's built-in cron scheduler

---

## Architecture

```
┌─────────────────────────┐     ┌──────────────────────────────┐
│   Next.js frontend       │────▶│   Railway backend             │
│   (Vercel)               │     │   (Express + node-cron)       │
│                          │     │                              │
│  / Home feed             │     │  POST /api/scrape            │
│  /discover               │     │  POST /api/scrape/enhance    │
│  /trending               │     │  GET  /api/stories           │
│  /story/[slug]           │     │  GET  /api/stories/:id       │
│  /graph                  │     │  POST /api/stories/:id/vote  │
└─────────────────────────┘     └──────────┬───────────────────┘
                                            │
                                   ┌────────▼────────┐
                                   │    Firestore     │
                                   │  (stories col.)  │
                                   └─────────────────┘
```

The Next.js app has its own thin API routes (`app/api/`) that talk directly to Firestore for reads. The Railway backend handles heavy scraping and AI enhancement, running on a cron schedule so Vercel's 10s function timeout is never hit.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| Backend | Express.js, TypeScript, node-cron |
| Database | Firebase Firestore |
| AI | Google Gemini 2.0 Flash |
| Graph viz | vis-network |
| Frontend hosting | Vercel |
| Backend hosting | Railway |

---

## Project structure

```
├── app/
│   ├── page.tsx                 # Home feed
│   ├── discover/page.tsx        # Filtered discovery view
│   ├── trending/page.tsx        # Trending stories
│   ├── story/[id]/page.tsx      # Story detail + AI summary
│   ├── graph/page.tsx           # Interactive story network
│   └── api/
│       ├── stories/             # CRUD + vote + content endpoints
│       ├── scrape/              # Scrape trigger + enhance
│       └── graph/               # Graph data
│
├── backend/                     # Standalone Railway service
│   ├── src/
│   │   ├── index.ts             # Express server entry point
│   │   ├── cron.ts              # Scheduled scraping
│   │   ├── routes/              # stories, scrape, graph
│   │   ├── scrapers/            # RSS, Reddit, HN, article extractor
│   │   ├── firebase/            # Firestore admin client
│   │   └── ai/                  # Gemini client
│   ├── Dockerfile
│   └── railway.toml
│
├── lib/
│   ├── scrapers/                # Shared scraper modules
│   ├── firebase/                # Admin + client SDK setup
│   └── ai/gemini.ts             # Gemini client
│
├── components/                  # UI components
│   ├── StoryCard.tsx
│   ├── NetworkGraph.tsx
│   └── Header.tsx
│
└── types/index.ts               # Shared TypeScript types
```

---

## Content sources

### Satire
The Onion · ClickHole · Reductress · Babylon Bee · The Beaverton · The Daily Mash · Waterford Whispers · The Shovel · Duffel Blog · The Hard Times

### Weird news
r/nottheonion · r/FloridaMan · UPI Odd News · NY Post Weird · Mental Floss · Cracked · Mashable · Oddee · Vice · Kotaku

### Tech
The Verge · Ars Technica · TechCrunch · Gizmodo · Wired · The Register · 404 Media · Slashdot

### Cannabis
Merry Jane · High Times

### Reddit (direct API)
r/nottheonion · r/FloridaMan · r/WTF · r/offbeat · r/facepalm · r/NewsOfTheStupid · r/AbsurdNews · r/mildlyinteresting

### Hacker News
Algolia HN Search — weird, tech, science, and funny query groups + front page top stories

---

## Environment variables

### Next.js frontend (`.env.local`)

```env
# Firebase client SDK (public — safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (server-side Next.js API routes)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# AI
GEMINI_API_KEY=
```

### Railway backend (`backend/.env`)

```env
PORT=3001
ALLOWED_ORIGINS=https://funnynews.club,http://localhost:3000

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

GEMINI_API_KEY=

# Optional
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=

SCRAPE_CRON=0 */2 * * *
SCRAPE_MAX_PER_SOURCE=15
```

---

## Local development

**Frontend:**
```bash
npm install
cp .env.example .env.local   # fill in Firebase + Gemini keys
npm run dev                   # http://localhost:3000
```

**Backend:**
```bash
cd backend
npm install
cp .env.example .env          # fill in keys
npm run dev                   # http://localhost:3001 (tsx watch)
```

**Trigger a manual scrape:**
```bash
curl -X POST http://localhost:3001/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"maxPerSource": 5}'
```

**Re-enhance existing story summaries with the improved Gemini prompt:**
```bash
curl -X POST http://localhost:3001/api/scrape/enhance \
  -H "Content-Type: application/json" \
  -d '{"limit": 200, "force": true}'
```

---

## Deployment

### Vercel (frontend)

1. Connect the repo to Vercel
2. Set all `NEXT_PUBLIC_*` and `FIREBASE_*` and `GEMINI_API_KEY` variables in the Vercel dashboard
3. Push to `main` — auto-deploys

### Railway (backend)

1. In Railway dashboard: **New Project → Deploy from GitHub**
2. Set **Root Directory** to `backend`
3. Railway detects the `Dockerfile` and builds automatically
4. Add the env vars listed above under **Variables**

Railway auto-assigns `PORT`. The backend health check is at `/health`.

---

## API reference

### Stories

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/stories` | List stories. Params: `pageSize`, `sortBy` (`scraped_at`\|`upvotes`\|`funny_score`), `source` |
| `GET` | `/api/stories/:slug` | Get single story (increments view count) |
| `GET` | `/api/stories/:slug/content` | Fetch + cache article text & AI summary on demand |
| `POST` | `/api/stories/:slug/vote` | `{ "vote_type": "upvote" \| "downvote" }` |

### Scraping

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/scrape` | Run full scrape. Body: `{ "maxPerSource": 15 }` |
| `POST` | `/api/scrape/enhance` | Re-enhance summaries. Body: `{ "limit": 50, "force": false }` |
| `GET` | `/api/scrape/status` | Scraper config and status |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/graph` | Node + edge data for the story network graph |
| `GET` | `/health` | Backend health check |

---

## Commands

```bash
# Frontend
npm run dev          # start dev server
npm run build        # production build
npm run typecheck    # tsc --noEmit

# Backend (from backend/)
npm run dev          # tsx watch
npm run build        # tsc → dist/
npm run start        # node dist/index.js
npm run typecheck    # tsc --noEmit
```
