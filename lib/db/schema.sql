-- News stories table for storing funny news articles
CREATE TABLE IF NOT EXISTS news_stories (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    summary TEXT,
    content TEXT, -- Full article content if scraped
    author TEXT,
    funny_score INTEGER DEFAULT 0 CHECK (funny_score >= 0 AND funny_score <= 100),
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    image_url TEXT,
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('reddit', 'twitter', 'rss', 'api', 'manual')),
    metadata JSONB DEFAULT '{}', -- Source-specific metadata
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Story relationships for network graph visualization
CREATE TABLE IF NOT EXISTS story_relationships (
    id SERIAL PRIMARY KEY,
    source_id INTEGER NOT NULL REFERENCES news_stories(id) ON DELETE CASCADE,
    target_id INTEGER NOT NULL REFERENCES news_stories(id) ON DELETE CASCADE,
    relationship_type VARCHAR(20) NOT NULL CHECK (relationship_type IN ('similar', 'follow_up', 'related', 'contradicts', 'updates')),
    strength DECIMAL(3,2) NOT NULL DEFAULT 1.0 CHECK (strength >= 0 AND strength <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_id, target_id, relationship_type)
);

-- User votes on stories
CREATE TABLE IF NOT EXISTS story_votes (
    id SERIAL PRIMARY KEY,
    story_id INTEGER NOT NULL REFERENCES news_stories(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(story_id, ip_address) -- One vote per IP per story
);

-- Comments on stories
CREATE TABLE IF NOT EXISTS story_comments (
    id SERIAL PRIMARY KEY,
    story_id INTEGER NOT NULL REFERENCES news_stories(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES story_comments(id) ON DELETE CASCADE,
    author_name VARCHAR(100),
    author_email VARCHAR(255),
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    is_flagged BOOLEAN DEFAULT FALSE,
    ip_address INET NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- News source credibility tracking
CREATE TABLE IF NOT EXISTS news_sources (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    domain TEXT NOT NULL UNIQUE,
    credibility_score INTEGER DEFAULT 50 CHECK (credibility_score >= 0 AND credibility_score <= 100),
    bias_rating VARCHAR(20) DEFAULT 'center' CHECK (bias_rating IN ('left', 'lean-left', 'center', 'lean-right', 'right')),
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('satire', 'news', 'blog', 'social', 'aggregator')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scraping jobs for tracking automated news scraping
CREATE TABLE IF NOT EXISTS scraping_jobs (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL CHECK (source IN ('reddit', 'twitter', 'rss', 'guardian_api', 'news_api')),
    query TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    results_count INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_news_stories_source_type ON news_stories(source_type);
CREATE INDEX IF NOT EXISTS idx_news_stories_tags ON news_stories USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_news_stories_funny_score ON news_stories(funny_score DESC);
CREATE INDEX IF NOT EXISTS idx_news_stories_upvotes ON news_stories(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_news_stories_created_at ON news_stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_stories_published_at ON news_stories(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_stories_source ON news_stories(source);
CREATE INDEX IF NOT EXISTS idx_story_relationships_ids ON story_relationships(source_id, target_id);
CREATE INDEX IF NOT EXISTS idx_story_votes_story_id ON story_votes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_story_id ON story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_news_sources_domain ON news_sources(domain);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_news_stories_updated_at
    BEFORE UPDATE ON news_stories
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();