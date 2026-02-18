import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, nome, items } = body;

    const checklist = await prisma.checklist.create({
      data: {
        projectId,
        nome,
        items: items
          ? {
              create: items.map((item: { titulo: string; concluido?: boolean }) => ({
                titulo: item.titulo,
                concluido: item.concluido || false,
              })),
            }
          : undefined,
      },
      include: {
        items: {
          orderBy: { id: 'asc' },
        },
      },
    });

    return NextResponse.json({
      id: checklist.id,
      nome: checklist.nome,
      items: checklist.items.map((i) => ({
        id: i.id,
        titulo: i.titulo,
        concluido: i.concluido,
      })),
    });
  } catch (error) {
    serverLogger.error('Error creating checklist', error, { route: '/api/checklists', method: 'POST' });
    return NextResponse.json({ error: 'Failed to create checklist' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nome, items } = body;

    const checklist = await prisma.checklist.update({
      where: { id },
      data: {
        nome,
      },
      include: {
        items: true,
      },
    });

    // Atualizar items se fornecidos
    if (items !== undefined) {
      // Deletar items antigos
      await prisma.checklistItem.deleteMany({
        where: { checklistId: id },
      });

      // Criar novos items
      if (items.length > 0) {
        await prisma.checklistItem.createMany({
          data: items.map((item: { titulo: string; concluido?: boolean }) => ({
            checklistId: id,
            titulo: item.titulo,
            concluido: item.concluido || false,
          })),
        });
      }
    }

    const updated = await prisma.checklist.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { id: 'asc' },
        },
      },
    });

    return NextResponse.json({
      id: updated!.id,
      nome: updated!.nome,
      items: updated!.items.map((i) => ({
        id: i.id,
        titulo: i.titulo,
        concluido: i.concluido,
      })),
    });
  } catch (error) {
    serverLogger.error('Error updating checklist', error, { route: '/api/checklists', method: 'PUT' });
    return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Checklist ID is required' }, { status: 400 });
    }

    await prisma.checklist.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    serverLogger.error('Error deleting checklist', error, { route: '/api/checklists', method: 'DELETE' });
    return NextResponse.json({ error: 'Failed to delete checklist' }, { status: 500 });
  }
}
