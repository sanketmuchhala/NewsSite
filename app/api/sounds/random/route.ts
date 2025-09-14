import { NextResponse } from 'next/server';
import { getRandomSound } from '@/lib/db';

export async function GET() {
  try {
    const result = await getRandomSound();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
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