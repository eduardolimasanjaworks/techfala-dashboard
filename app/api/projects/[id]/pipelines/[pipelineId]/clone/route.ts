import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';
import { logActivity } from '@/lib/activity-log';

/** Clona um pipeline (colunas + tasks + subtasks) no mesmo projeto */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pipelineId: string }> }
) {
  try {
    const { id: projectId, pipelineId } = await params;
    const body = await request.json().catch(() => ({}));
    const newNome = typeof body.nome === 'string' && body.nome.trim()
      ? body.nome.trim()
      : 'Cópia';

    const source = await prisma.pipeline.findFirst({
      where: { id: pipelineId, projectId },
      include: {
        colunas: {
          include: {
            tasks: {
              where: { deletedAt: null },
              include: {
                subtasks: { orderBy: { id: 'asc' } },
              },
              orderBy: { id: 'asc' },
            },
          },
          orderBy: { ordem: 'asc' },
        },
      },
    });

    if (!source) {
      return NextResponse.json({ error: 'Pipeline não encontrado' }, { status: 404 });
    }

    const newPipeline = await prisma.pipeline.create({
      data: {
        projectId,
        nome: `${source.nome} (cópia)`,
        ...(newNome !== 'Cópia' && { nome: newNome }),
      },
    });

    const columnIdMap = new Map<string, string>();

    for (const col of source.colunas) {
      const newCol = await prisma.column.create({
        data: {
          pipelineId: newPipeline.id,
          nome: col.nome,
          ordem: col.ordem,
          cor: col.cor ?? undefined,
          corFonte: col.corFonte ?? undefined,
          responsavelNome: col.responsavelNome ?? undefined,
        },
      });
      columnIdMap.set(col.id, newCol.id);

      for (const task of col.tasks) {
        const newTask = await prisma.task.create({
          data: {
            columnId: newCol.id,
            epicId: task.epicId ?? undefined,
            titulo: task.titulo,
            descricao: task.descricao ?? undefined,
            dataVencimento: task.dataVencimento ?? undefined,
            dataCriacao: task.dataCriacao || new Date().toISOString().split('T')[0],
            prioridade: task.prioridade ?? undefined,
            tags: task.tags ?? undefined,
            responsavelNome: task.responsavelNome ?? undefined,
            responsavelAvatar: task.responsavelAvatar ?? undefined,
            subtasks: task.subtasks?.length
              ? {
                  create: task.subtasks.map((s) => ({
                    titulo: s.titulo,
                    concluida: s.concluida,
                    dataVencimento: s.dataVencimento ?? undefined,
                    responsavelNome: (s as any).responsavelNome ?? undefined,
                  })),
                }
              : undefined,
          },
        });
      }
    }

    await logActivity({
      request,
      projectId,
      action: 'pipeline_cloned',
      details: { sourcePipelineId: pipelineId, newPipelineId: newPipeline.id },
    });

    const created = await prisma.pipeline.findUnique({
      where: { id: newPipeline.id },
      include: {
        colunas: {
          include: {
            tasks: {
              include: { subtasks: { orderBy: { id: 'asc' } } },
              orderBy: { id: 'asc' },
            },
          },
          orderBy: { ordem: 'asc' },
        },
      },
    });

    const transformCol = (col: any) => ({
      id: col.id,
      nome: col.nome,
      ordem: col.ordem,
      cor: col.cor ?? undefined,
      corFonte: col.corFonte ?? undefined,
      responsavelNome: col.responsavelNome ?? undefined,
      tasks: (col.tasks ?? []).map((t: any) => ({
        id: t.id,
        titulo: t.titulo,
        descricao: t.descricao || undefined,
        prioridade: t.prioridade || undefined,
        responsavel: t.responsavelNome ? { nome: t.responsavelNome } : undefined,
        subtasks: (t.subtasks ?? []).map((s: any) => ({
          id: s.id,
          titulo: s.titulo,
          concluida: s.concluida,
        })),
      })),
    });

    return NextResponse.json({
      id: created!.id,
      nome: created!.nome,
      colunas: created!.colunas.map(transformCol),
    });
  } catch (error) {
    serverLogger.error('Error cloning pipeline', error, { route: '/api/projects/[id]/pipelines/[pipelineId]/clone' });
    return NextResponse.json({ error: 'Erro ao clonar pipeline' }, { status: 500 });
  }
}
