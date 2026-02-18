import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';

/** Lista cards (tasks) e pipelines que estão na lixeira deste projeto. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const allPipelines = await prisma.pipeline.findMany({
      where: { projectId },
      include: {
        colunas: {
          include: {
            tasks: {
              where: { deletedAt: { not: null } },
              include: {
                column: { select: { id: true, nome: true, pipeline: { select: { id: true, nome: true } } } },
              },
              orderBy: { deletedAt: 'desc' },
            },
          },
        },
      },
    });
    const pipelinesWithTasks = allPipelines.filter((p: { deletedAt?: Date | null }) => p.deletedAt == null);
    const deletedPipelines = allPipelines.filter((p: { deletedAt?: Date | null }) => p.deletedAt != null);

    const tasks: {
      id: string;
      titulo: string;
      descricao?: string;
      deletedAt: string;
      columnId: string;
      columnNome: string;
      pipelineId: string;
      pipelineNome: string;
    }[] = [];
    for (const p of pipelinesWithTasks) {
      for (const col of p.colunas) {
        for (const t of col.tasks) {
          tasks.push({
            id: t.id,
            titulo: t.titulo,
            descricao: t.descricao ?? undefined,
            deletedAt: t.deletedAt!.toISOString(),
            columnId: t.columnId,
            columnNome: t.column.nome,
            pipelineId: t.column.pipeline.id,
            pipelineNome: t.column.pipeline.nome,
          });
        }
      }
    }
    tasks.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

    const pipelines = deletedPipelines.map((p: { id: string; nome: string; deletedAt?: Date | null }) => ({
      id: p.id,
      nome: p.nome,
      deletedAt: (p.deletedAt instanceof Date ? p.deletedAt : new Date()).toISOString(),
    }));

    return NextResponse.json({ tasks, pipelines });
  } catch (error) {
    serverLogger.error('Error fetching trash', error, { route: '/api/projects/[id]/trash', method: 'GET' });
    return NextResponse.json({ error: 'Falha ao carregar lixeira' }, { status: 500 });
  }
}
