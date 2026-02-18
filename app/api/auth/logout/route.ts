import { NextResponse } from 'next/server';
import { COOKIE_NAME, getSessionCookieOptions } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ message: 'Logout realizado' });
  response.cookies.set(COOKIE_NAME, '', {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
