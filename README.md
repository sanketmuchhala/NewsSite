<div align="center">

# 🗞️ FunnyNews

**An AI-powered aggregator for absurd, satirical, and genuinely weird news.**  
Scrapes 30+ sources, writes deadpan summaries with Gemini, and serves them through a fast filterable feed.

**[funnynews.club](https://funnynews.club)** · Next.js · Firebase · Railway · Gemini 2.0

</div>

---

## How it works

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SCRAPE PIPELINE                             │
│                                                                     │
│  RSS Feeds (30)    Reddit API     Hacker News      Twitter (stub)   │
│       │                │               │                │           │
│       └────────────────┴───────────────┘                │           │
│                         │                                           │
│                   ┌─────▼──────┐                                    │
│                   │  Dedupe    │  (URL-based)                        │
│                   └─────┬──────┘                                    │
│                         │                                           │
│               ┌─────────▼──────────┐                                │
│               │  Gemini 2.0 Flash  │  summary · tags · funny score  │
│               └─────────┬──────────┘                                │
│                         │                                           │
│                 ┌────────▼────────┐                                 │
│                 │    Firestore     │  slug-based doc IDs             │
│                 └─────────────────┘                                 │
│                                                                     │
│  Runs every 2h via node-cron on Railway                             │
└─────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SERVING LAYER                                │
│                                                                     │
│   Browser                                                           │
│      │                                                              │
│      ▼                                                              │
│  ┌────────────────────────────┐   ┌──────────────────────────────┐  │
│  │   Next.js  (Vercel)        │   │  Express backend (Railway)   │  │
│  │                            │   │                              │  │
│  │  / ········· Home feed     │   │  POST /api/scrape            │  │
│  │  /discover · Mood filter   │   │  POST /api/scrape/enhance    │  │
│  │  /trending · Top stories   │   │  GET  /api/stories           │  │
│  │  /story/:slug · Detail     │   │  GET  /api/stories/:id       │  │
│  │  /graph ···· Story network │   │  POST /api/stories/:id/vote  │  │
│  │                            │   │  GET  /api/graph             │  │
│  └────────────┬───────────────┘   └──────────────┬───────────────┘  │
│               │                                  │                  │
│               └─────────────┬─���──────────────────┘                  │
│                             │                                       │
│                      ┌──────▼──────┐                                │
│                      │  Firestore  │                                │
│                      └─────────────┘                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Content sources

```
SATIRE ──────────────────────────────────────────────────────────────
  The Onion · ClickHole · Reductress · Babylon Bee · The Beaverton
  The Daily Mash · Waterford Whispers �� The Shovel · Duffel Blog
  The Hard Times

WEIRD NEWS ──────────────────────────────────────────────────────────
  r/nottheonion · r/FloridaMan · UPI Odd News · NY Post Weird
  Mental Floss · Cracked · Mashable · Oddee · Vice · Kotaku

TECH ───��────────────────────────────────────────────────────────────
  The Verge · Ars Technica · TechCrunch · Gizmodo · Wired
  The Register · 404 Media · Slashdot

CANNABIS ────────────────────────────────────────────────────────────
  Merry Jane · High Times

REDDIT (direct API) ─────────────────────────────────────────────────
  r/nottheonion · r/FloridaMan · r/WTF · r/offbeat · r/facepalm
  r/NewsOfTheStupid · r/AbsurdNews · r/mildlyinteresting

HACKER NEWS ─────────────────────────────────────────────────────────
  Algolia HN Search — weird, tech, science, funny query groups
  + front page top stories (>100 points)
```

---

## Tech stack

```
Frontend          Next.js 14 · React 18 · TypeScript · Tailwind CSS
Backend           Express.js · TypeScript · node-cron
Database          Firebase Firestore
AI                Google Gemini 2.0 Flash
Graph viz         vis-network
Frontend hosting  Vercel
Backend hosting   Railway
```

---

## Project structure

```
NewsSite/
│
├── app/                         Next.js App Router pages
│   ├── page.tsx                 Home feed
│   ├── discover/                Mood-filtered discovery
│   ├── trending/                Trending stories
│   ├── story/[id]/              Story detail + AI summary
│   ├── graph/                   Interactive story network
│   └── api/
│       ├── stories/             CRUD + vote + on-demand content
│       ├── scrape/              Scrape trigger + batch enhance
│       └── graph/               Graph node/edge data
│
├── backend/                     Standalone Railway service
│   ├── src/
│   │   ├── index.ts             Express entry point + CORS
│   │   ├── cron.ts              Scheduled scraping (node-cron)
│   │   ├── routes/              stories.ts · scrape.ts · graph.ts
│   │   ├── scrapers/            rss · reddit · hackernews · extractor
│   │   ├── firebase/            Admin SDK (Firestore reads/writes)
│   │   └── ai/gemini.ts         Summary · tags · funny score
│   ├── Dockerfile
│   └── railway.toml
│
├── lib/
│   ├── scrapers/                Shared scraper modules
│   ├── firebase/                Admin + client SDK setup
│   └── ai/gemini.ts             Gemini client
│
├── components/
│   ├── StoryCard.tsx
│   ├── NetworkGraph.tsx
│   └── Header.tsx
│
└── types/index.ts               Shared TypeScript types
```

---

## Environment variables

**Next.js frontend** (Vercel dashboard or `.env.local`):

```env
# Firebase client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (server-side)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=          # paste with literal \n chars

# AI
GEMINI_API_KEY=
```

**Railway backend** (`backend/.env` or Railway dashboard):

```env
PORT=3001
ALLOWED_ORIGINS=https://funnynews.club,http://localhost:3000

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

GEMINI_API_KEY=

REDDIT_CLIENT_ID=              # optional
REDDIT_CLIENT_SECRET=          # optional

SCRAPE_CRON=0 */2 * * *        # every 2 hours
SCRAPE_MAX_PER_SOURCE=15
```

---

## Local development

```bash
# Frontend
npm install
cp .env.example .env.local     # fill in Firebase + Gemini keys
npm run dev                    # ��� http://localhost:3000

# Backend  (separate terminal)
cd backend
npm install
cp .env.example .env
npm run dev                    # → http://localhost:3001 (tsx watch)
```

Trigger a manual scrape:

```bash
curl -X POST http://localhost:3001/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"maxPerSource": 5}'
```

Re-enhance all story summaries with the Gemini prompt:

```bash
curl -X POST http://localhost:3001/api/scrape/enhance \
  -H "Content-Type: application/json" \
  -d '{"limit": 200, "force": true}'
```

---

## Deployment

```
Vercel  ──  connect repo, set env vars, auto-deploys on push to main
Railway ──  new project → GitHub → Root Directory: backend → set env vars
```

Railway auto-provides `PORT`. Health check endpoint: `/health`.

---

## API reference

```
GET    /api/stories                    list  (pageSize · sortBy · source)
GET    /api/stories/:slug              single story + increments view count
GET    /api/stories/:slug/content      fetch + cache article text & summary
POST   /api/stories/:slug/vote         { "vote_type": "upvote"|"downvote" }

POST   /api/scrape                     run full scrape  { maxPerSource }
POST   /api/scrape/enhance             re-enhance summaries  { limit, force }
GET    /api/scrape/status              scraper config

GET    /api/graph                      nodes + edges for story network
GET    /health                         backend health check
```

---

<div align="center">
Built by <strong>Antigravity</strong>
</div>
