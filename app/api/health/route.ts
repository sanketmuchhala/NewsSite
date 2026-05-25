import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    deployment: {
      vercel: !!process.env.VERCEL,
      region: process.env.VERCEL_REGION || null,
      url: process.env.VERCEL_URL || null,
    },
    services: {
      firestore: !!process.env.FIREBASE_PROJECT_ID,
      gemini: !!process.env.GEMINI_API_KEY,
      reddit: !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET),
    },
    version: '2.0.0',
  });
}
