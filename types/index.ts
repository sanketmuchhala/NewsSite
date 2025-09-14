export type NewsStory = {
  id?: number;
  title: string;
  url: string;
  source: string;
  published_at?: string | Date | null;
  summary?: string | null;
  content?: string | null;
  author?: string | null;
  funny_score?: number;
  tags: string[];
  upvotes?: number;
  downvotes?: number;
  view_count?: number;
  image_url?: string | null;
  source_type?: 'reddit' | 'twitter' | 'rss' | 'api' | 'manual';
  metadata?: any;
  scraped_at?: string | Date | null;
  created_at?: Date;
  updated_at?: Date;
};

export type StoryVote = {
  id?: number;
  story_id: number;
  ip_address: string;
  vote_type: 'upvote' | 'downvote';
  created_at?: Date;
};

export type StoryComment = {
  id?: number;
  story_id: number;
  parent_id?: number | null;
  author_name?: string | null;
  author_email?: string | null;
  content: string;
  upvotes?: number;
  is_flagged?: boolean;
  ip_address: string;
  created_at?: Date;
};

export type StoryRelationship = {
  id?: number;
  source_id: number;
  target_id: number;
  relationship_type: 'similar' | 'follow_up' | 'related' | 'contradicts' | 'updates';
  strength: number;
  created_at?: Date;
};

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

// Graph visualization types
export type GraphNode = {
  id: number;
  label: string;
  title: string;
  color: string;
  size: number;
  font: { size: number };
  story: NewsStory;
};

export type GraphEdge = {
  from: number;
  to: number;
  label: string;
  color: string;
  width: number;
  font: { size: number };
  relationship: StoryRelationship;
};

export type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};
