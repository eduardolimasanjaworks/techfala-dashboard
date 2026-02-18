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
    const { nome, cor, ordem } = body;
    const data: { nome?: string; cor?: string; ordem?: number } = {};
    if (typeof nome === 'string' && nome.trim()) data.nome = nome.trim();
    if (typeof cor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cor)) data.cor = cor;
    if (typeof ordem === 'number' && ordem >= 0) data.ordem = ordem;
    if (Object.keys(data).length === 0) return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 });
    const label = await prisma.label.update({ where: { id }, data });
    return NextResponse.json({ id: label.id, nome: label.nome, cor: label.cor, ordem: label.ordem });
  } catch (error) {
    serverLogger.error('Error updating label', error, { route: '/api/labels/[id]', method: 'PATCH' });
    return NextResponse.json({ error: 'Falha ao atualizar etiqueta' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.label.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    serverLogger.error('Error deleting label', error, { route: '/api/labels/[id]', method: 'DELETE' });
    return NextResponse.json({ error: 'Falha ao excluir etiqueta' }, { status: 500 });
  }
}
