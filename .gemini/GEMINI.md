# Project context: Funny News Aggregator
Goal: Modern, clean Reddit/HN-like site focused on funny/absurd news. Keep existing Next.js 14/Vercel infra, kill all audio code, keep vis-network graph.

Design: Linear/Vercel aesthetic. Inter font, shadcn/ui, rounded corners, subtle shadows, real spacing, dark/light modes. Loading skeletons, error boundaries.

Data model:
- news_stories(id, title, url UNIQUE, source, published_at, summary, funny_score, tags[], upvotes, scraped_at)
- story_relationships(source_id, target_id, relationship_type['similar','follow_up','related'], strength DECIMAL(3,2))

Pages: /, /graph, /story/[id], /trending, /sources

Scrapers: Reddit (r/nottheonion, r/funny, r/NewsOfTheStupid), X/Twitter hashtags (if creds exist), RSS (The Onion, Babylon Bee, local oddities). Prefer Reddit+RSS if X creds absent.

Constraints:
- TypeScript strict.
- Keep Vercel Postgres connection + existing API patterns.
- Use vis-network for graph.
- Add funny-score algorithm, voting, comments (simple).
- No audio components left anywhere.
