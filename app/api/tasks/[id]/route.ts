import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';

function mapTaskToJson(task: any) {
  return {
    id: task.id,
    epicId: task.epicId ?? undefined,
    titulo: task.titulo,
    descricao: task.descricao ?? undefined,
    dataVencimento: task.dataVencimento ?? undefined,
    dataCriacao: task.dataCriacao,
    prioridade: (task.prioridade as 'baixa' | 'media' | 'alta' | 'urgente') ?? undefined,
    tags: task.tags ? (() => { try { return JSON.parse(task.tags); } catch { return undefined; } })() : undefined,
    responsavel: task.responsavelNome ? { nome: task.responsavelNome, avatar: task.responsavelAvatar ?? undefined } : undefined,
    subtasks: task.subtasks?.map((s: any) => ({
      id: s.id,
      titulo: s.titulo,
      concluida: s.concluida,
      dataInicio: s.dataInicio ?? undefined,
      dataVencimento: s.dataVencimento ?? undefined,
      ordem: s.ordem ?? 0,
      subtaskListId: s.subtaskListId ?? undefined,
      responsavel: s.responsavelNome ? { nome: s.responsavelNome, avatar: s.responsavelAvatar ?? undefined } : undefined,
      nestedSubtasks: s.nestedSubtasks?.map((n: any) => ({
        id: n.id,
        titulo: n.titulo,
        concluida: n.concluida,
        dataInicio: n.dataInicio ?? undefined,
        dataVencimento: n.dataVencimento ?? undefined,
        ordem: n.ordem ?? 0,
        responsavel: n.responsavelNome ? { nome: n.responsavelNome, avatar: n.responsavelAvatar ?? undefined } : undefined,
      })) ?? [],
      subtaskComments: s.subtaskComments?.map((sc: any) => ({
        id: sc.id,
        autor: sc.autor,
        texto: sc.texto,
        data: sc.createdAt.toISOString(),
        createdAt: sc.createdAt.toISOString(),
      })) ?? [],
    })) ?? [],
    taskComments: task.taskComments?.map((c: any) => ({
      id: c.id,
      autor: c.autor,
      texto: c.texto,
      data: c.createdAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
    })) ?? [],
    subtaskLists: task.subtaskLists?.map((l: any) => ({
      id: l.id,
      nome: l.nome,
      ordem: l.ordem,
      subtasks: l.subtasks?.map((s: any) => s.id) ?? [],
    })) ?? [],
    labels: task.labels?.map((l: any) => ({ id: l.id, nome: l.nome, cor: l.cor })) ?? [],
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        taskComments: { orderBy: { createdAt: 'asc' } },
        subtaskLists: { orderBy: { ordem: 'asc' }, include: { subtasks: { orderBy: { ordem: 'asc' } } } },
        subtasks: {
          orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
          include: {
            nestedSubtasks: { orderBy: { ordem: 'asc' } },
            subtaskComments: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
    });
    if (!task) return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    let taskLabels: { id: string; nome: string; cor: string }[] = [];
    try {
      const rows = await prisma.$queryRawUnsafe<{ A: string }[]>(
        'SELECT A FROM _LabelToTask WHERE B = ?',
        id
      );
      const labelIds = rows.map((r) => r.A);
      if (labelIds.length > 0) {
        const labels = await prisma.label.findMany({
          where: { id: { in: labelIds } },
          select: { id: true, nome: true, cor: true },
        });
        taskLabels = labels.map((l) => ({ id: l.id, nome: l.nome, cor: l.cor }));
      }
    } catch {
      // join table pode não existir
    }
    const json = mapTaskToJson(task);
    json.labels = taskLabels;
    return NextResponse.json(json);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Falha ao carregar tarefa' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'ID da task é obrigatório' }, { status: 400 });
    }

    const body = await request.json();
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }
    const {
      titulo,
      descricao,
      dataVencimento,
      prioridade,
      tags,
      responsavel,
      columnId,
      epicId,
      subtasks,
      labelIds,
    } = body;

    const updateData: any = {};
    if (titulo !== undefined) updateData.titulo = titulo;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (dataVencimento !== undefined) updateData.dataVencimento = dataVencimento;
    if (prioridade !== undefined) updateData.prioridade = prioridade;
    if (tags !== undefined) updateData.tags = tags ? JSON.stringify(tags) : null;
    if (epicId !== undefined) updateData.epicId = epicId || null;
    if (responsavel !== undefined) {
      updateData.responsavelNome = responsavel?.nome;
      updateData.responsavelAvatar = responsavel?.avatar;
    }
    if (columnId !== undefined) updateData.columnId = columnId;
    if (labelIds !== undefined && Array.isArray(labelIds)) {
      try {
        updateData.labels = { set: labelIds.map((lid: string) => ({ id: lid })) };
      } catch {
        // fallback: Prisma client pode não ter relação labels
      }
    }
    let task: any;
    try {
      task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        column: { include: { pipeline: true } },
        taskComments: { orderBy: { createdAt: 'asc' } },
        subtaskLists: { orderBy: { ordem: 'asc' } },
        subtasks: {
          orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
          include: { nestedSubtasks: { orderBy: { ordem: 'asc' } } },
        },
      },
    });
    } catch (updateErr: any) {
      if (labelIds !== undefined && Array.isArray(labelIds) && updateErr?.message?.includes('labels')) {
        delete updateData.labels;
        task = await prisma.task.update({
          where: { id },
          data: updateData,
          include: {
            column: { include: { pipeline: true } },
            taskComments: { orderBy: { createdAt: 'asc' } },
            subtaskLists: { orderBy: { ordem: 'asc' } },
            subtasks: {
              orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
              include: { nestedSubtasks: { orderBy: { ordem: 'asc' } } },
            },
          },
        });
        try {
          await prisma.$executeRawUnsafe('DELETE FROM _LabelToTask WHERE B = ?', id);
          for (const lid of labelIds) {
            await prisma.$executeRawUnsafe('INSERT INTO _LabelToTask (A, B) VALUES (?, ?)', lid, id);
          }
        } catch {
          // join table pode não existir
        }
      } else {
        throw updateErr;
      }
    }
    const projectId = task.column.pipeline.projectId;
    await logActivity({
      request,
      projectId,
      taskId: id,
      action: columnId !== undefined ? 'task_moved' : 'task_updated',
      details: columnId !== undefined ? { columnId, titulo: task.titulo } : { titulo: task.titulo },
    });

    // Atualizar subtasks se fornecidas
    if (subtasks !== undefined) {
      // Deletar subtasks antigas
      await prisma.subtask.deleteMany({
        where: { taskId: id },
      });

      if (subtasks.length > 0) {
        for (let i = 0; i < subtasks.length; i++) {
          const s = subtasks[i];
          await prisma.subtask.create({
            data: {
              taskId: id,
              titulo: s.titulo ?? 'Subtarefa',
              concluida: Boolean(s.concluida),
              dataInicio: s.dataInicio ?? undefined,
              dataVencimento: s.dataVencimento ?? undefined,
              ordem: typeof s.ordem === 'number' ? s.ordem : i,
              subtaskListId: s.subtaskListId || undefined,
              responsavelNome: s.responsavel?.nome,
              responsavelAvatar: s.responsavel?.avatar,
              nestedSubtasks: Array.isArray(s.nestedSubtasks) && s.nestedSubtasks.length > 0
                ? {
                    create: s.nestedSubtasks.map((n: any, j: number) => ({
                      titulo: n.titulo ?? 'Sub-subtarefa',
                      concluida: Boolean(n.concluida),
                      dataInicio: n.dataInicio ?? undefined,
                      dataVencimento: n.dataVencimento ?? undefined,
                      ordem: typeof n.ordem === 'number' ? n.ordem : j,
                      responsavelNome: n.responsavel?.nome,
                      responsavelAvatar: n.responsavel?.avatar,
                    })),
                  }
                : undefined,
            },
          });
        }
      }

      const updatedTask = await prisma.task.findUnique({
        where: { id },
        include: {
          subtasks: {
            orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
            include: { nestedSubtasks: { orderBy: { ordem: 'asc' } } },
          },
        },
      });

      if (updatedTask) {
        const j = mapTaskToJson(updatedTask);
        try {
          const rows = await prisma.$queryRawUnsafe<{ A: string }[]>('SELECT A FROM _LabelToTask WHERE B = ?', id);
          const lids = rows.map((r) => r.A);
          if (lids.length > 0) {
            const labels = await prisma.label.findMany({ where: { id: { in: lids } }, select: { id: true, nome: true, cor: true } });
            j.labels = labels.map((l) => ({ id: l.id, nome: l.nome, cor: l.cor }));
          }
        } catch {}
        return NextResponse.json(j);
      }
    }

    const j = mapTaskToJson(task);
    try {
      const rows = await prisma.$queryRawUnsafe<{ A: string }[]>('SELECT A FROM _LabelToTask WHERE B = ?', id);
      const lids = rows.map((r) => r.A);
      if (lids.length > 0) {
        const labels = await prisma.label.findMany({ where: { id: { in: lids } }, select: { id: true, nome: true, cor: true } });
        j.labels = labels.map((l) => ({ id: l.id, nome: l.nome, cor: l.cor }));
      }
    } catch {}
    return NextResponse.json(j);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: { column: { include: { pipeline: true } } },
    });
    if (!task) return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    if (task.deletedAt) return NextResponse.json({ error: 'Tarefa já está na lixeira' }, { status: 400 });

    const session = await import('@/lib/auth').then((m) => m.getSession(request));
    const deletedBy = session?.userId ?? null;

    await prisma.task.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy },
    });

    const projectId = task.column.pipeline.projectId;
    await logActivity({
      request,
      projectId,
      taskId: id,
      action: 'task_deleted',
      details: { titulo: task.titulo, columnId: task.columnId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Falha ao excluir tarefa' }, { status: 500 });
  }
}
