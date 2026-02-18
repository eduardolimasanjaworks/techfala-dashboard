import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';
import { logActivity } from '@/lib/activity-log';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pipeline = await prisma.pipeline.findUnique({ where: { id } });
    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline não encontrado' }, { status: 404 });
    }
    await prisma.$executeRawUnsafe(
      'UPDATE "Pipeline" SET "deletedAt" = NULL WHERE "id" = ?',
      id
    );
    await logActivity({
      request: _request,
      projectId: pipeline.projectId,
      action: 'pipeline_restored',
      details: { nome: pipeline.nome, pipelineId: id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    serverLogger.error('Error restoring pipeline', error, { route: '/api/pipelines/[id]/restore', method: 'POST' });
    return NextResponse.json({ error: 'Falha ao restaurar pipeline' }, { status: 500 });
  }
}
