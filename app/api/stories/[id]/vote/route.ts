import { NextRequest, NextResponse } from 'next/server';
import { adminIncrementVotes } from '@/lib/firebase/firestore-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { vote_type } = await request.json();

    if (!['upvote', 'downvote'].includes(vote_type)) {
      return NextResponse.json({ success: false, error: 'Invalid vote type' }, { status: 400 });
    }

    const delta = vote_type === 'upvote' ? 1 : -1;
    const result = await adminIncrementVotes(params.id, delta);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { vote_type } });
  } catch (error) {
    console.error('Voting error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
