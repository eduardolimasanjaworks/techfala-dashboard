import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { titulo, concluida, dataVencimento, dataInicio, ordem, subtaskListId, responsavelNome, responsavelAvatar } = body;

    const updateData: any = {};
    if (titulo !== undefined) updateData.titulo = titulo;
    if (concluida !== undefined) updateData.concluida = concluida;
    if (dataVencimento !== undefined) updateData.dataVencimento = dataVencimento;
    if (dataInicio !== undefined) updateData.dataInicio = dataInicio;
    if (ordem !== undefined) updateData.ordem = ordem;
    if (subtaskListId !== undefined) updateData.subtaskListId = subtaskListId || null;
    if (responsavelNome !== undefined) updateData.responsavelNome = responsavelNome;
    if (responsavelAvatar !== undefined) updateData.responsavelAvatar = responsavelAvatar;

    const subtask = await prisma.subtask.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(subtask);
  } catch (error) {
    serverLogger.error('Error updating subtask', error, { route: '/api/subtasks/[id]', method: 'PUT' });
    return NextResponse.json({ error: 'Failed to update subtask' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.subtask.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    serverLogger.error('Error deleting subtask', error, { route: '/api/subtasks/[id]', method: 'DELETE' });
    return NextResponse.json({ error: 'Failed to delete subtask' }, { status: 500 });
  }
}
