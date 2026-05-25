import { NextResponse } from 'next/server';
import { adminGetLatestDigest } from '@/lib/firebase/firestore-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await adminGetLatestDigest();
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 404 });
  return NextResponse.json({ success: true, data: result.data });
}
