import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';
import { logActivity } from '@/lib/activity-log';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pipelineId } = await params;
    const pipeline = await prisma.pipeline.findUnique({ where: { id: pipelineId } });
    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline não encontrado' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const nome = typeof body.nome === 'string' && body.nome.trim()
      ? body.nome.trim()
      : 'Nova coluna';
    const cor = typeof body.cor === 'string' && body.cor.trim() ? body.cor.trim() : '#1b064b';
    const corFonte = typeof body.corFonte === 'string' && body.corFonte.trim() ? body.corFonte.trim() : '#ffffff';
    const responsavelNome = typeof body.responsavelNome === 'string' ? body.responsavelNome : null;

    const maxOrdem = await prisma.column.aggregate({
      where: { pipelineId },
      _max: { ordem: true },
    });
    const ordem = (maxOrdem._max.ordem ?? -1) + 1;

    const column = await prisma.column.create({
      data: { pipelineId, nome, ordem, cor, corFonte },
    });

    await logActivity({
      request,
      projectId: pipeline.projectId,
      action: 'column_created',
      details: { nome: column.nome, columnId: column.id, pipelineId },
    });

    return NextResponse.json({
      id: column.id,
      nome: column.nome,
      ordem: column.ordem,
      cor: column.cor ?? undefined,
      corFonte: column.corFonte ?? undefined,
      responsavelNome: column.responsavelNome ?? undefined,
      tasks: [],
    });
  } catch (error) {
    serverLogger.error('Error creating column', error, { route: '/api/pipelines/[id]/columns', method: 'POST' });
    return NextResponse.json({ error: 'Falha ao criar coluna' }, { status: 500 });
  }
}
