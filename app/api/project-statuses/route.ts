import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const statuses = await prisma.projectStatus.findMany({
      orderBy: { ordem: 'asc' },
    });
    return NextResponse.json(statuses);
  } catch (error) {
    serverLogger.error('Error fetching project statuses', error, { route: '/api/project-statuses', method: 'GET' });
    return NextResponse.json({ error: 'Erro ao listar status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { nome, cor, ordem } = body;

    if (!nome?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const maxOrd = await prisma.projectStatus.aggregate({ _max: { ordem: true } });
    const nextOrd = (maxOrd._max.ordem ?? -1) + 1;

    const status = await prisma.projectStatus.create({
      data: {
        nome: nome.trim(),
        cor: cor || '#8B5CF6',
        ordem: ordem ?? nextOrd,
      },
    });
    return NextResponse.json(status);
  } catch (error) {
    serverLogger.error('Error creating project status', error, { route: '/api/project-statuses', method: 'POST' });
    return NextResponse.json({ error: 'Erro ao criar status' }, { status: 500 });
  }
}
