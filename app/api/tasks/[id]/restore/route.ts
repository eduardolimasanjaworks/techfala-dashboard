import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';

export async function POST(
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
    if (!task.deletedAt) return NextResponse.json({ error: 'Tarefa não está na lixeira' }, { status: 400 });

    await prisma.task.update({
      where: { id },
      data: { deletedAt: null, deletedBy: null },
    });

    const projectId = task.column.pipeline.projectId;
    await logActivity({
      request,
      projectId,
      taskId: id,
      action: 'task_restored',
      details: { titulo: task.titulo, columnId: task.columnId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error restoring task:', error);
    return NextResponse.json({ error: 'Falha ao restaurar tarefa' }, { status: 500 });
  }
}
