# FunnyNews Backend

Standalone Express API server that handles scraping, AI enhancement, and data storage.  
Designed to run on **Railway** as a persistent service with a built-in cron scheduler.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/stories` | List stories (`?pageSize=100&sortBy=scraped_at&source=rss`) |
| POST | `/api/stories` | Create a story |
| GET | `/api/stories/:id` | Get single story (also increments view count) |
| GET | `/api/stories/:id/content` | Fetch + cache article text & AI summary |
| POST | `/api/stories/:id/vote` | Vote `{ "vote_type": "upvote" \| "downvote" }` |
| GET | `/api/graph` | Graph nodes + edges data |
| POST | `/api/scrape` | Run full scrape `{ "maxPerSource": 15 }` |
| GET | `/api/scrape/status` | Scraper status & config |
| POST | `/api/scrape/enhance` | Re-enhance summaries `{ "limit": 50, "force": false }` |

## Deploy to Railway

### 1. Create a new Railway project
```
railway login
railway init          # in this backend/ directory
railway up
```

Or push to GitHub and connect via the Railway dashboard — set **Root Directory** to `backend/`.

### 2. Set environment variables in Railway

Copy `.env.example` and fill in your values in the Railway dashboard under **Variables**:

```
FIREBASE_PROJECT_ID=funnynews-8d9a4
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@funnynews-8d9a4.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
GEMINI_API_KEY=AIzaSy...
ALLOWED_ORIGINS=https://funnynews.club,http://localhost:3000
SCRAPE_CRON=0 */2 * * *
SCRAPE_MAX_PER_SOURCE=15
```

> **Important:** Paste the Firebase private key exactly as-is (with literal `\n`).  
> Railway injects it as an env var and the code calls `.replace(/\\n/g, '\n')` on it.

### 3. Railway will auto-deploy on every push

Railway detects the `Dockerfile`, builds it, and starts `node dist/index.js`.

---

## Local development

```bash
cp .env.example .env
# fill in .env with your real values

npm install
npm run dev       # tsx watch — hot reload
```

## Connect the Next.js frontend

In the frontend's `.env.local`, add:

```
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
```

Then update fetch calls from `/api/stories` → `${process.env.NEXT_PUBLIC_API_URL}/api/stories`.  
(The existing Next.js API routes still work standalone — switching is optional.)
