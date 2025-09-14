-- Sounds table for storing sound metadata
CREATE TABLE IF NOT EXISTS sounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    source_url TEXT NOT NULL UNIQUE,
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('youtube', 'freesound', 'archive')),
    duration INTEGER, -- in seconds
    tags TEXT[] DEFAULT '{}',
    description TEXT,
    thumbnail_url TEXT,
    metadata JSONB DEFAULT '{}',
    weirdness_score FLOAT DEFAULT 5.0 CHECK (weirdness_score >= 0 AND weirdness_score <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sound relationships for graph visualization
CREATE TABLE IF NOT EXISTS sound_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sound_id_1 UUID NOT NULL REFERENCES sounds(id) ON DELETE CASCADE,
    sound_id_2 UUID NOT NULL REFERENCES sounds(id) ON DELETE CASCADE,
    relationship_type VARCHAR(20) NOT NULL CHECK (relationship_type IN ('similar', 'tag_match', 'sequence', 'remix')),
    strength FLOAT NOT NULL DEFAULT 1.0 CHECK (strength >= 0 AND strength <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sound_id_1, sound_id_2, relationship_type)
);

-- Scraping jobs for tracking automated scraping
CREATE TABLE IF NOT EXISTS scraping_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(20) NOT NULL CHECK (source IN ('youtube', 'freesound', 'archive')),
    query TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    results_count INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sounds_source_type ON sounds(source_type);
CREATE INDEX IF NOT EXISTS idx_sounds_tags ON sounds USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_sounds_weirdness_score ON sounds(weirdness_score DESC);
CREATE INDEX IF NOT EXISTS idx_sounds_created_at ON sounds(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sound_relationships_sound_ids ON sound_relationships(sound_id_1, sound_id_2);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_sounds_updated_at
    BEFORE UPDATE ON sounds
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();