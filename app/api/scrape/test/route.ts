import { NextResponse } from 'next/server';
import { RssScraper } from '@/lib/scrapers/rss';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Scraper API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}

// Debug: test RSS scraping without saving to Firestore
export async function POST() {
  try {
    const scraper = new RssScraper();
    const feeds = scraper.getFeedUrls();
    console.log(`Testing ${feeds.length} RSS feeds…`);

    const stories = await scraper.parseAllFeeds(2);

    const bySource: Record<string, number> = {};
    for (const s of stories) {
      bySource[s.source] = (bySource[s.source] ?? 0) + 1;
    }

    return NextResponse.json({
      success: true,
      total: stories.length,
      feeds: feeds.length,
      bySource,
      sample: stories.slice(0, 5).map(s => ({
        title: s.title,
        source: s.source,
        tags: s.tags,
        category: s.category,
        funny_score: s.funny_score,
      })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
