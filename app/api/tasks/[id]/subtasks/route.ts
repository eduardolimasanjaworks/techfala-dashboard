import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';

/** Adiciona subtarefas a uma task existente (ex: clonar lista para outro card). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const task = await prisma.task.findUnique({ where: { id: taskId }, include: { column: { include: { pipeline: true } } } });
    if (!task) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const items = Array.isArray(body.items) ? body.items : [];
    const listName = typeof body.listName === 'string' && body.listName.trim() ? body.listName.trim() : null;
    if (items.length === 0) {
      return NextResponse.json({ error: 'Nenhum item para adicionar' }, { status: 400 });
    }

    let subtaskListId: string | null = null;
    if (listName) {
      const listCount = await prisma.subtaskList.count({ where: { taskId } });
      const newList = await prisma.subtaskList.create({
        data: { taskId, nome: listName, ordem: listCount },
      });
      subtaskListId = newList.id;
    }

    const maxOrdem = await prisma.subtask.aggregate({
      where: { taskId },
      _max: { ordem: true },
    });
    let ordem = (maxOrdem._max.ordem ?? -1) + 1;

    const created = await Promise.all(
      items.map((item: { titulo?: string }) =>
        prisma.subtask.create({
          data: {
            taskId,
            subtaskListId,
            titulo: typeof item.titulo === 'string' && item.titulo.trim() ? item.titulo.trim() : 'Nova subtarefa',
            concluida: false,
            ordem: ordem++,
          },
        })
      )
    );

    return NextResponse.json(created.map((s) => ({ id: s.id, titulo: s.titulo, concluida: s.concluida, ordem: s.ordem })));
  } catch (error) {
    serverLogger.error('Error adding subtasks', error, { route: '/api/tasks/[id]/subtasks', method: 'POST' });
    return NextResponse.json({ error: 'Falha ao adicionar subtarefas' }, { status: 500 });
  }
}
