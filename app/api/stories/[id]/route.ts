import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { NewsStory } from '@/types';

// Same mock data used by the main stories route
const MOCK_STORIES: NewsStory[] = [
  {
    id: 1,
    title: 'Florida Man Arrested for Teaching Squirrels to Water Ski',
    url: 'https://www.reddit.com/r/FloridaMan/comments/example1/',
    source: 'Reddit - r/FloridaMan',
    source_type: 'reddit',
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    summary: 'Local authorities were baffled when they discovered a makeshift water skiing course in a man\'s backyard, complete with tiny life jackets designed for squirrels.',
    funny_score: 95,
    upvotes: 1247,
    view_count: 15420,
    tags: ['florida-man', 'bizarre', 'animals', 'wtf'],
    image_url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400',
    created_at: new Date(),
  },
  {
    id: 2,
    title: "Local Man's 'Emotional Support Peacock' Denied Entry to Walmart",
    url: 'https://www.theonion.com/local-mans-emotional-support-peacock-denied-entry-walmart',
    source: 'The Onion',
    source_type: 'rss',
    published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    summary: "Store manager reportedly cited 'health code violations' and 'excessive feather shedding' as reasons for the denial.",
    funny_score: 87,
    upvotes: 892,
    view_count: 8930,
    tags: ['onion', 'satire', 'walmart', 'animals'],
    created_at: new Date(),
  },
  {
    id: 3,
    title: 'Scientists Discover That Procrastination Gene Will Be Studied Later',
    url: 'https://babylonbee.com/news/scientists-discover-procrastination-gene-will-be-studied-later',
    source: 'Babylon Bee',
    source_type: 'rss',
    published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    summary: 'Researchers announced they have identified the genetic marker responsible for procrastination, but the peer review process has been postponed indefinitely.',
    funny_score: 82,
    upvotes: 2103,
    view_count: 12450,
    tags: ['babylon-bee', 'satire', 'science', 'humor'],
    created_at: new Date(),
  },
  {
    id: 4,
    title: "Woman Sues Neighbor Over 'Aggressively Cheerful' Morning Greetings",
    url: 'https://www.reddit.com/r/nottheonion/comments/example2/',
    source: 'Reddit - r/nottheonion',
    source_type: 'reddit',
    published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    summary: "The plaintiff claims her neighbor's enthusiastic 'Good morning, sunshine!' greetings at 6 AM constitute emotional distress and noise pollution.",
    funny_score: 74,
    upvotes: 567,
    view_count: 4200,
    tags: ['nottheonion', 'lawsuit', 'neighbors', 'absurd'],
    created_at: new Date(),
  },
  {
    id: 5,
    title: "Mayor Declares Official City Mascot to Be 'That One Pigeon Everyone Likes'",
    url: 'https://www.upi.com/Odd_News/2024/mayor-declares-city-mascot-pigeon-everyone-likes/',
    source: 'UPI Odd News',
    source_type: 'rss',
    published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    summary: "The pigeon, nicknamed 'Frank' by locals, was chosen after a heated town hall debate about municipal representation and bird rights.",
    funny_score: 91,
    upvotes: 1456,
    view_count: 9870,
    tags: ['weird', 'government', 'animals', 'politics'],
    created_at: new Date(),
  },
  {
    id: 6,
    title: 'Breaking: Area Man Finally Wins Argument with GPS Navigation System',
    url: 'https://www.clickhole.com/breaking-area-man-finally-wins-argument-gps-navigation-system/',
    source: 'ClickHole',
    source_type: 'rss',
    published_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    summary: 'After three years of heated debates about the fastest route to work, local resident emerges victorious when GPS finally admits it was wrong about the construction on Highway 9.',
    funny_score: 88,
    upvotes: 2890,
    view_count: 18350,
    tags: ['clickhole', 'satire', 'technology', 'victory'],
    created_at: new Date(),
  },
  {
    id: 7,
    title: "Local Library Bans Books That Are 'Too Heavy' for Patrons to Lift",
    url: 'https://www.reddit.com/r/offbeat/comments/example3/',
    source: 'Reddit - r/offbeat',
    source_type: 'reddit',
    published_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    summary: 'Citing safety concerns, the library has implemented a strict 2-pound weight limit on all books.',
    funny_score: 79,
    upvotes: 654,
    view_count: 5670,
    tags: ['offbeat', 'library', 'safety', 'books'],
    created_at: new Date(),
  },
  {
    id: 8,
    title: "Man Calls 911 to Complain About McDonald's Ice Cream Machine Being Broken",
    url: 'https://www.reddit.com/r/NewsOfTheStupid/comments/example4/',
    source: "Reddit - r/NewsOfTheStupid",
    source_type: 'reddit',
    published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    summary: 'Emergency services were not amused by the urgent ice cream situation.',
    funny_score: 85,
    upvotes: 1432,
    view_count: 12890,
    tags: ['stupid', 'mcdonalds', 'ice-cream', '911'],
    created_at: new Date(),
  },
  {
    id: 9,
    title: 'Town Declares War on Aggressive Geese, Forms Citizen Militia',
    url: 'https://www.reddit.com/r/WTF/comments/example5/',
    source: 'Reddit - r/WTF',
    source_type: 'reddit',
    published_at: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    summary: 'Local park visitors have organized into defensive formations against the waterfowl menace.',
    funny_score: 93,
    upvotes: 2847,
    view_count: 19450,
    tags: ['wtf', 'geese', 'militia', 'park'],
    created_at: new Date(),
  },
  {
    id: 10,
    title: "Politician Promises 'Free Lunch' and Literally Brings Sandwiches to Rally",
    url: 'https://www.satirewire.com/news/politician-promises-free-lunch-literally-brings-sandwiches/',
    source: 'SatireWire',
    source_type: 'rss',
    published_at: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(),
    summary: 'Voters were confused but appreciative when the candidate showed up with actual sandwiches.',
    funny_score: 76,
    upvotes: 892,
    view_count: 7234,
    tags: ['politics', 'literal', 'sandwiches', 'rally'],
    created_at: new Date(),
  },
];

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);

  if (isNaN(id)) {
    return NextResponse.json({ success: false, error: 'Invalid story ID' }, { status: 400 });
  }

  if (!process.env.POSTGRES_URL) {
    const story = MOCK_STORIES.find((s) => s.id === id);
    if (story) {
      return NextResponse.json({ success: true, data: story });
    }
    // Generate a generic mock if the ID is outside our hardcoded list
    const fallback: NewsStory = {
      id,
      title: `Funny News Story #${id}: Something Hilariously Absurd Happened`,
      url: `https://example.com/story/${id}`,
      source: 'The Internet',
      source_type: 'rss',
      published_at: new Date(Date.now() - id * 2 * 60 * 60 * 1000).toISOString(),
      summary: 'This is a placeholder story. Connect a database to see real content.',
      funny_score: Math.min(60 + (id % 40), 100),
      upvotes: 100 + (id * 17) % 1000,
      view_count: 1000 + (id * 53) % 10000,
      tags: ['mock', 'demo', 'funny'],
      created_at: new Date(),
    };
    return NextResponse.json({ success: true, data: fallback });
  }

  try {
    const result = await sql`SELECT * FROM news_stories WHERE id = ${id}`;
    if (result.rows[0]) {
      return NextResponse.json({ success: true, data: result.rows[0] as NewsStory });
    }
    return NextResponse.json({ success: false, error: 'Story not found' }, { status: 404 });
  } catch (error) {
    console.error('Get story error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
