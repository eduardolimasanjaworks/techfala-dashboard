/**
 * Extrai menções @nome ou @email do texto.
 * Suporta @Nome, @Nome Sobrenome e @email@dominio.com (um bloco por @ até espaço).
 */
export function extractMentions(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(/@([^\s]+)/g);
  if (!matches) return [];
  const unique = new Set<string>();
  for (const m of matches) {
    const name = m.slice(1).trim();
    if (name.length > 0) unique.add(name);
  }
  return Array.from(unique);
}

export interface CreateMentionNotificationsParams {
  projectId: string;
  taskId?: string;
  subtaskId?: string;
  taskTitulo: string;
  subtaskTitulo?: string;
  comentarioTexto: string;
  autorNome: string;
  basePath: string; // ex: /projects/xxx
}

/**
 * Cria notificações de menção para cada @nome encontrado no texto do comentário.
 * Deve ser chamado após criar o comentário (para ter link correto).
 */
export async function createMentionNotifications(
  prisma: { notification: { create: (args: { data: any }) => Promise<any> } },
  params: CreateMentionNotificationsParams
): Promise<void> {
  const mentions = extractMentions(params.comentarioTexto);
  if (mentions.length === 0) return;

  const link = params.subtaskId
    ? `${params.basePath}?task=${params.taskId}&subtask=${params.subtaskId}`
    : `${params.basePath}?task=${params.taskId}`;
  const onde = params.subtaskTitulo
    ? `na subtarefa "${params.subtaskTitulo}"`
    : `na tarefa "${params.taskTitulo}"`;
  const mensagem = `${params.autorNome} mencionou você ${onde}.`;

  for (const targetNome of mentions) {
    try {
      await prisma.notification.create({
        data: {
          projectId: params.projectId,
          taskId: params.taskId ?? null,
          subtaskId: params.subtaskId ?? null,
          targetNome,
          tipo: 'mention',
          mensagem,
          link,
          lida: false,
        },
      });
    } catch {
      // ignore duplicate or DB errors per mention
    }
  }
}
