import { NextResponse } from 'next/server';

export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    deployment: {
      vercel: !!process.env.VERCEL,
      region: process.env.VERCEL_REGION,
      url: process.env.VERCEL_URL
    },
    database: {
      configured: !!process.env.POSTGRES_URL,
      has_prisma_url: !!process.env.POSTGRES_PRISMA_URL,
      has_non_pooling: !!process.env.POSTGRES_URL_NON_POOLING
    },
    ai: {
      gemini_configured: !!process.env.GOOGLE_AI_API_KEY
    },
    scraper: {
      reddit_configured: !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET),
      twitter_configured: !!(process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET),
      rss_feeds: process.env.RSS_FEEDS ? process.env.RSS_FEEDS.split(',').length : 0
    },
    auth: {
      admin_configured: !!(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD),
      session_secret_configured: !!process.env.SESSION_SECRET
    },
    version: '1.0.0'
  };

  return NextResponse.json(healthCheck);
}