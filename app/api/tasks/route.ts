import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

function mapTaskItem(task: any) {
  const tags = task.tags ? (() => { try { return JSON.parse(task.tags); } catch { return undefined; } })() : undefined;
  return {
    id: task.id,
    titulo: task.titulo,
    descricao: task.descricao ?? undefined,
    dataVencimento: task.dataVencimento ?? undefined,
    dataCriacao: task.dataCriacao,
    prioridade: (task.prioridade as 'baixa' | 'media' | 'alta' | 'urgente') ?? undefined,
    tags,
    responsavel: task.responsavelNome ? { nome: task.responsavelNome, avatar: task.responsavelAvatar ?? undefined } : undefined,
    columnId: task.columnId,
    columnNome: task.column?.nome,
    pipelineId: task.column?.pipeline?.id,
    pipelineNome: task.column?.pipeline?.nome,
    projectId: task.column?.pipeline?.projectId,
    epicId: task.epicId ?? undefined,
    subtasks: (task.subtasks ?? []).map((s: any) => ({
      id: s.id,
      titulo: s.titulo,
      concluida: s.concluida,
      ordem: s.ordem ?? 0,
    })),
  };
}

/**
 * GET /api/tasks
 * Filtros:
 *   - projectId: todas as tasks de um projeto
 *   - columnId: todas as tasks de uma coluna
 *   - pipelineId: todas as tasks de um pipeline
 *   - projectId + columnId: tasks do projeto X na coluna Y
 */
export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const columnId = searchParams.get('columnId');
    const pipelineId = searchParams.get('pipelineId');

    const where: any = { deletedAt: null };

    if (columnId && projectId) {
      where.columnId = columnId;
      where.column = { pipeline: { projectId, deletedAt: null } };
    } else if (columnId) {
      where.columnId = columnId;
      where.column = { pipeline: { deletedAt: null } };
    } else if (pipelineId) {
      where.column = { pipeline: { id: pipelineId, deletedAt: null } };
    } else if (projectId) {
      where.column = { pipeline: { projectId, deletedAt: null } };
    } else {
      where.column = { pipeline: { deletedAt: null } };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        column: {
          include: {
            pipeline: {
              select: { id: true, nome: true, projectId: true },
            },
          },
        },
        subtasks: { orderBy: [{ ordem: 'asc' }, { id: 'asc' }] },
      },
      orderBy: { id: 'asc' },
    });

    const items = tasks.map(mapTaskItem);
    return NextResponse.json({ tasks: items, total: items.length });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Falha ao listar tarefas' }, { status: 500 });
  }
}

/**
 * POST /api/tasks
 * Cria uma tarefa. Body: { columnId, titulo, descricao?, dataVencimento?, prioridade?, tags?, responsavel?, subtasks? }
 */
export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { columnId, titulo, descricao, dataVencimento, prioridade, tags, responsavel, subtasks } = body;

    if (!columnId || typeof columnId !== 'string') {
      return NextResponse.json({ error: 'columnId é obrigatório' }, { status: 400 });
    }

    const title = typeof titulo === 'string' && titulo.trim() ? titulo.trim() : 'Nova tarefa';
    const column = await prisma.column.findUnique({ where: { id: columnId }, include: { pipeline: true } });
    if (!column) {
      return NextResponse.json({ error: 'Coluna não encontrada' }, { status: 404 });
    }

    const task = await prisma.task.create({
      data: {
        columnId,
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
        column: { include: { pipeline: { select: { id: true, nome: true, projectId: true } } } },
        subtasks: { orderBy: { id: 'asc' }, include: { nestedSubtasks: { orderBy: { ordem: 'asc' } } } },
      },
    });

    await logActivity({
      request,
      projectId: column.pipeline.projectId,
      taskId: task.id,
      action: 'task_created',
      details: { titulo: task.titulo, columnId },
    });

    const item = mapTaskItem(task);
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Falha ao criar tarefa' }, { status: 500 });
  }
}
