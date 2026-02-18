import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, data, evento, tipo } = body;

    if (!projectId || !data || !evento || !tipo) {
      return NextResponse.json(
        { error: 'projectId, data, evento e tipo são obrigatórios' },
        { status: 400 }
      );
    }

    const timelineEvent = await prisma.timelineEvent.create({
      data: {
        projectId,
        data,
        evento,
        tipo,
      },
    });

    return NextResponse.json(timelineEvent);
  } catch (error) {
    serverLogger.error('Error creating timeline event', error, { route: '/api/timeline-events', method: 'POST' });
    return NextResponse.json({ error: 'Failed to create timeline event' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, data, evento, tipo } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const timelineEvent = await prisma.timelineEvent.update({
      where: { id },
      data: {
        data,
        evento,
        tipo,
      },
    });

    return NextResponse.json(timelineEvent);
  } catch (error) {
    serverLogger.error('Error updating timeline event', error, { route: '/api/timeline-events', method: 'PUT' });
    return NextResponse.json({ error: 'Failed to update timeline event' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    await prisma.timelineEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    serverLogger.error('Error deleting timeline event', error, { route: '/api/timeline-events', method: 'DELETE' });
    return NextResponse.json({ error: 'Failed to delete timeline event' }, { status: 500 });
  }
}
