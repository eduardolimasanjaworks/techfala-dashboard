import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lists = await prisma.subtaskList.findMany({
      where: { taskId: id },
      orderBy: { ordem: 'asc' },
      include: { subtasks: { orderBy: { ordem: 'asc' } } },
    });
    return NextResponse.json(
      lists.map((l) => ({
        id: l.id,
        nome: l.nome,
        ordem: l.ordem,
        subtasks: l.subtasks.map((s) => ({ id: s.id, titulo: s.titulo, ordem: s.ordem })),
      }))
    );
  } catch (error) {
    serverLogger.error('Error fetching subtask lists', error, { route: '/api/tasks/[id]/subtask-lists', method: 'GET' });
    return NextResponse.json({ error: 'Falha ao carregar listas' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { nome } = body;
    const nomeStr = typeof nome === 'string' && nome.trim() ? nome.trim() : 'Nova lista';
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    const count = await prisma.subtaskList.count({ where: { taskId: id } });
    const list = await prisma.subtaskList.create({
      data: { taskId: id, nome: nomeStr, ordem: count },
    });
    return NextResponse.json({ id: list.id, nome: list.nome, ordem: list.ordem, subtasks: [] });
  } catch (error) {
    serverLogger.error('Error creating subtask list', error, { route: '/api/tasks/[id]/subtask-lists', method: 'POST' });
    return NextResponse.json({ error: 'Falha ao criar lista' }, { status: 500 });
  }
}
