# REST API Reference

Two separate API surfaces exist:

- **Next.js API routes** (`app/api/…`) — served by Vercel serverless functions, read directly from Firestore via the Admin SDK.
- **Express backend routes** (`backend/src/routes/…`) — served by the Railway container, handle writes, scraping triggers, and agent management.

In production the Express backend is at the URL stored in `NEXT_PUBLIC_API_URL`. The Next.js routes proxy or delegate to it for write operations.

---

## Health

### `GET /health` _(backend)_

Returns server uptime and timestamp. No auth required.

```json
{ "ok": true, "ts": "2026-05-25T12:00:00.000Z", "uptime": 3600.4 }
```

---

## Stories

### `GET /api/stories`

Paginated list of stories, sorted by `scraped_at` descending by default.

**Query params:**

| Param | Default | Notes |
|---|---|---|
| `pageSize` | `20` | Max 200 |
| `sortBy` | `scraped_at` | `scraped_at` \| `upvotes` \| `funny_score` |
| `category` | — | Filter by `category` field |
| `source_type` | — | `rss` \| `reddit` \| `hackernews` |

**Response:**

```json
{
  "success": true,
  "data": [ NewsStory, … ],
  "pagination": { "total": 1240, "pageSize": 20 }
}
```

---

### `GET /api/stories/:slug`

Returns a single story and increments its `view_count`.

```json
{ "success": true, "data": NewsStory }
```

---

### `GET /api/stories/:slug/content`

Returns full article text and cached summary. Used by the story detail page.

---

### `POST /api/stories/:slug/vote`

Cast an anonymous vote. De-duplication is handled server-side.

**Body:**

```json
{ "vote_type": "upvote" }
```

---

## Graph

### `GET /api/graph`

Returns nodes and edges for the `vis-network` graph. Nodes are stories; edges are relationships from the `story_relationships` collection (pre-computed by the Relationship Agent).

```json
{
  "success": true,
  "nodes": [
    { "id": "slug-abc123", "label": "Story Title", "color": "#f59e0b", "funny_score": 88 }
  ],
  "edges": [
    { "from": "slug-abc123", "to": "slug-def456", "value": 0.72, "type": "similar" }
  ]
}
```

Node colors by source type:

| Source type | Color |
|---|---|
| `reddit` | `#ff4500` |
| `hackernews` | `#9900cc` |
| `rss` (default) | `#f59e0b` |

---

## Scrape

### `POST /api/scrape` _(backend)_

Manually trigger the full scrape pipeline. Runs the same code as the cron job.

**Body:**

```json
{ "maxPerSource": 5 }
```

**Response on success:**

```json
{
  "success": true,
  "runId": "abc123firestore",
  "saved": 12,
  "failed": 1,
  "total": 13,
  "ai_enhanced": 11
}
```

---

### `GET /api/scrape/runs` _(backend)_

Returns the last N `feed_runs` documents.

**Query params:** `?limit=10`

---

### `POST /api/scrape/enhance` _(Next.js + backend)_

Re-runs AI enhancement on stories flagged with `needs_reprocess: true`. Also accepts `force: true` to re-enhance all recent stories.

**Body:**

```json
{ "limit": 50, "force": false }
```

---

## Digest

### `GET /api/digest` _(Next.js)_ · `GET /api/digest/latest` _(backend)_

Returns the most recent digest document.

```json
{
  "success": true,
  "data": {
    "date": "2026-05-25",
    "headline": "A Florida man taught squirrels to water-ski…",
    "content": "A Florida man taught squirrels to water-ski, …",
    "story_slugs": ["slug-a", "slug-b", "…"],
    "top_tags": ["florida-man", "animals", "weird"],
    "model": "groq/llama-3.3-70b-versatile",
    "generated_at": "2026-05-25T08:00:02.000Z"
  }
}
```

Returns `404` if no digest has been generated yet.

---

### `POST /api/digest/generate` _(backend)_

Manually trigger the Digest Agent. Useful for testing or backfilling a missed day.

```json
{ "success": true, "date": "2026-05-25" }
```
