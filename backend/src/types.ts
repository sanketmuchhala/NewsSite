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
  source: string;
  source_type: SourceType;
  category: string;
  feed_url: string | null;
  rss_guid: string | null;
  reddit_id: string | null;
  reddit_permalink: string | null;
  hn_id: string | null;

  // AI / scoring
  tags: string[];
  funny_score: number;
  quality_score: number;
  ai_summary: boolean;
  ai_model: string | null;
  ai_version: number;
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

export type Digest = {
  date: string;           // YYYY-MM-DD (also the Firestore doc ID)
  headline: string;
  content: string;
  story_slugs: string[];
  top_tags: string[];
  model: string;
  generated_at: Date | null;
};

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

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
