export interface Sound {
  id: string;
  title: string;
  source_url: string;
  source_type: 'youtube' | 'freesound' | 'archive';
  duration?: number;
  tags: string[];
  description?: string;
  thumbnail_url?: string;
  metadata: {
    youtube_id?: string;
    freesound_id?: number;
    archive_id?: string;
    start_time?: number;
    end_time?: number;
    author?: string;
    license?: string;
  };
  created_at: string;
  weirdness_score: number;
}

export interface SoundRelationship {
  id: string;
  sound_id_1: string;
  sound_id_2: string;
  relationship_type: 'similar' | 'tag_match' | 'sequence' | 'remix';
  strength: number;
  created_at: string;
}

export interface GraphNode {
  id: string;
  label: string;
  title: string;
  color: string;
  size: number;
  sound: Sound;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  color: string;
  width: number;
  relationship: SoundRelationship;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ScrapingJob {
  id: string;
  source: 'youtube' | 'freesound' | 'archive';
  query: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results_count: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}