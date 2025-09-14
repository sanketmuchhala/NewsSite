import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const isValid = await verifySessionFromRequest(request);
    
    return NextResponse.json({
      success: true,
      authenticated: isValid
    });
    
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json({
      success: false,
      authenticated: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}