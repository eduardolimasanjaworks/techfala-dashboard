import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';

const ACTION_LABELS: Record<string, string> = {
  task_created: 'Criou o card',
  task_updated: 'Atualizou o card',
  task_deleted: 'Moveu o card para a lixeira',
  task_restored: 'Restaurou o card da lixeira',
  task_moved: 'Moveu o card de coluna',
  comment_added: 'Comentou no card',
  subtask_added: 'Adicionou subtarefa',
  subtask_updated: 'Atualizou subtarefa',
  subtask_deleted: 'Removeu subtarefa',
  comment_subtask_added: 'Comentou na subtarefa',
  pipeline_created: 'Criou pipeline',
  pipeline_updated: 'Atualizou pipeline',
  pipeline_deleted: 'Excluiu pipeline',
  pipeline_restored: 'Restaurou pipeline',
  column_created: 'Criou coluna',
  column_renamed: 'Renomeou coluna',
};

/** Lista o registro de atividades do projeto (quem fez o quê). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 200);

    const where: { projectId: string; taskId?: string } = { projectId };
    if (taskId) where.taskId = taskId;

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const items = logs.map((log) => {
      let details: Record<string, unknown> = {};
      if (log.details) {
        try {
          details = JSON.parse(log.details);
        } catch {
          //
        }
      }
      return {
        id: log.id,
        projectId: log.projectId,
        taskId: log.taskId,
        autor: log.autor,
        action: log.action,
        actionLabel: ACTION_LABELS[log.action] || log.action,
        details,
        createdAt: log.createdAt.toISOString(),
      };
    });

    return NextResponse.json(items);
  } catch (error) {
    serverLogger.error('Error fetching activities', error, { route: '/api/projects/[id]/activities', method: 'GET' });
    return NextResponse.json({ error: 'Falha ao carregar atividades' }, { status: 500 });
  }
}
