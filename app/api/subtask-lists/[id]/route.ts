import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { nome, ordem } = body;
    const data: { nome?: string; ordem?: number } = {};
    if (typeof nome === 'string' && nome.trim()) data.nome = nome.trim();
    if (typeof ordem === 'number' && ordem >= 0) data.ordem = ordem;
    if (Object.keys(data).length === 0) return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 });
    const list = await prisma.subtaskList.update({ where: { id }, data });
    return NextResponse.json({ id: list.id, nome: list.nome, ordem: list.ordem });
  } catch (error) {
    serverLogger.error('Error updating subtask list', error, { route: '/api/subtask-lists/[id]', method: 'PATCH' });
    return NextResponse.json({ error: 'Falha ao atualizar lista' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.subtaskList.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    serverLogger.error('Error deleting subtask list', error, { route: '/api/subtask-lists/[id]', method: 'DELETE' });
    return NextResponse.json({ error: 'Falha ao excluir lista' }, { status: 500 });
  }
}
