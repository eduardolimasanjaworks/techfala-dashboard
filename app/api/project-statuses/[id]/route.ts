import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';
import { getSession } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { nome, cor, ordem } = body;

    const status = await prisma.projectStatus.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome: String(nome).trim() }),
        ...(cor !== undefined && { cor: String(cor) }),
        ...(ordem !== undefined && { ordem: Number(ordem) }),
      },
    });
    return NextResponse.json(status);
  } catch (error) {
    serverLogger.error('Error updating project status', error, { route: '/api/project-statuses/[id]', method: 'PUT' });
    return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.projectStatus.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    serverLogger.error('Error deleting project status', error, { route: '/api/project-statuses/[id]', method: 'DELETE' });
    return NextResponse.json({ error: 'Erro ao excluir status' }, { status: 500 });
  }
}
