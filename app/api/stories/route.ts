import { NextRequest, NextResponse } from 'next/server';
import { adminGetStories, adminGetStoriesBySource } from '@/lib/firebase/firestore-admin';
import { NewsStory } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pageSize = Math.min(500, parseInt(searchParams.get('pageSize') || '100'));
  const source = searchParams.get('source');
  const sortBy = (searchParams.get('sortBy') || searchParams.get('sort') || 'created_at') as
    'created_at' | 'upvotes' | 'funny_score';

  try {
    const result = source && source !== 'all'
      ? await adminGetStoriesBySource(source, pageSize)
      : await adminGetStories(pageSize, ['scraped_at', 'upvotes', 'funny_score'].includes(sortBy)
          ? sortBy as 'scraped_at' | 'upvotes' | 'funny_score'
          : 'scraped_at');

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        page: 1,
        pageSize,
        total: result.data?.length ?? 0,
        hasMore: (result.data?.length ?? 0) === pageSize,
      },
    });
  } catch (error) {
    console.error('Stories API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const story = (await req.json()) as Omit<NewsStory, 'id' | 'created_at' | 'updated_at' | 'scraped_at'>;
  try {
    const { adminUpsertStory } = await import('@/lib/firebase/firestore-admin');
    const id = Date.now().toString(36);
    const result = await adminUpsertStory(id, story);
    if (result.success) {
      return NextResponse.json({ success: true, data: { id } }, { status: 201 });
    }
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  } catch (error) {
    console.error('Create story error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
