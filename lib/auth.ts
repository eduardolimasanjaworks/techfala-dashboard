import { SignJWT, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 dias em segundos

export type SessionPayload = {
  userId: string;
  email: string;
  nome: string;
  cargo: string;
  exp?: number;
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.length < 32) {
      throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres em produção (defina em .env)');
    }
  }
  const value = secret && secret.length >= 32 ? secret : 'dev-secret-min-32-chars-change-in-prod';
  return new TextEncoder().encode(value);
}

/** Gera um JWT para o usuário (uso em login/register). */
export async function createToken(payload: Omit<SessionPayload, 'exp'>): Promise<string> {
  const secret = getSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret);
}

/** Verifica o JWT e retorna o payload (uso em API routes e middleware). */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret, {
      maxTokenAge: `${MAX_AGE}s`,
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Lê o cookie de sessão da request. */
export function getSessionCookie(request: NextRequest): string | null {
  const cookie = request.cookies.get(COOKIE_NAME);
  return cookie?.value ?? null;
}

/** Retorna a sessão atual a partir da request (para API routes). Retorna null se inválida. */
export async function getSession(request: NextRequest): Promise<SessionPayload | null> {
  const token = getSessionCookie(request);
  if (!token) return null;
  return verifyToken(token);
}

/** Resposta 401 padrão para APIs. */
export function unauthorized() {
  return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
}

/** Opções do cookie de sessão (httpOnly, secure em prod). */
export function getSessionCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE,
  };
}

export { COOKIE_NAME, MAX_AGE };
