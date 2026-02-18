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
    const comments = await prisma.taskComment.findMany({
      where: { taskId: id },
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
    serverLogger.error('Error fetching task comments', error, { route: '/api/tasks/[id]/comments', method: 'GET' });
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

    const task = await prisma.task.findUnique({
      where: { id },
      include: { column: { include: { pipeline: true } } },
    });
    if (!task) return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });

    const session = await import('@/lib/auth').then((m) => m.getSession(request));
    const autorName = session?.nome || (typeof autor === 'string' && autor.trim() ? autor.trim() : 'Usuário');
    const comment = await prisma.taskComment.create({
      data: { taskId: id, autor: autorName, texto: textoStr },
    });

    await logActivity({
      request,
      projectId: task.column.pipeline.projectId,
      taskId: id,
      action: 'comment_added',
      details: { titulo: task.titulo },
    });

    await createMentionNotifications(prisma, {
      projectId: task.column.pipeline.projectId,
      taskId: id,
      taskTitulo: task.titulo,
      comentarioTexto: textoStr,
      autorNome: autorName,
      basePath: `/projects/${task.column.pipeline.projectId}`,
    });

    return NextResponse.json({
      id: comment.id,
      autor: comment.autor,
      texto: comment.texto,
      data: comment.createdAt.toISOString(),
      createdAt: comment.createdAt.toISOString(),
    });
  } catch (error) {
    serverLogger.error('Error creating task comment', error, { route: '/api/tasks/[id]/comments', method: 'POST' });
    return NextResponse.json({ error: 'Falha ao criar comentário' }, { status: 500 });
  }
}
