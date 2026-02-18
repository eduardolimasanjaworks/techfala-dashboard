import { NextRequest, NextResponse } from 'next/server';
import { getSession, unauthorized } from './auth';

/** Exige sessão com cargo admin. Retorna [session] ou [null, response] para retornar ao cliente. */
export async function requireAdmin(request: NextRequest): Promise<
  [{ userId: string; email: string; nome: string; cargo: string }, null] | [null, NextResponse]
> {
  const session = await getSession(request);
  if (!session) {
    return [null, unauthorized()];
  }
  if (session.cargo !== 'admin') {
    return [null, NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 })];
  }
  return [session, null];
}
