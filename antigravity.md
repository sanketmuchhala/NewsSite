# Project Analysis & Future Scope

## Overview
This is a Next.js web application built as a "Funny News Aggregator." It relies on scrapers for Reddit, Twitter, and RSS feeds to pull in content. It currently uses `@vercel/postgres` for its database and relies on `vis-network` to render a relationship graph between stories.

## Known Issues

### 1. RSS Feeds Not Working
- The application uses `rss-parser` in `lib/scrapers/rss.ts` to fetch from feeds like The Onion, Babylon Bee, etc.
- **Problem:** Many modern RSS feeds block serverless IPs, have strict rate limits, or require different User-Agent headers. Currently, it seems no articles are being populated from these feeds successfully, potentially due to timeouts or blocked requests.

### 2. General Scraper Issues
- Scrapers (like Twitter/X) might be failing due to API changes or scraping protections. The Twitter scraper in particular might need authentication or a third-party API since raw scraping of Twitter is heavily restricted.

### 3. Reddit Link Redirection
- **Problem:** Currently, not a single Reddit link redirects to an actual post.
- **Root Cause Analysis:** In `lib/scrapers/reddit.ts`, the source URL is extracted as:
  ```typescript
  const sourceUrl = postData.url && !postData.url.includes('reddit.com') 
    ? postData.url 
    : `https://www.reddit.com${postData.permalink}`;
  ```
  This might be getting mangled in the UI, or the scraper is saving invalid data into the database. The actual redirection in the frontend also needs to be audited to ensure `_blank` target links are not being hijacked by Next.js routing.

---

## Future Scope / Roadmap

### 1. Database Migration: Firebase Integration
- **Goal:** Set up a free Firebase database (Firestore/Realtime DB) to store all stories, tags, and graph relationships.
- **Action Items:**
  - Remove `@vercel/postgres` dependency.
  - Add `firebase` and `firebase-admin` for server-side operations.
  - Update `lib/db` to use Firestore collections for `NewsStory`.
  - Rewrite the seed and migration scripts (`scripts/migrate-news.ts`).

### 2. Landing Page Revamp
- **Goal:** Create a stunning, high-quality landing page.
- **Action Items:**
  - Introduce rich aesthetics, vibrant colors, dark mode, glassmorphism, and dynamic micro-animations.
  - Make sure the UI feels responsive, alive, and very premium (avoiding generic bootstrap-like aesthetics).
  - Highlight trending funny stories with engaging cards and smooth hover effects.

### 3. Network Graph Improvements
- **Goal:** Enhance the "new page network graph" to be better, more accurate, and easily explorable.
- **Action Items:**
  - Review the implementation of `vis-network` (or switch to something more modern like React Force Graph).
  - Ensure the connections between nodes (tags, topics, stories) accurately reflect the data structure.
  - Add interactive features such as zooming, panning, node highlighting on hover, and clicking to open the respective story.

---
*Document created to track the current state and requested features.*
