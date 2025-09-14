
import { NextRequest, NextResponse } from 'next/server';
import { NewsStoryScraper } from '@/lib/scrapers';

export async function POST(req: NextRequest) {
  const { maxPerSource } = (await req.json()) || { maxPerSource: 10 };

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
      feeds: process.env.RSS_FEEDS ? process.env.RSS_FEEDS.split(',') : [],
    },
  });

  try {
    await scraper.scrapeAll(maxPerSource);
    return NextResponse.json({ message: 'Scraping initiated successfully' });
  } catch (error: any) {
    console.error('Scraping failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
