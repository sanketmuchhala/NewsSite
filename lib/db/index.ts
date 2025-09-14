import { sql } from '@vercel/postgres';
import { Sound, SoundRelationship, ScrapingJob, PaginatedResponse } from '@/types';

export async function initializeDatabase() {
  try {
    // Database schema - run this manually or via external script
    // See lib/db/schema.sql for the complete schema
    console.log('Database should be initialized with schema.sql file');
    return { success: true };
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Sound operations
export async function getSounds(
  page: number = 1,
  limit: number = 20,
  tags?: string[],
  sourceType?: string,
  search?: string
): Promise<PaginatedResponse<Sound>> {
  // Return empty results during build time or if no database URL
  if (!process.env.POSTGRES_URL) {
    return {
      success: true,
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        hasMore: false
      }
    };
  }

  try {
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions: string[] = ['1=1'];
    const values: any[] = [];

    if (tags && tags.length > 0) {
      conditions.push(`tags && $${values.length + 1}`);
      values.push(tags);
    }

    if (sourceType) {
      conditions.push(`source_type = $${values.length + 1}`);
      values.push(sourceType);
    }

    if (search) {
      conditions.push(`(title ILIKE $${values.length + 1} OR description ILIKE $${values.length + 2})`);
      values.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.join(' AND ');

    // Get sounds with count
    const query = `
      SELECT *,
        (SELECT COUNT(*) FROM sounds WHERE ${whereClause}) as total_count
      FROM sounds
      WHERE ${whereClause}
      ORDER BY weirdness_score DESC, created_at DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

    values.push(limit, offset);

    const result = await sql.query(query, values);
    const sounds = result.rows as (Sound & { total_count: number })[];
    const totalCount = sounds.length > 0 ? parseInt(sounds[0].total_count.toString()) : 0;

    return {
      success: true,
      data: sounds.map(({ total_count, ...sound }) => sound),
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore: offset + sounds.length < totalCount
      }
    };
  } catch (error) {
    console.error('Error getting sounds:', error);
    return {
      success: false,
      error: 'Failed to fetch sounds'
    };
  }
}

export async function getSoundById(id: string): Promise<{ success: boolean; data?: Sound; error?: string }> {
  if (!process.env.POSTGRES_URL) {
    return {
      success: false,
      error: 'Database not available'
    };
  }

  try {
    const result = await sql.query('SELECT * FROM sounds WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Sound not found'
      };
    }

    return {
      success: true,
      data: result.rows[0] as Sound
    };
  } catch (error) {
    console.error('Error getting sound by ID:', error);
    return {
      success: false,
      error: 'Failed to fetch sound'
    };
  }
}

export async function getRandomSound(): Promise<{ success: boolean; data?: Sound; error?: string }> {
  // Return error if no database URL
  if (!process.env.POSTGRES_URL) {
    return {
      success: false,
      error: 'Database not available'
    };
  }

  try {
    const result = await sql.query(`
      SELECT * FROM sounds
      WHERE weirdness_score >= 7.0
      ORDER BY RANDOM()
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'No weird sounds found'
      };
    }

    return {
      success: true,
      data: result.rows[0] as Sound
    };
  } catch (error) {
    console.error('Error getting random sound:', error);
    return {
      success: false,
      error: 'Failed to fetch random sound'
    };
  }
}

export async function createSound(sound: Omit<Sound, 'id' | 'created_at'>): Promise<{ success: boolean; data?: Sound; error?: string }> {
  if (!process.env.POSTGRES_URL) {
    return {
      success: false,
      error: 'Database not available'
    };
  }

  try {
    const result = await sql.query(`
      INSERT INTO sounds (title, source_url, source_type, duration, tags, description, thumbnail_url, metadata, weirdness_score)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      sound.title,
      sound.source_url,
      sound.source_type,
      sound.duration || null,
      sound.tags,
      sound.description || null,
      sound.thumbnail_url || null,
      JSON.stringify(sound.metadata),
      sound.weirdness_score
    ]);

    return {
      success: true,
      data: result.rows[0] as Sound
    };
  } catch (error) {
    console.error('Error creating sound:', error);
    return {
      success: false,
      error: 'Failed to create sound'
    };
  }
}

// Graph operations
export async function getGraphData(): Promise<{ success: boolean; data?: { sounds: Sound[]; relationships: SoundRelationship[] }; error?: string }> {
  // Return empty results if no database URL
  if (!process.env.POSTGRES_URL) {
    return {
      success: true,
      data: {
        sounds: [],
        relationships: []
      }
    };
  }

  try {
    const [soundsResult, relationshipsResult] = await Promise.all([
      sql.query(`
        SELECT * FROM sounds
        WHERE id IN (
          SELECT DISTINCT sound_id_1 FROM sound_relationships
          UNION
          SELECT DISTINCT sound_id_2 FROM sound_relationships
        )
        ORDER BY weirdness_score DESC
        LIMIT 100
      `),
      sql.query(`
        SELECT * FROM sound_relationships
        WHERE strength >= 3.0
        ORDER BY strength DESC
        LIMIT 200
      `)
    ]);

    return {
      success: true,
      data: {
        sounds: soundsResult.rows as Sound[],
        relationships: relationshipsResult.rows as SoundRelationship[]
      }
    };
  } catch (error) {
    console.error('Error getting graph data:', error);
    return {
      success: false,
      error: 'Failed to fetch graph data'
    };
  }
}

export async function createSoundRelationship(
  soundId1: string,
  soundId2: string,
  relationshipType: SoundRelationship['relationship_type'],
  strength: number
): Promise<{ success: boolean; data?: SoundRelationship; error?: string }> {
  try {
    const result = await sql.query(`
      INSERT INTO sound_relationships (sound_id_1, sound_id_2, relationship_type, strength)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (sound_id_1, sound_id_2, relationship_type)
      DO UPDATE SET strength = EXCLUDED.strength
      RETURNING *
    `, [soundId1, soundId2, relationshipType, strength]);

    return {
      success: true,
      data: result.rows[0] as SoundRelationship
    };
  } catch (error) {
    console.error('Error creating sound relationship:', error);
    return {
      success: false,
      error: 'Failed to create relationship'
    };
  }
}

// Scraping job operations
export async function createScrapingJob(
  source: ScrapingJob['source'],
  query: string
): Promise<{ success: boolean; data?: ScrapingJob; error?: string }> {
  try {
    const result = await sql.query(`
      INSERT INTO scraping_jobs (source, query)
      VALUES ($1, $2)
      RETURNING *
    `, [source, query]);

    return {
      success: true,
      data: result.rows[0] as ScrapingJob
    };
  } catch (error) {
    console.error('Error creating scraping job:', error);
    return {
      success: false,
      error: 'Failed to create scraping job'
    };
  }
}

export async function updateScrapingJob(
  id: string,
  updates: Partial<Pick<ScrapingJob, 'status' | 'results_count' | 'error_message' | 'started_at' | 'completed_at'>>
): Promise<{ success: boolean; data?: ScrapingJob; error?: string }> {
  try {
    if (updates.status === 'running' && !updates.started_at) {
      updates.started_at = new Date().toISOString();
    }

    if (updates.status === 'completed' || updates.status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }

    const fields = Object.keys(updates);
    const values = Object.values(updates);

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const result = await sql.query(`
      UPDATE scraping_jobs
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `, [id, ...values]);

    return {
      success: true,
      data: result.rows[0] as ScrapingJob
    };
  } catch (error) {
    console.error('Error updating scraping job:', error);
    return {
      success: false,
      error: 'Failed to update scraping job'
    };
  }
}