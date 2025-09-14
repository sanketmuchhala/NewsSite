import { NextRequest, NextResponse } from 'next/server';
import { getSoundById } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getSoundById(params.id);

    if (!result.success) {
      const status = result.error === 'Sound not found' ? 404 : 500;
      return NextResponse.json(
        { error: result.error },
        { status }
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