import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { COOKIE_NAME } from '@/lib/auth';

const publicPaths = ['/login'];
const publicApiPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/log',
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isPublicApiPath(pathname: string): boolean {
  return publicApiPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  const value =
    process.env.NODE_ENV === 'production' && (!secret || secret.length < 32)
      ? null
      : secret && secret.length >= 32
        ? secret
        : 'dev-secret-min-32-chars-change-in-prod';
  if (!value) throw new Error('JWT_SECRET required in production');
  return new TextEncoder().encode(value);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (pathname.startsWith('/api/') && isPublicApiPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    try {
      await jwtVerify(token, getSecret(), { maxTokenAge: '7d' });
    } catch {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    if (token) {
      try {
        await jwtVerify(token, getSecret(), { maxTokenAge: '7d' });
        return NextResponse.redirect(new URL('/', request.url));
      } catch {
        // token inválido, deixa seguir para login
      }
    }
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, getSecret(), { maxTokenAge: '7d' });
  } catch {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
