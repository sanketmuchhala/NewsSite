
import { sql } from '@vercel/postgres';
import { NewsStory } from '@/types';

export async function createStory(
  story: Omit<NewsStory, 'id' | 'created_at' | 'updated_at' | 'scraped_at'>
): Promise<{ success: boolean; data?: NewsStory; error?: string }> {
  if (!process.env.POSTGRES_URL) {
    return {
      success: false,
      error: 'Database not available',
    };
  }

  try {
    const publishedAt = story.published_at ? new Date(story.published_at).toISOString() : null;
    
    const result = await sql`
      INSERT INTO news_stories (title, url, source, published_at, summary, funny_score, tags, upvotes)
      VALUES (${story.title}, ${story.url}, ${story.source}, ${publishedAt}, ${story.summary}, ${story.funny_score || 50}, ARRAY[${story.tags?.join(',') || ''}]::text[], ${story.upvotes || 0})
      ON CONFLICT (url) DO NOTHING
      RETURNING *
    `;

    return {
      success: true,
      data: result.rows[0] as NewsStory,
    };
  } catch (error) {
    console.error('Error creating story:', error);
    return {
      success: false,
      error: 'Failed to create story',
    };
  }
}

export async function getStories(
  page: number,
  pageSize: number
): Promise<{ success: boolean; data?: NewsStory[]; error?: string }> {
  if (!process.env.POSTGRES_URL) {
    return {
      success: false,
      error: 'Database not available',
    };
  }

  try {
    const offset = (page - 1) * pageSize;
    const result = await sql`
      SELECT * FROM news_stories
      ORDER BY published_at DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;

    return {
      success: true,
      data: result.rows as NewsStory[],
    };
  } catch (error) {
    console.error('Error getting stories:', error);
    return {
      success: false,
      error: 'Failed to fetch stories',
    };
  }
}

export async function createStoryRelationship(
  sourceId: number,
  targetId: number,
  type: 'similar' | 'follow_up' | 'related',
  strength: number
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.POSTGRES_URL) {
    return {
      success: false,
      error: 'Database not available',
    };
  }

  try {
    await sql`
      INSERT INTO story_relationships (source_id, target_id, relationship_type, strength)
      VALUES (${sourceId}, ${targetId}, ${type}, ${strength})
      ON CONFLICT (source_id, target_id) DO UPDATE SET
        relationship_type = EXCLUDED.relationship_type,
        strength = EXCLUDED.strength
    `;

    return { success: true };
  } catch (error) {
    console.error('Error creating story relationship:', error);
    return {
      success: false,
      error: 'Failed to create relationship',
    };
  }
}

export async function voteStory(
  id: number,
  delta: number
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.POSTGRES_URL) {
    return {
      success: false,
      error: 'Database not available',
    };
  }

  try {
    await sql`
      UPDATE news_stories
      SET upvotes = upvotes + ${delta}
      WHERE id = ${id}
    `;

    return { success: true };
  } catch (error) {
    console.error('Error voting on story:', error);
    return {
      success: false,
      error: 'Failed to vote on story',
    };
  }
}

export async function getGraphData(): Promise<{ 
  success: boolean; 
  data?: { stories: NewsStory[]; relationships: any[] }; 
  error?: string 
}> {
  if (!process.env.POSTGRES_URL) {
    // Generate comprehensive mock graph data using the same stories from the API
    const mockStories = [
      {
        id: 1,
        title: "Florida Man Arrested for Teaching Squirrels to Water Ski",
        url: "https://www.reddit.com/r/FloridaMan/comments/example1/florida_man_arrested_teaching_squirrels_water_ski/",
        source: "Reddit - r/FloridaMan",
        source_type: "reddit",
        published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        summary: "Local authorities were baffled when they discovered a makeshift water skiing course in a man's backyard, complete with tiny life jackets designed for squirrels.",
        funny_score: 95,
        upvotes: 1247,
        view_count: 15420,
        tags: ["florida-man", "bizarre", "animals", "wtf"],
        created_at: new Date()
      },
      {
        id: 2,
        title: "Local Man's 'Emotional Support Peacock' Denied Entry to Walmart",
        url: "https://www.theonion.com/local-mans-emotional-support-peacock-denied-entry-walmart",
        source: "The Onion",
        source_type: "rss",
        published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        summary: "Store manager reportedly cited 'health code violations' and 'excessive feather shedding' as reasons for the denial.",
        funny_score: 87,
        upvotes: 892,
        view_count: 8930,
        tags: ["onion", "satire", "walmart", "animals"],
        created_at: new Date()
      },
      {
        id: 3,
        title: "Scientists Discover That Procrastination Gene Will Be Studied Later",
        url: "https://babylonbee.com/news/scientists-discover-procrastination-gene-will-be-studied-later",
        source: "Babylon Bee",
        source_type: "rss",
        published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        summary: "Researchers announced they have identified the genetic marker responsible for procrastination, but the peer review process has been postponed indefinitely.",
        funny_score: 82,
        upvotes: 2103,
        view_count: 12450,
        tags: ["babylon-bee", "satire", "science", "humor"],
        created_at: new Date()
      },
      {
        id: 4,
        title: "Woman Sues Neighbor Over 'Aggressively Cheerful' Morning Greetings",
        url: "https://www.reddit.com/r/nottheonion/comments/example2/woman_sues_neighbor_aggressively_cheerful_morning/",
        source: "Reddit - r/nottheonion",
        source_type: "reddit",
        published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        summary: "The plaintiff claims her neighbor's enthusiastic 'Good morning, sunshine!' greetings at 6 AM constitute emotional distress and noise pollution.",
        funny_score: 74,
        upvotes: 567,
        view_count: 4200,
        tags: ["nottheonion", "lawsuit", "neighbors", "absurd"],
        created_at: new Date()
      },
      {
        id: 5,
        title: "Mayor Declares Official City Mascot to Be 'That One Pigeon Everyone Likes'",
        url: "https://www.upi.com/Odd_News/2024/mayor-declares-city-mascot-pigeon-everyone-likes/",
        source: "UPI Odd News",
        source_type: "rss",
        published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        summary: "The pigeon, nicknamed 'Frank' by locals, was chosen after a heated town hall debate about municipal representation and bird rights.",
        funny_score: 91,
        upvotes: 1456,
        view_count: 9870,
        tags: ["weird", "government", "animals", "politics"],
        created_at: new Date()
      },
      {
        id: 6,
        title: "Breaking: Area Man Finally Wins Argument with GPS Navigation System",
        url: "https://www.clickhole.com/breaking-area-man-finally-wins-argument-gps-navigation-system/",
        source: "ClickHole",
        source_type: "rss",
        published_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
        summary: "After three years of heated debates about the fastest route to work, local resident emerges victorious when GPS finally admits it was wrong about the construction on Highway 9.",
        funny_score: 88,
        upvotes: 2890,
        view_count: 18350,
        tags: ["clickhole", "satire", "technology", "victory"],
        created_at: new Date()
      },
      {
        id: 7,
        title: "Local Library Bans Books That Are 'Too Heavy' for Patrons to Lift",
        url: "https://www.reddit.com/r/offbeat/comments/example3/local_library_bans_books_too_heavy_patrons/",
        source: "Reddit - r/offbeat",
        source_type: "reddit",
        published_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        summary: "Citing safety concerns, the library has implemented a strict 2-pound weight limit on all books.",
        funny_score: 79,
        upvotes: 654,
        view_count: 5670,
        tags: ["offbeat", "library", "safety", "books"],
        created_at: new Date()
      },
      {
        id: 8,
        title: "Man Calls 911 to Complain About McDonald's Ice Cream Machine Being Broken",
        url: "https://www.reddit.com/r/NewsOfTheStupid/comments/example4/man_calls_911_complain_mcdonalds_ice_cream_machine/",
        source: "Reddit - r/NewsOfTheStupid",
        source_type: "reddit",
        published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        summary: "Emergency services were not amused by the 'urgent' ice cream situation.",
        funny_score: 85,
        upvotes: 1432,
        view_count: 12890,
        tags: ["stupid", "mcdonalds", "ice-cream", "911"],
        created_at: new Date()
      },
      {
        id: 9,
        title: "Town Declares War on Aggressive Geese, Forms Citizen Militia",
        url: "https://www.reddit.com/r/WTF/comments/example5/town_declares_war_on_aggressive_geese_forms_militia/",
        source: "Reddit - r/WTF",
        source_type: "reddit",
        published_at: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
        summary: "Local park visitors have organized into defensive formations against the waterfowl menace.",
        funny_score: 93,
        upvotes: 2847,
        view_count: 19450,
        tags: ["wtf", "geese", "militia", "park"],
        created_at: new Date()
      },
      {
        id: 10,
        title: "Politician Promises 'Free Lunch' and Literally Brings Sandwiches to Rally",
        url: "https://www.satirewire.com/news/politician-promises-free-lunch-literally-brings-sandwiches/",
        source: "SatireWire",
        source_type: "rss",
        published_at: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(),
        summary: "Voters were confused but appreciative when the candidate showed up with actual sandwiches.",
        funny_score: 76,
        upvotes: 892,
        view_count: 7234,
        tags: ["politics", "literal", "sandwiches", "rally"],
        created_at: new Date()
      }
    ];
    
    // Generate more realistic relationships between stories
    const mockRelationships = [
      { source_id: 1, target_id: 4, relationship_type: "similar", strength: 0.8 }, // Both absurd legal situations
      { source_id: 2, target_id: 5, relationship_type: "related", strength: 0.7 }, // Both involve animals in public spaces
      { source_id: 3, target_id: 6, relationship_type: "follow_up", strength: 0.6 }, // Both about delayed/postponed things
      { source_id: 7, target_id: 8, relationship_type: "similar", strength: 0.75 }, // Both involve public service complaints
      { source_id: 1, target_id: 9, relationship_type: "related", strength: 0.65 }, // Both involve unusual animal situations
      { source_id: 4, target_id: 8, relationship_type: "similar", strength: 0.7 }, // Both involve unreasonable complaints
      { source_id: 5, target_id: 10, relationship_type: "related", strength: 0.6 }, // Both involve government/politics
      { source_id: 2, target_id: 7, relationship_type: "contradicts", strength: 0.4 }, // Public spaces: animals vs books
      { source_id: 6, target_id: 8, relationship_type: "similar", strength: 0.55 }, // Both involve technology frustrations
      { source_id: 3, target_id: 10, relationship_type: "related", strength: 0.5 }, // Both satirical content
    ];
    
    return {
      success: true,
      data: { stories: mockStories as NewsStory[], relationships: mockRelationships }
    };
  }

  try {
    const storiesResult = await sql`
      SELECT * FROM news_stories 
      ORDER BY created_at DESC 
      LIMIT 50
    `;
    
    const relationshipsResult = await sql`
      SELECT * FROM story_relationships
      LIMIT 100
    `;

    return {
      success: true,
      data: {
        stories: storiesResult.rows as NewsStory[],
        relationships: relationshipsResult.rows
      }
    };
  } catch (error) {
    console.error('Error getting graph data:', error);
    return {
      success: false,
      error: 'Failed to fetch graph data',
    };
  }
}
