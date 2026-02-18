import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/** Lista usuários ativos (id, nome) para seleção (ex: gerente do projeto). Requer sessão. */
export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, cargo: true },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error listing users for selection', error);
    return NextResponse.json({ error: 'Erro ao listar usuários' }, { status: 500 });
  }
}
