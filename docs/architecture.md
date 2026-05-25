# System Architecture

FunnyNews is a **multi-agent news pipeline** deployed across two runtimes: a Next.js frontend on Vercel and a long-running Express daemon on Railway. Agents run inside the Railway container on cron schedules; the frontend reads their output from Firestore.

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Railway Backend (daemon)                      │
│                                                                      │
│  ┌──────────────┐   ┌──────────────────┐   ┌──────────────────────┐ │
│  │ Scrape Agent │──▶│ Relationship Agent│   │   Digest Agent       │ │
│  │ (every 2h)   │   │ (post-scrape)     │   │   (daily @ 8 AM)     │ │
│  └──────┬───────┘   └────────┬─────────┘   └──────────┬───────────┘ │
│         │                   │                          │             │
│         ▼                   ▼                          ▼             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   LLMClient                                   │   │
│  │         Groq / llama-3.3-70b-versatile (primary)             │   │
│  │         Google Gemini 2.0 Flash          (fallback)          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ Firebase Admin SDK
                          ▼
            ┌─────────────────────────┐
            │   Firestore (4 colls)   │
            │  stories                │
            │  story_relationships    │
            │  feed_runs              │
            │  digests                │
            └────────────┬────────────┘
                         │
            ┌────────────▼────────────┐
            │  Next.js on Vercel      │
            │  (app router + API routes)│
            └─────────────────────────┘
                         │
                    User browser
```

---

## Data Flow — Scrape Cycle

```mermaid
flowchart TD
    CRON([node-cron\nSCRAPE_CRON]) --> SA[Scrape Agent\nscrapeAll]
    SA --> FR[(feed_runs\nstatus=running)]

    SA --> RSS[RSS Scraper\n30+ feeds]
    SA --> RD[Reddit Scraper\nr/nottheonion etc.]
    SA --> HN[HackerNews Scraper\nAlgolia API]

    RSS & RD & HN --> DEDUP{URL already\nin Firestore?}
    DEDUP -->|yes| SKIP[skip]
    DEDUP -->|no| FETCH[fetchArticleText]
    FETCH --> LLM[LLMClient\nGroq primary ▸ Gemini fallback]
    LLM --> STORY[(stories\ncollection)]
    STORY --> RA[Relationship Agent\ntag+word+source scoring]
    RA --> REL[(story_relationships\ncollection)]
    STORY --> FR2[(feed_runs\nstatus=done)]
```

---

## Data Flow — Daily Digest

```mermaid
flowchart TD
    DCRON([node-cron\nDIGEST_CRON\n0 8 * * *]) --> DA[Digest Agent]
    DA -->|top 8 stories\nlast 48h| STORIES[(stories)]
    DA --> LLM[LLMClient\n3-sentence roundup]
    LLM --> DIG[(digests\nYYYY-MM-DD)]
    DIG --> API[GET /api/digest]
    API --> HP[Homepage\nDigestCard]
```

---

## Read Path (Frontend)

```mermaid
sequenceDiagram
    participant Browser
    participant Vercel as Next.js / Vercel
    participant FS as Firestore

    Browser->>Vercel: GET /
    Vercel->>FS: adminGetStories(100)
    Vercel->>FS: adminGetLatestDigest()
    FS-->>Vercel: stories[], digest
    Vercel-->>Browser: page (React SSR / client hydration)

    Browser->>Vercel: GET /api/graph
    Vercel->>FS: adminGetStories(150) + adminGetRelationships(500)
    FS-->>Vercel: nodes[], edges[]
    Vercel-->>Browser: { nodes, edges }
```

---

## Deployment Topology

| Service | Platform | Trigger | Resources |
|---|---|---|---|
| Next.js frontend + API routes | **Vercel** | Push to `main` | Serverless functions |
| Express daemon + agents + crons | **Railway** | Push to `main` | Persistent container (`Railpack` build) |
| Firestore | **Google Cloud** | SDK calls | Spark → Blaze plan |

The backend's [`railway.toml`](../backend/railway.toml) handles build configuration. The `Dockerfile` at `backend/Dockerfile` is used by Railpack.
