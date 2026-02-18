import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';
import { logActivity } from '@/lib/activity-log';

function safeParseTags(tags: string | null | undefined): string[] | undefined {
  if (tags == null || tags === '') return undefined;
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { titulo, descricao, dataVencimento, prioridade, tags, responsavel, subtasks } = body;

    const title = typeof titulo === 'string' && titulo.trim() ? titulo.trim() : 'Nova tarefa';
    const column = await prisma.column.findUnique({ where: { id }, include: { pipeline: true } });
    if (!column) {
      return NextResponse.json({ error: 'Coluna não encontrada' }, { status: 404 });
    }

    const task = await prisma.task.create({
      data: {
        columnId: id,
        titulo: title,
        descricao: descricao ?? undefined,
        dataVencimento: dataVencimento ?? undefined,
        dataCriacao: new Date().toISOString().slice(0, 10),
        prioridade: prioridade ?? undefined,
        tags: tags != null ? JSON.stringify(tags) : null,
        responsavelNome: responsavel?.nome ?? undefined,
        responsavelAvatar: responsavel?.avatar ?? undefined,
        subtasks: Array.isArray(subtasks) && subtasks.length > 0
          ? {
              create: subtasks.map((s: any, i: number) => ({
                titulo: typeof s.titulo === 'string' ? s.titulo : 'Subtarefa',
                concluida: Boolean(s.concluida),
                dataInicio: s.dataInicio ?? undefined,
                dataVencimento: s.dataVencimento ?? undefined,
                ordem: typeof s.ordem === 'number' ? s.ordem : i,
                responsavelNome: s.responsavel?.nome ?? undefined,
                responsavelAvatar: s.responsavel?.avatar ?? undefined,
                nestedSubtasks: Array.isArray(s.nestedSubtasks) && s.nestedSubtasks.length > 0
                  ? {
                      create: s.nestedSubtasks.map((n: any, j: number) => ({
                        titulo: typeof n.titulo === 'string' ? n.titulo : 'Sub-subtarefa',
                        concluida: Boolean(n.concluida),
                        ordem: typeof n.ordem === 'number' ? n.ordem : j,
                        dataInicio: n.dataInicio ?? undefined,
                        dataVencimento: n.dataVencimento ?? undefined,
                        responsavelNome: n.responsavel?.nome ?? undefined,
                        responsavelAvatar: n.responsavel?.avatar ?? undefined,
                      })),
                    }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
        subtasks: {
          orderBy: { id: 'asc' },
          include: { nestedSubtasks: { orderBy: { ordem: 'asc' } } },
        },
      },
    });

    await logActivity({
      request,
      projectId: column.pipeline.projectId,
      taskId: task.id,
      action: 'task_created',
      details: { titulo: task.titulo, columnId: id },
    });

    return NextResponse.json({
      id: task.id,
      titulo: task.titulo,
      descricao: task.descricao ?? undefined,
      dataVencimento: task.dataVencimento ?? undefined,
      dataCriacao: task.dataCriacao,
      prioridade: (task.prioridade as 'baixa' | 'media' | 'alta' | 'urgente') ?? undefined,
      tags: safeParseTags(task.tags),
      responsavel: task.responsavelNome
        ? {
            nome: task.responsavelNome,
            avatar: task.responsavelAvatar ?? undefined,
          }
        : undefined,
      subtasks: task.subtasks.map((s) => ({
        id: s.id,
        titulo: s.titulo,
        concluida: s.concluida,
        dataVencimento: s.dataVencimento ?? undefined,
        responsavel: s.responsavelNome
          ? { nome: s.responsavelNome, avatar: s.responsavelAvatar ?? undefined }
          : undefined,
        nestedSubtasks: (s.nestedSubtasks ?? []).map((n) => ({
          id: n.id,
          titulo: n.titulo,
          concluida: n.concluida,
          ordem: n.ordem,
          dataInicio: n.dataInicio ?? undefined,
          dataVencimento: n.dataVencimento ?? undefined,
          responsavel: n.responsavelNome ? { nome: n.responsavelNome, avatar: n.responsavelAvatar ?? undefined } : undefined,
        })),
      })),
    });
  } catch (error) {
    serverLogger.error('Error creating task', error, { route: '/api/columns/[id]/tasks', method: 'POST' });
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
