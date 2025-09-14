import { NextRequest, NextResponse } from 'next/server';
import { getStories, createStory } from '@/lib/db';
import { NewsStory, PaginatedResponse } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '12');
  const source = searchParams.get('source');
  const sortBy = searchParams.get('sortBy') || 'created_at';
  
  try {
    // If no database connection, return mock data
    if (!process.env.POSTGRES_URL) {
      console.log('No database connection, returning mock data');
      const mockStories = generateMockStories(pageSize);
      
      const response: PaginatedResponse<NewsStory> = {
        success: true,
        data: mockStories,
        pagination: {
          page,
          pageSize,
          total: 50, // Mock total
          totalPages: Math.ceil(50 / pageSize),
          hasMore: page < Math.ceil(50 / pageSize)
        }
      };
      
      return NextResponse.json(response);
    }
    
    const result = await getStories(page, pageSize);

    if (result.success && result.data) {
      const response: PaginatedResponse<NewsStory> = {
        success: true,
        data: result.data,
        pagination: {
          page,
          pageSize,
          total: result.data.length, // This should be actual total from DB
          totalPages: Math.ceil(result.data.length / pageSize),
          hasMore: result.data.length === pageSize // Simple heuristic
        }
      };
      
      return NextResponse.json(response);
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to fetch stories'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Stories API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const story = (await req.json()) as Omit<NewsStory, 'id'>;
  
  try {
    const result = await createStory(story);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to create story'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Create story error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Generate mock stories for demonstration
function generateMockStories(count: number): NewsStory[] {
  const mockStories: NewsStory[] = [
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
      image_url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400",
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
    }
  ];
  
  // Generate additional mock stories if needed
  const additionalStories = [];
  const realArticles = [
    { url: 'https://www.reddit.com/r/offbeat/comments/example3/local_library_bans_books_too_heavy_patrons/', source: 'Reddit - r/offbeat', type: 'reddit' },
    { url: 'https://www.reddit.com/r/NewsOfTheStupid/comments/example4/man_calls_911_complain_mcdonalds_ice_cream_machine/', source: 'Reddit - r/NewsOfTheStupid', type: 'reddit' },
    { url: 'https://www.reddit.com/r/WTF/comments/example5/town_declares_war_on_aggressive_geese_forms_militia/', source: 'Reddit - r/WTF', type: 'reddit' },
    { url: 'https://www.satirewire.com/news/politician-promises-free-lunch-literally-brings-sandwiches/', source: 'SatireWire', type: 'rss' },
    { url: 'https://www.thebeaverton.com/local-man-discovers-lifehack-using-fork-eat-food/', source: 'The Beaverton', type: 'rss' },
    { url: 'https://www.newsthump.com/breaking-area-woman-finally-finds-perfect-netflix-show-watch/', source: 'NewsThump', type: 'rss' }
  ];
  
  for (let i = 7; i <= count && i <= 20; i++) {
    const sourceIndex = (i - 7) % realArticles.length;
    const selectedSource = realArticles[sourceIndex];
    
    additionalStories.push({
      id: i,
      title: `Mock Funny News Story #${i}: Something Hilariously Absurd Happened`,
      url: selectedSource.url,
      source: selectedSource.source,
      source_type: selectedSource.type as 'reddit' | 'rss',
      published_at: new Date(Date.now() - i * 2 * 60 * 60 * 1000).toISOString(),
      summary: `This is a mock summary for story ${i}. It describes something absolutely ridiculous that definitely happened and is totally not made up for demonstration purposes.`,
      funny_score: Math.floor(Math.random() * 40) + 60, // 60-100
      upvotes: Math.floor(Math.random() * 1000) + 100,
      view_count: Math.floor(Math.random() * 10000) + 1000,
      tags: ['mock', 'demo', 'funny', 'test'],
      created_at: new Date()
    });
  }
  
  return [...mockStories, ...additionalStories].slice(0, count);
}