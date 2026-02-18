import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, autor, texto } = body;

    if (!projectId || !autor || !texto) {
      return NextResponse.json(
        { error: 'projectId, autor e texto são obrigatórios' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        projectId,
        autor,
        data: new Date().toLocaleDateString('pt-BR'),
        texto,
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    serverLogger.error('Error creating comment', error, { route: '/api/comments', method: 'POST' });
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, texto } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: {
        texto,
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    serverLogger.error('Error updating comment', error, { route: '/api/comments', method: 'PUT' });
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    await prisma.comment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    serverLogger.error('Error deleting comment', error, { route: '/api/comments', method: 'DELETE' });
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
