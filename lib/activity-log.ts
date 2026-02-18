import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type ActivityAction =
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'task_restored'
  | 'task_moved'
  | 'comment_added'
  | 'subtask_added'
  | 'subtask_updated'
  | 'subtask_deleted'
  | 'comment_subtask_added'
  | 'pipeline_created'
  | 'pipeline_updated'
  | 'pipeline_deleted'
  | 'pipeline_restored'
  | 'pipeline_cloned'
  | 'project_cloned'
  | 'column_created'
  | 'column_renamed';

/** Retorna o nome do usuário atual (para registrar em atividades). */
export async function getCurrentUserForLog(request: NextRequest): Promise<{ userId: string; autor: string } | null> {
  const session = await getSession(request);
  if (!session) return null;
  return { userId: session.userId, autor: session.nome || session.email || 'Usuário' };
}

/** Registra uma atividade. projectId pode ser obtido do contexto (task -> column -> pipeline -> projectId). */
export async function logActivity(params: {
  request: NextRequest;
  projectId?: string | null;
  taskId?: string | null;
  action: ActivityAction;
  details?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    const { projectId, taskId, action, details } = params;
    const user = await getCurrentUserForLog(params.request);
    const autor = user?.autor ?? 'Sistema';
    const userId = user?.userId ?? null;
    await prisma.activityLog.create({
      data: {
        projectId: projectId ?? null,
        taskId: taskId ?? null,
        userId,
        autor,
        action,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (e) {
    console.error('[ActivityLog]', e);
  }
}
