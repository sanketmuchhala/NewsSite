import { NextRequest, NextResponse } from 'next/server';
import { NewsStoryScraper } from '@/lib/scrapers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, maxPerSource = 15 } = body;

    console.log('Starting news scraping job...', { source, maxPerSource });

    // Initialize scraper configuration
    const config = {
      reddit: {
        clientId: process.env.REDDIT_CLIENT_ID,
        clientSecret: process.env.REDDIT_CLIENT_SECRET,
      },
      twitter: {
        apiKey: process.env.TWITTER_API_KEY,
        apiSecret: process.env.TWITTER_API_SECRET,
      },
      rss: {
        feeds: undefined, // Will use default feeds
      },
    };

    const scraper = new NewsStoryScraper(config);

    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️ Gemini API key not found. AI enhancement will be limited.');
    }

    let results;
    
    if (source && source !== 'all') {
      // Scrape specific source
      switch (source) {
        case 'reddit':
          console.log('Scraping Reddit...');
          const redditStories = await scraper.scrapeReddit(maxPerSource);
          results = { reddit: redditStories.length, total: redditStories.length };
          break;
        case 'rss':
          console.log('Scraping RSS feeds...');
          const rssStories = await scraper.scrapeRSS(maxPerSource);
          results = { rss: rssStories.length, total: rssStories.length };
          break;
        case 'twitter':
          console.log('Scraping Twitter...');
          const twitterStories = await scraper.scrapeTwitter(maxPerSource);
          results = { twitter: twitterStories.length, total: twitterStories.length };
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid source. Use: reddit, rss, twitter, or all' },
            { status: 400 }
          );
      }
    } else {
      // Scrape all sources
      console.log('Scraping all sources...');
      results = await scraper.scrapeAll(maxPerSource);
    }

    return NextResponse.json({
      success: true,
      message: 'News scraping completed successfully',
      results: results,
      aiEnhanced: !!process.env.GEMINI_API_KEY,
    });
  } catch (error) {
    console.error('News scraping API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to scrape news stories', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');

    // Return scraper status and available sources
    const status = {
      success: true,
      message: 'News scraper API ready',
      availableSources: {
        reddit: {
          enabled: true,
          description: 'Funny news from various subreddits',
          subreddits: ['nottheonion', 'NewsOfTheStupid', 'FloridaMan', 'offbeat', 'WTF'],
          requiresAuth: !!process.env.REDDIT_CLIENT_ID,
        },
        rss: {
          enabled: true,
          description: 'Satirical and weird news from RSS feeds',
          feeds: ['The Onion', 'Babylon Bee', 'ClickHole', 'UPI Odd News'],
          requiresAuth: false,
        },
        twitter: {
          enabled: !!process.env.TWITTER_API_KEY,
          description: 'Funny news from Twitter',
          requiresAuth: true,
        },
      },
      aiEnhancement: {
        enabled: !!process.env.GEMINI_API_KEY,
        description: 'Google Gemini AI for content scoring and categorization',
      },
      database: {
        connected: !!process.env.POSTGRES_URL,
      },
    };

    if (source) {
      // Return specific source info
      const sourceInfo = status.availableSources[source as keyof typeof status.availableSources];
      if (!sourceInfo) {
        return NextResponse.json(
          { error: 'Invalid source' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        source: source,
        ...sourceInfo,
      });
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('News scraper GET API error:', error);
    return NextResponse.json(
      { error: 'Failed to get scraper status' },
      { status: 500 }
    );
  }
}