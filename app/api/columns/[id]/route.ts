import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';
import { logActivity } from '@/lib/activity-log';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.column.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    serverLogger.error('Error deleting column', error, { route: '/api/columns/[id]', method: 'DELETE' });
    return NextResponse.json({ error: 'Falha ao excluir coluna' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let columnId = '';
  try {
    const { id } = await params;
    columnId = id;
    const body = await request.json().catch(() => ({}));
    const { nome, ordem, cor, corFonte, responsavelNome } = body;

    const data: { nome?: string; ordem?: number; cor?: string; corFonte?: string; responsavelNome?: string | null } = {};
    if (typeof nome === 'string' && nome.trim()) data.nome = nome.trim();
    if (typeof ordem === 'number' && ordem >= 0) data.ordem = ordem;
    if (typeof cor === 'string' && cor.trim()) data.cor = cor.trim();
    if (typeof corFonte === 'string' && corFonte.trim()) data.corFonte = corFonte.trim();
    if (responsavelNome !== undefined) data.responsavelNome = responsavelNome === null || responsavelNome === '' ? null : String(responsavelNome);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    const columnBefore = await prisma.column.findUnique({ where: { id: columnId }, include: { pipeline: true } });
    const column = await prisma.column.update({
      where: { id: columnId },
      data,
    });

    if (data.nome && columnBefore && columnBefore.nome !== data.nome) {
      await logActivity({
        request,
        projectId: columnBefore.pipeline.projectId,
        action: 'column_renamed',
        details: { nome: data.nome, columnId, nomeAnterior: columnBefore.nome },
      });
    }

    return NextResponse.json({
      id: column.id,
      nome: column.nome,
      ordem: column.ordem,
      cor: column.cor ?? undefined,
      corFonte: column.corFonte ?? undefined,
      responsavelNome: column.responsavelNome ?? undefined,
    });
  } catch (error: unknown) {
    const prismaError = error as { code?: string; meta?: unknown };
    if (prismaError?.code === 'P2025') {
      return NextResponse.json({ error: 'Coluna não encontrada' }, { status: 404 });
    }
    const errMsg = error instanceof Error ? error.message : String(error);
    serverLogger.error('Error updating column', error, { route: '/api/columns/[id]', method: 'PATCH', columnId });
    return NextResponse.json(
      { error: 'Falha ao atualizar coluna', details: process.env.NODE_ENV === 'development' ? errMsg : undefined },
      { status: 500 }
    );
  }
}
