export type ContentStatus = 'ok' | 'paywall' | 'empty' | 'bot_blocked' | 'unknown';
export type SourceType = 'rss' | 'reddit' | 'hackernews' | 'api' | 'manual';

export type NewsStory = {
  // Identity — Firestore doc ID, human-readable URL slug
  slug: string;

  // Core content
  url: string;
  title: string;
  summary: string | null;
  content: string | null;
  author: string | null;
  image_url: string | null;

  // Source metadata (flat — no more metadata blob)
  source: string;               // Display name, e.g. "The Onion", "r/FloridaMan"
  source_type: SourceType;
  category: string;             // 'satire' | 'weird' | 'tech' | 'weed' | 'science' | …
  feed_url: string | null;      // RSS: the feed URL this came from
  rss_guid: string | null;      // RSS: item GUID for dedup
  reddit_id: string | null;     // Reddit: post ID
  reddit_permalink: string | null;
  hn_id: string | null;         // HN: Algolia objectID

  // AI / scoring
  tags: string[];
  funny_score: number;          // 1–100 calibrated score
  quality_score: number;        // 0–100 (reserved for future use)
  ai_summary: boolean;          // true if summary was AI-generated
  ai_model: string | null;      // e.g. 'gemini-2.0-flash'
  ai_version: number;           // prompt version; used for reprocess queue

  // Agent work-queue flag
  needs_reprocess: boolean;

  // Engagement
  upvotes: number;
  downvotes: number;
  view_count: number;

  // Status
  content_status: ContentStatus;

  // Timestamps
  published_at: string | Date | null;
  scraped_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
};

// ── Feed source registry ─────────────────────────────────────────────────────

export type Source = {
  id: string;
  url: string;
  name: string;
  type: SourceType;
  category: string;
  enabled: boolean;
  consecutive_failures: number;
  last_scraped: Date | null;
  last_error: string | null;
  stories_30d: number;
  avg_funny_score: number;
  created_at: Date | null;
  updated_at: Date | null;
};

// ── Daily digest ─────────────────────────────────────────────────────────────

export type Digest = {
  date: string;           // YYYY-MM-DD
  headline: string;
  content: string;
  story_slugs: string[];
  top_tags: string[];
  model: string;
  generated_at: Date | null;
};

// ── Scrape run log ───────────────────────────────────────────────────────────

export type FeedRun = {
  id?: string;
  started_at: Date | null;
  finished_at: Date | null;
  status: 'running' | 'done' | 'failed';
  sources_tried: number;
  stories_found: number;
  stories_saved: number;
  stories_failed: number;
  ai_enhanced: number;
  errors: string[];
};

// ── Story graph ──────────────────────────────────────────────────────────────

export type StoryRelationship = {
  source_id: string;      // slug of origin story
  target_id: string;      // slug of target story
  relationship_type: 'similar' | 'follow_up' | 'related' | 'contradicts' | 'updates';
  strength: number;
  created_at?: Date;
};

// ── API response shapes ───────────────────────────────────────────────────────

export type PaginatedResponse<T> = {
  success: boolean;
  data?: T[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  error?: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ── Graph visualization ───────────────────────────────────────────────────────

export type GraphNode = {
  id: string;
  label: string;
  title: string;
  color: string;
  size: number;
  font: { size: number };
  story: NewsStory;
};

export type GraphEdge = {
  from: string;
  to: string;
  label: string;
  color: string;
  width: number;
  font: { size: number };
  relationship?: StoryRelationship;
};

export type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};
