
     CREATE TABLE IF NOT EXISTS news_stories (
       id SERIAL PRIMARY KEY,
       title TEXT NOT NULL,
       url TEXT NOT NULL UNIQUE,
       source TEXT NOT NULL,
       published_at TIMESTAMP NULL,
       summary TEXT NULL,
       funny_score INTEGER DEFAULT 0,
       tags TEXT[] DEFAULT '{}',
       upvotes INTEGER DEFAULT 0,
       scraped_at TIMESTAMP DEFAULT NOW()
     );

     CREATE TABLE IF NOT EXISTS story_relationships (
       source_id INTEGER REFERENCES news_stories(id) ON DELETE CASCADE,
       target_id INTEGER REFERENCES news_stories(id) ON DELETE CASCADE,
       relationship_type TEXT,
       strength DECIMAL(3,2)
     );
