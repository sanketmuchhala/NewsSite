import { NextRequest, NextResponse } from 'next/server';
import { NewsStoryScraper } from '@/lib/scrapers';
import { verifySessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  // Check authentication for admin-only operations
  const isAuthenticated = await verifySessionFromRequest(req);
  if (!isAuthenticated) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Unauthorized. Admin access required.',
        code: 'AUTH_REQUIRED'
      },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { maxPerSource = 10, timestamp } = body;

    console.log('Starting scraper via admin dashboard...', { 
      maxPerSource, 
      timestamp, 
      environment: process.env.NODE_ENV,
      hasDatabase: !!process.env.POSTGRES_URL,
      hasAI: !!process.env.GOOGLE_AI_API_KEY
    });

    // Check if database is available for Vercel deployment
    if (!process.env.POSTGRES_URL) {
      console.warn('No database connection available in production');
      return NextResponse.json({
        success: false,
        error: 'Database not configured',
        details: 'POSTGRES_URL environment variable is missing. Please configure your Vercel Postgres database.',
        code: 'DB_MISSING'
      }, { status: 503 });
    }

    const scraper = new NewsStoryScraper({
      reddit: {
        clientId: process.env.REDDIT_CLIENT_ID,
        clientSecret: process.env.REDDIT_CLIENT_SECRET,
      },
      twitter: {
        apiKey: process.env.TWITTER_API_KEY,
        apiSecret: process.env.TWITTER_API_SECRET,
      },
      rss: {
        feeds: process.env.RSS_FEEDS ? process.env.RSS_FEEDS.split(',') : [
          'https://feeds.theonion.com/onion/daily',
          'https://babylonbee.com/feeds/news'
        ],
      },
    });

    const results = await scraper.scrapeAll(maxPerSource);
    
    console.log('Scraping results:', results);
    
    if (results.total === 0) {
      return NextResponse.json({
        success: false,
        error: 'No content was scraped',
        details: 'All content sources failed to provide stories. This could be due to network issues or API limits.',
        results: results,
        code: 'NO_CONTENT'
      }, { status: 200 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Scraping completed: ${results.success} stories saved, ${results.failed} failed`,
      results: results,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Scraping failed:', error);
    
    // Provide more specific error information
    let errorDetails = 'Unknown error occurred';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error.message?.includes('ENOTFOUND')) {
      errorDetails = 'Network connectivity issue. Unable to reach content sources.';
      errorCode = 'NETWORK_ERROR';
    } else if (error.message?.includes('timeout')) {
      errorDetails = 'Request timeout. Content sources took too long to respond.';
      errorCode = 'TIMEOUT_ERROR';
    } else if (error.message?.includes('Database')) {
      errorDetails = 'Database connection or query failed.';
      errorCode = 'DATABASE_ERROR';
    } else {
      errorDetails = error.message || errorDetails;
    }
    
    return NextResponse.json({ 
      success: false,
      error: 'Scraping failed', 
      details: errorDetails,
      code: errorCode,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}