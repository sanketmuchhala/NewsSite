# Phase 2 Plan: The Real "Funny News" Upgrade

This document outlines the implementation plan for Phase 2 of the Funny News Aggregator, addressing the core issues with automation, data storage, user interface authenticity, and network graph visualization.

## 1. Supabase Migration (from Vercel Postgres)
We are moving away from Vercel Postgres to Supabase for a more robust data backend and real-time capabilities if needed later.

- **Action:** Replace `@vercel/postgres` with `@supabase/supabase-js`.
- **Action:** Rewrite the `lib/db/index.ts` functions (`createStory`, `getStories`, `getGraphData`, etc.) to use the Supabase client.
- **Action:** Update the SQL schema (`lib/db/schema.sql`) to be compatible with Supabase conventions.
- **Action:** Update environment variables (`.env.local.template` and `.env.local`) to require `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## 2. Real Scrapers & Automation
The current scrapers are limiting themselves artificially and relying on basic keyword matching. We will enhance them to find *actually* funny content.

- **Reddit Enhancements:**
  - Remove the arbitrary `.slice(0, 5)` limit. Rotate through *all* funny subreddits randomly using real Reddit API logic.
  - Fix the keyword matching logic to ensure hilarious posts aren't dropped just because they lack the word "news".
- **RSS Enhancements:**
  - Aggressively poll true satirical networks (The Onion, Babylon Bee, ClickHole).
- **Stricter AI Bouncer:**
  - Update `lib/ai/gemini.ts` with a much stricter prompt for `calculateFunnyScore`.
  - In `lib/scrapers/index.ts`, enforce a strict rule: if `funny_score < 70`, the story is discarded and *not* saved to Supabase.

## 3. UI Tweaks: Authentic & Premium, Not "AI Generic"
Right now, the site looks like a typical generic AI-generated template (gradients everywhere, excessive "neon" aesthetics). We need a linear/vercel-like aesthetic: clean, real spacing, subtle shadows, modern typography (Inter).

- **Action:** Remove excessive `bg-gradient-to-br` hero sections in `app/page.tsx` and `app/graph/page.tsx`.
- **Action:** Go for a clean, minimalist monochrome look with high contrast (Shadcn UI default look, deep blacks/whites, strict borders).
- **Action:** Refactor `components/StoryCard.tsx` to use more subtle visual cues instead of neon badges. Let the funny content speak for itself.
- **Action:** Implement clean loading skeletons without excessive pulse animations.

## 4. Enhanced Network Graph
The vis-network graph currently just uses a fixed "funniest story" logic and doesn't connect stories in a meaningful way beyond basic properties.

- **Action:** Enrich the data model. `getGraphData` will pull relationships based on shared tags, identical source domains, and semantic similarity (generated during scraping).
- **Action:** Clean up the vis-network nodes in `components/NetworkGraph.tsx`. Make nodes look like clean, anti-aliased circles instead of neon glowing orbs.
- **Action:** Show tooltips on hover with more context (top tags, source) rather than relying on a heavy sidebar.

## Execution Steps
1. Make these changes locally.
2. Update environment variables for Supabase.
3. Test the scraper via `/api/scrape` endpoint.
4. Verify the UI and Graph.
5. Setup the actual cron in Vercel.
