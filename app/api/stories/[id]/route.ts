import { NextRequest, NextResponse } from 'next/server';
import { adminGetStoryById } from '@/lib/firebase/firestore-admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ success: false, error: 'Invalid story ID' }, { status: 400 });
  }

  try {
    const result = await adminGetStoryById(id);
    if (result.success && result.data) {
      return NextResponse.json({ success: true, data: result.data });
    }
    return NextResponse.json({ success: false, error: 'Story not found' }, { status: 404 });
  } catch (error) {
    console.error('Get story error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
