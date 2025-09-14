import { NextRequest, NextResponse } from 'next/server';
import { getSounds, createSound } from '@/lib/db';
import { Sound } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const sourceType = searchParams.get('source') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await getSounds(page, limit, tags, sourceType, search);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.title || !body.source_url || !body.source_type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, source_url, source_type' },
        { status: 400 }
      );
    }

    // Validate source_type
    if (!['youtube', 'freesound', 'archive'].includes(body.source_type)) {
      return NextResponse.json(
        { error: 'Invalid source_type. Must be youtube, freesound, or archive' },
        { status: 400 }
      );
    }

    const soundData: Omit<Sound, 'id' | 'created_at'> = {
      title: body.title,
      source_url: body.source_url,
      source_type: body.source_type,
      duration: body.duration,
      tags: body.tags || [],
      description: body.description,
      thumbnail_url: body.thumbnail_url,
      metadata: body.metadata || {},
      weirdness_score: body.weirdness_score || 5.0,
    };

    const result = await createSound(soundData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}