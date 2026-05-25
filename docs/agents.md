# Agent Reference

FunnyNews runs four autonomous agents inside the Railway backend container. Each has a distinct responsibility and produces persisted output that downstream agents and the frontend consume.

---

## 1. Scrape Agent

**File:** [`backend/src/scrapers/index.ts`](../backend/src/scrapers/index.ts)  
**Trigger:** `node-cron` on `SCRAPE_CRON` schedule (default: every 2 hours)  
**Manual trigger:** `POST /api/scrape`

### What it does

1. Creates a `feed_runs` document in Firestore with `status: "running"`.
2. Runs three scrapers in parallel: RSS, Reddit, and Hacker News.
3. For each raw story, checks Firestore for a matching URL slug — duplicates are skipped.
4. Calls `enhanceWithAI()` on new stories (see LLMClient below).
5. Writes each enriched story to the `stories` collection via `adminUpsertStory`.
6. Tracks slugs of newly-saved stories, then calls the **Relationship Agent**.
7. Updates the `feed_runs` doc to `status: "done"` with counts.

### AI enhancement

```ts
const [{ text: summary, model }, tags, funnyScore] = await Promise.all([
  llmClient.generateSummary(title, source, tags, articleText),
  llmClient.generateTags(title, source, articleText),
  llmClient.calculateFunnyScore(title, source, articleText, tags),
]);
```

If AI enhancement fails, the story is still saved with `needs_reprocess: true` so it can be queued for retry.

### Scrapers

| Scraper | Source | Dedup key |
|---|---|---|
| `RssScraper` | 30+ RSS feeds (The Onion, Babylon Bee, r/nottheonion RSS, etc.) | `rss_guid` or URL |
| `RedditScraper` | Reddit OAuth API — funny/weird subreddits | `reddit_id` |
| `HackerNewsScraper` | Algolia HN search API | `hn_id` |

### FeedRun document

Every scrape produces a record in `feed_runs`:

```
{
  started_at: Timestamp,
  finished_at: Timestamp,
  status: "running" | "done" | "failed",
  sources_tried: number,
  stories_found: number,
  stories_saved: number,
  stories_failed: number,
  ai_enhanced: number,
  errors: string[]
}
```

View recent runs: `GET /api/scrape/runs`

---

## 2. Relationship Agent

**File:** [`backend/src/ai/relationship-agent.ts`](../backend/src/ai/relationship-agent.ts)  
**Trigger:** Called automatically by the Scrape Agent after each batch save  
**No extra LLM calls** — pure algorithmic scoring

### Scoring formula

```
score = tagOverlap × 0.4  +  titleWordOverlap × 0.3  +  sameSource × 0.3
```

- **Tag overlap** — Jaccard similarity over `tags[]` arrays.  
- **Title word overlap** — Jaccard similarity over significant title words (stop-words excluded).  
- **Same source** — binary: 0 or 0.3.

Pairs with `score < 0.3` are discarded. Pairs above the threshold are written to the `story_relationships` collection with a deterministic doc ID:

```ts
docId = [slugA, slugB].sort().join('__')
```

This means re-running on the same pair is always an idempotent upsert.

### Relationship types

| Condition | Type |
|---|---|
| `score ≥ 0.7` | `similar` |
| `sameSource && score ≥ 0.4` | `follow_up` |
| anything else above threshold | `related` |

### Graph read path

`GET /api/graph` and `app/api/graph/route.ts` both read directly from `story_relationships` instead of computing edges on every request. This makes the graph load O(1) regardless of story count.

---

## 3. Digest Agent

**File:** [`backend/src/ai/digest-agent.ts`](../backend/src/ai/digest-agent.ts)  
**Trigger:** `node-cron` on `DIGEST_CRON` schedule (default: `0 8 * * *` — 8 AM daily)  
**Manual trigger:** `POST /api/digest/generate`

### What it does

1. Loads the top 200 stories sorted by `funny_score DESC`.
2. Filters to stories published in the **last 48 hours**.
3. Takes the top 8. Falls back to top 8 overall if fewer than 3 recent stories exist.
4. Calls `llmClient.generateSummary()` with a custom prompt asking for a 3-sentence deadpan roundup.
5. Extracts the first sentence as `headline`.
6. Writes the result to `digests/YYYY-MM-DD` in Firestore.

### Prompt template

```
You are the editor of a deadpan absurdist news digest. Write exactly 3 punchy sentences
that summarize today's most ridiculous stories. Be dry and witty, not silly.
Treat the absurdity as completely normal.

Today's top stories:
1. "Title" (Source) — summary...
...
```

### Digest document

```
digests/YYYY-MM-DD = {
  headline: string,        // first sentence extracted from content
  content: string,         // full 3-sentence prose
  story_slugs: string[],   // slugs of the 8 source stories
  top_tags: string[],      // union of their tags (max 8)
  model: string,           // e.g. "groq/llama-3.3-70b-versatile"
  generated_at: Timestamp
}
```

The homepage `DigestCard` component reads the latest digest via `GET /api/digest` and renders it as an amber-bordered card above the featured story. It links directly to the top story slugs.

---

## 4. LLMClient

**File:** [`backend/src/ai/llm.ts`](../backend/src/ai/llm.ts)  
**Pattern:** Groq primary → Gemini fallback  
**Used by:** Scrape Agent and Digest Agent

### Why Groq?

[Groq](https://groq.com) runs Llama 3.3 70B on custom LPU hardware and offers a generous free tier. In benchmarks it returns responses ~5× faster than Gemini for the same model quality — important when enhancing 50–100 stories per scrape cycle.

### Fallback logic

```ts
const groqText = await this.groqChat(prompt);
if (groqText) return { text: groqText, model: 'groq/llama-3.3-70b-versatile' };

// Gemini fallback
const geminiText = await geminiClient.generateNewsStoryAnalysis(...);
return { text: geminiText, model: 'gemini-2.0-flash' };
```

If `GROQ_API_KEY` is not set, the client logs a warning and uses Gemini exclusively. The `ai_model` field on each story records which model actually generated its summary.

### Methods

| Method | Groq params | Purpose |
|---|---|---|
| `generateSummary(title, source, tags, content)` | temp 0.8, 700 tokens | 5–7 sentence deadpan summary |
| `generateTags(title, source, content?)` | temp 0.3, 60 tokens | 3–5 lowercase topic tags |
| `calculateFunnyScore(title, source, content?, tags?)` | temp 0.2, 6 tokens | Integer 1–100 absurdity score |

---

## Cron Schedule Reference

Defined in [`backend/src/cron.ts`](../backend/src/cron.ts). Both schedules validate via `cron.validate()` before registering — an invalid pattern is logged and disabled rather than crashing.

| Env var | Default | Meaning |
|---|---|---|
| `SCRAPE_CRON` | `0 */2 * * *` | Every 2 hours |
| `DIGEST_CRON` | `0 8 * * *` | Daily at 8:00 AM UTC |
| `SCRAPE_MAX_PER_SOURCE` | `15` | Max stories pulled per source per run |

Set either to an empty string to disable that job without breaking the other.
