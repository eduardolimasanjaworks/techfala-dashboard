import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';
import { logActivity } from '@/lib/activity-log';
import { createMentionNotifications } from '@/lib/mentions';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comments = await prisma.subtaskComment.findMany({
      where: { subtaskId: id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(
      comments.map((c) => ({
        id: c.id,
        autor: c.autor,
        texto: c.texto,
        data: c.createdAt.toISOString(),
        createdAt: c.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    serverLogger.error('Error fetching subtask comments', error, { route: '/api/subtasks/[id]/comments', method: 'GET' });
    return NextResponse.json({ error: 'Falha ao carregar comentários' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { texto, autor } = body;
    const textoStr = typeof texto === 'string' && texto.trim() ? texto.trim() : null;
    if (!textoStr) return NextResponse.json({ error: 'Texto é obrigatório' }, { status: 400 });

    const subtask = await prisma.subtask.findUnique({
      where: { id },
      include: { task: { include: { column: { include: { pipeline: true } } } } },
    });
    if (!subtask) return NextResponse.json({ error: 'Subtarefa não encontrada' }, { status: 404 });

    const session = await import('@/lib/auth').then((m) => m.getSession(request));
    const autorName = session?.nome || (typeof autor === 'string' && autor.trim() ? autor.trim() : 'Usuário');
    const comment = await prisma.subtaskComment.create({
      data: { subtaskId: id, autor: autorName, texto: textoStr },
    });

    await logActivity({
      request,
      projectId: subtask.task.column.pipeline.projectId,
      taskId: subtask.taskId,
      action: 'comment_subtask_added',
      details: { subtaskTitulo: subtask.titulo },
    });

    await createMentionNotifications(prisma, {
      projectId: subtask.task.column.pipeline.projectId,
      taskId: subtask.taskId,
      subtaskId: id,
      taskTitulo: subtask.task.titulo,
      subtaskTitulo: subtask.titulo,
      comentarioTexto: textoStr,
      autorNome: autorName,
      basePath: `/projects/${subtask.task.column.pipeline.projectId}`,
    });

    return NextResponse.json({
      id: comment.id,
      autor: comment.autor,
      texto: comment.texto,
      data: comment.createdAt.toISOString(),
      createdAt: comment.createdAt.toISOString(),
    });
  } catch (error) {
    serverLogger.error('Error creating subtask comment', error, { route: '/api/subtasks/[id]/comments', method: 'POST' });
    return NextResponse.json({ error: 'Falha ao criar comentário' }, { status: 500 });
  }
}
