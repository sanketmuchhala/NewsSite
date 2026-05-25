# FunnyNews

> An autonomous multi-agent pipeline that finds, scores, and summarizes the internet's most absurd news — no human editors involved.

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firestore-database-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-f55036?style=flat-square)](https://groq.com/)
[![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Vercel](https://img.shields.io/badge/Vercel-frontend-000?style=flat-square&logo=vercel)](https://vercel.com/)
[![Railway](https://img.shields.io/badge/Railway-backend-7B2FBE?style=flat-square&logo=railway)](https://railway.app/)

**[funnynews.club](https://funnynews.club)** — live

</div>

---

## What it does

FunnyNews runs four agents on a Railway container. Every two hours the **Scrape Agent** pulls from 30+ RSS feeds, Reddit, and Hacker News; enhances each story with LLM-generated summaries, tags, and a Funny Score (1–100); and logs the run to Firestore. After each scrape the **Relationship Agent** computes story similarity scores and persists graph edges. Every morning at 8 AM the **Digest Agent** picks the top 8 stories from the last 48 hours and writes a 3-sentence deadpan roundup. The Next.js frontend reads all of this directly from Firestore.

```
Sources (RSS / Reddit / HN)
        │
        ▼
  Scrape Agent  ─────────────────────────────▶  stories
  (every 2h)          LLMClient                  Firestore
        │          Groq primary
        │          Gemini fallback
        ▼
  Relationship Agent  ───────────────────────▶  story_relationships
  (post-scrape)                                  Firestore
        
  Digest Agent  ─────────────────────────────▶  digests/YYYY-MM-DD
  (daily 8 AM)        LLMClient                  Firestore
                                                      │
                                              Next.js frontend
                                              (Vercel)
```

---

## Documentation

| Doc | Contents |
|---|---|
| [docs/architecture.md](docs/architecture.md) | System diagrams — data flow, read path, deployment topology |
| [docs/agents.md](docs/agents.md) | Deep dive into all four agents — how they work, scoring formulas, prompts |
| [docs/schema.md](docs/schema.md) | Firestore schema — all four collections with field types and index recommendations |
| [docs/api.md](docs/api.md) | Full REST API reference — every endpoint, params, and response shapes |
| [docs/deployment.md](docs/deployment.md) | Local dev setup, Vercel config, Railway config, Firestore index setup |
| [docs/env.md](docs/env.md) | Every environment variable, defaults, and setup notes |

---

## Tech stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | Next.js 15 (App Router) | Pages, SSR, serverless API routes |
| Styling | Tailwind CSS + Lucide | Design system |
| Backend | Express.js + TypeScript | Daemon — agents, scrapers, crons |
| Scheduler | node-cron | Triggers scrape and digest cycles |
| Database | Firestore | Stories, relationships, runs, digests |
| LLM (primary) | **Groq / Llama 3.3 70B** | Summaries, tags, funny scores — free tier, ~5× faster than Gemini |
| LLM (fallback) | Gemini 2.0 Flash | Automatic fallback when Groq is unavailable |
| Graph | vis-network | Force-directed story relationship graph |
| Frontend host | Vercel | Serverless, deploys on push |
| Backend host | Railway | Persistent container, Railpack build |

---

## Quickstart

```bash
# 1. Install
npm install && cd backend && npm install && cd ..

# 2. Configure
cp .env.example .env.local          # fill in Firebase web + Admin SDK + GEMINI_API_KEY
cp backend/.env.example backend/.env  # fill in Admin SDK + GROQ_API_KEY + GEMINI_API_KEY

# 3. Run
npm run dev          # Next.js → http://localhost:3000
cd backend && npm run dev  # Express → http://localhost:3001

# 4. Seed
curl -X POST http://localhost:3001/api/scrape \
  -H "Content-Type: application/json" -d '{"maxPerSource":5}'
```

Full setup guide: [docs/deployment.md](docs/deployment.md)  
All environment variables: [docs/env.md](docs/env.md)

---

## Project structure

```
NewsSite/
├── app/                    # Next.js pages + API routes
│   ├── page.tsx            # Homepage — stories feed + DigestCard
│   ├── discover/           # Filterable story browser
│   ├── story/[id]/         # Story detail + AI analysis
│   ├── graph/              # Live vis-network relationship graph
│   └── api/
│       ├── stories/        # Read/vote API
│       ├── graph/          # Graph nodes + edges from Firestore
│       └── digest/         # Latest digest proxy
│
├── backend/                # Express daemon (Railway)
│   └── src/
│       ├── index.ts        # Server entry, CORS, route registration
│       ├── cron.ts         # SCRAPE_CRON + DIGEST_CRON jobs
│       ├── scrapers/       # RSS, Reddit, HackerNews, article extractor
│       ├── ai/
│       │   ├── llm.ts              # LLMClient — Groq primary + Gemini fallback
│       │   ├── relationship-agent.ts  # Algorithmic graph edge computation
│       │   └── digest-agent.ts     # Daily 3-sentence roundup
│       ├── routes/         # stories, scrape, graph, digest
│       └── firebase/       # Firestore Admin SDK helpers
│
├── lib/
│   └── firebase/           # Client + Admin SDK (frontend)
├── types/                  # Shared TypeScript types
└── docs/                   # ← you are here
```

---

## Agents at a glance

See [docs/agents.md](docs/agents.md) for the full reference.

### Scrape Agent
Runs every 2 hours. Pulls from RSS, Reddit, and HN, deduplicates by URL slug, enhances each story with `LLMClient` (summary + tags + funny score), saves to Firestore, then hands the new slug list to the Relationship Agent. Every run is logged as a `feed_runs` document.

### Relationship Agent
Runs immediately after each scrape — no extra LLM calls. Scores every new-story × existing-story pair using:

```
score = tagOverlap × 0.4  +  titleWordOverlap × 0.3  +  sameSource × 0.3
```

Pairs above 0.3 are written to `story_relationships` with a deterministic idempotent doc ID. The graph page reads from this collection instead of recomputing on every request.

### Digest Agent
Runs daily at 8 AM UTC. Picks the top 8 stories by funny score from the last 48 hours, sends them to `LLMClient` with a deadpan-editor prompt, and writes a `digests/YYYY-MM-DD` document. The homepage renders this as an amber-bordered card above the featured story.

### LLMClient
Groq's Llama 3.3 70B is tried first — it's free-tier and ~5× faster than Gemini. Any Groq error silently falls through to Gemini 2.0 Flash. The `ai_model` field on each story records which model actually generated its content.

---

## Key API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Uptime check |
| `GET` | `/api/stories` | Paginated story feed |
| `GET` | `/api/stories/:slug` | Single story + view count increment |
| `POST` | `/api/stories/:slug/vote` | Upvote / downvote |
| `GET` | `/api/graph` | Nodes + edges for vis-network |
| `POST` | `/api/scrape` | Manually trigger a scrape run |
| `GET` | `/api/scrape/runs` | Recent FeedRun logs |
| `GET` | `/api/digest` | Latest daily digest |
| `POST` | `/api/digest/generate` | Manually trigger digest generation |

Full reference: [docs/api.md](docs/api.md)
