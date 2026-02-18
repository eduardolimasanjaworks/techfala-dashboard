import { NextRequest, NextResponse } from 'next/server';
import { serverLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { level, message, error, context } = body;

    if (level === 'error') {
      serverLogger.error(message || 'Client error', error, context);
    } else if (level === 'warn') {
      serverLogger.warn(message || 'Client warning', context);
    } else {
      serverLogger.info(message || 'Client log', context);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging client error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
