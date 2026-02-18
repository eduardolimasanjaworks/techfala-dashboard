import { NextRequest, NextResponse } from 'next/server';
import { getSession, unauthorized } from '@/lib/auth';

/** Retorna o usuário atual a partir do cookie de sessão (para o cliente saber quem está logado). */
export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return unauthorized();
  }
  return NextResponse.json({
    user: {
      id: session.userId,
      email: session.email,
      nome: session.nome,
      cargo: session.cargo,
    },
  });
}
