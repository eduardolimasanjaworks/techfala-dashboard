import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';
import { logActivity } from '@/lib/activity-log';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nome, colunas } = body;

    const pipelineBefore = await prisma.pipeline.findUnique({ where: { id } });
    if (!pipelineBefore) {
      return NextResponse.json({ error: 'Pipeline não encontrado' }, { status: 404 });
    }

    // Atualizar pipeline
    if (nome) {
      await prisma.pipeline.update({
        where: { id },
        data: { nome },
      });
      await logActivity({
        request,
        projectId: pipelineBefore.projectId,
        action: 'pipeline_updated',
        details: { nome, pipelineId: id, nomeAnterior: pipelineBefore.nome },
      });
    }

    // Atualizar colunas se fornecidas
    if (colunas) {
      // Deletar colunas antigas e criar novas
      await prisma.column.deleteMany({
        where: { pipelineId: id },
      });

      await prisma.column.createMany({
        data: colunas.map((col: { nome: string; ordem: number; tasks?: any[] }) => ({
          pipelineId: id,
          nome: col.nome,
          ordem: col.ordem,
        })),
      });

      // Recriar tasks nas novas colunas
      for (const col of colunas) {
        if (col.tasks && col.tasks.length > 0) {
          const column = await prisma.column.findFirst({
            where: { pipelineId: id, nome: col.nome },
          });

          if (column) {
            for (const task of col.tasks) {
              await prisma.task.create({
                data: {
                  columnId: column.id,
                  titulo: task.titulo,
                  descricao: task.descricao,
                  dataVencimento: task.dataVencimento,
                  dataCriacao: task.dataCriacao || new Date().toISOString().split('T')[0],
                  prioridade: task.prioridade,
                  tags: task.tags ? JSON.stringify(task.tags) : null,
                  responsavelNome: task.responsavel?.nome,
                  responsavelAvatar: task.responsavel?.avatar,
                  subtasks: task.subtasks
                    ? {
                        create: task.subtasks.map((s: any) => ({
                          titulo: s.titulo,
                          concluida: s.concluida || false,
                          dataVencimento: s.dataVencimento,
                          responsavelNome: s.responsavel?.nome,
                          responsavelAvatar: s.responsavel?.avatar,
                        })),
                      }
                    : undefined,
                },
              });
            }
          }
        }
      }
    }

    // Retornar pipeline atualizado
    const updated = await prisma.pipeline.findUnique({
      where: { id },
      include: {
        colunas: {
          include: {
            tasks: {
              where: { deletedAt: null },
              include: {
                subtasks: {
                  orderBy: { id: 'asc' },
                },
              },
              orderBy: { id: 'asc' },
            },
          },
          orderBy: { ordem: 'asc' },
        },
      },
    });

    if (!updated) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: updated.id,
      nome: updated.nome,
      colunas: updated.colunas.map((col) => ({
        id: col.id,
        nome: col.nome,
        ordem: col.ordem,
        cor: col.cor ?? undefined,
        corFonte: col.corFonte ?? undefined,
        responsavelNome: col.responsavelNome ?? undefined,
        tasks: col.tasks.map((t) => ({
          id: t.id,
          titulo: t.titulo,
          descricao: t.descricao || undefined,
          dataVencimento: t.dataVencimento || undefined,
          dataCriacao: t.dataCriacao,
          prioridade: (t.prioridade as 'baixa' | 'media' | 'alta' | 'urgente') || undefined,
          tags: t.tags ? JSON.parse(t.tags) : undefined,
          responsavel: t.responsavelNome
            ? {
                nome: t.responsavelNome,
                avatar: t.responsavelAvatar || undefined,
              }
            : undefined,
          subtasks: t.subtasks.map((s) => ({
            id: s.id,
            titulo: s.titulo,
            concluida: s.concluida,
            dataVencimento: s.dataVencimento || undefined,
            responsavel: s.responsavelNome
              ? {
                  nome: s.responsavelNome,
                  avatar: s.responsavelAvatar || undefined,
                }
              : undefined,
          })),
        })),
      })),
    });
  } catch (error) {
    serverLogger.error('Error updating pipeline', error, { route: '/api/pipelines/[id]', method: 'PUT' });
    return NextResponse.json({ error: 'Failed to update pipeline' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pipeline = await prisma.pipeline.findUnique({ where: { id } });
    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline não encontrado' }, { status: 404 });
    }
    await logActivity({
      request,
      projectId: pipeline.projectId,
      action: 'pipeline_deleted',
      details: { nome: pipeline.nome, pipelineId: id },
    });
    // Soft delete: vai para lixeira (raw para contornar client desatualizado)
    await prisma.$executeRawUnsafe(
      'UPDATE "Pipeline" SET "deletedAt" = ? WHERE "id" = ?',
      new Date().toISOString(),
      id
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    serverLogger.error('Error deleting pipeline', error, { route: '/api/pipelines/[id]', method: 'DELETE' });
    return NextResponse.json({ error: 'Failed to delete pipeline' }, { status: 500 });
  }
}
