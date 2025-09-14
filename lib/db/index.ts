import { sql } from '@vercel/postgres';
import { Sound, SoundRelationship, ScrapingJob, PaginatedResponse } from '@/types';

export async function initializeDatabase() {
  try {
    const schema = await import('./schema.sql');
    await sql`${schema}`;
    console.log('Database initialized successfully');
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
  try {
    const offset = (page - 1) * limit;

    let query = sql`
      SELECT *,
        (SELECT COUNT(*) FROM sounds WHERE 1=1
    `;

    let whereConditions = [];

    if (tags && tags.length > 0) {
      whereConditions.push(sql`tags && ${tags}`);
    }

    if (sourceType) {
      whereConditions.push(sql`source_type = ${sourceType}`);
    }

    if (search) {
      whereConditions.push(sql`(title ILIKE ${`%${search}%`} OR description ILIKE ${`%${search}%`})`);
    }

    if (whereConditions.length > 0) {
      query = sql`${query} AND ${sql.join(whereConditions, sql` AND `)}`;
    }

    query = sql`${query}
      ) as total_count
      FROM sounds
      WHERE 1=1
    `;

    if (whereConditions.length > 0) {
      query = sql`${query} AND ${sql.join(whereConditions, sql` AND `)}`;
    }

    query = sql`${query}
      ORDER BY weirdness_score DESC, created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const result = await query;
    const sounds = result.rows as (Sound & { total_count: number })[];
    const totalCount = sounds.length > 0 ? sounds[0].total_count : 0;

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
  try {
    const result = await sql`
      SELECT * FROM sounds WHERE id = ${id}
    `;

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
  try {
    const result = await sql`
      SELECT * FROM sounds
      WHERE weirdness_score >= 7.0
      ORDER BY RANDOM()
      LIMIT 1
    `;

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
  try {
    const result = await sql`
      INSERT INTO sounds (title, source_url, source_type, duration, tags, description, thumbnail_url, metadata, weirdness_score)
      VALUES (${sound.title}, ${sound.source_url}, ${sound.source_type}, ${sound.duration || null}, ${sound.tags}, ${sound.description || null}, ${sound.thumbnail_url || null}, ${JSON.stringify(sound.metadata)}, ${sound.weirdness_score})
      RETURNING *
    `;

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
  try {
    const [soundsResult, relationshipsResult] = await Promise.all([
      sql`
        SELECT * FROM sounds
        WHERE id IN (
          SELECT DISTINCT sound_id_1 FROM sound_relationships
          UNION
          SELECT DISTINCT sound_id_2 FROM sound_relationships
        )
        ORDER BY weirdness_score DESC
        LIMIT 100
      `,
      sql`
        SELECT * FROM sound_relationships
        WHERE strength >= 3.0
        ORDER BY strength DESC
        LIMIT 200
      `
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
    const result = await sql`
      INSERT INTO sound_relationships (sound_id_1, sound_id_2, relationship_type, strength)
      VALUES (${soundId1}, ${soundId2}, ${relationshipType}, ${strength})
      ON CONFLICT (sound_id_1, sound_id_2, relationship_type)
      DO UPDATE SET strength = EXCLUDED.strength
      RETURNING *
    `;

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
    const result = await sql`
      INSERT INTO scraping_jobs (source, query)
      VALUES (${source}, ${query})
      RETURNING *
    `;

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
    const setClause = Object.entries(updates)
      .map(([key, value]) => `${key} = ${value === null ? 'NULL' : `'${value}'`}`)
      .join(', ');

    if (updates.status === 'running' && !updates.started_at) {
      updates.started_at = new Date().toISOString();
    }

    if (updates.status === 'completed' || updates.status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }

    const result = await sql`
      UPDATE scraping_jobs
      SET ${sql.raw(setClause)}
      WHERE id = ${id}
      RETURNING *
    `;

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