import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Scraper API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: !!process.env.POSTGRES_URL,
    ai_enabled: !!process.env.GOOGLE_AI_API_KEY
  });
}

export async function POST() {
  try {
    // Simple test scraper that just returns mock data
    const mockResults = {
      success: 3,
      failed: 0,
      total: 3
    };
    
    return NextResponse.json({
      success: true,
      message: 'Test scraper completed successfully',
      results: mockResults,
      note: 'This is a test endpoint. Use /api/scrape/run for actual scraping (requires admin auth).'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Test scraper failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}