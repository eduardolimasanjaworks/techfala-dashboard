import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';
import { getClientErrorMessage } from '@/lib/api-error';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        projectStatus: true,
        equipe: {
          orderBy: { nome: 'asc' },
        },
        timeline: {
          orderBy: { data: 'asc' },
        },
        checklists: {
          include: {
            items: {
              orderBy: { id: 'asc' },
            },
          },
          orderBy: { id: 'asc' },
        },
        comentarios: {
          orderBy: { data: 'desc' },
        },
        pipelines: {
          include: {
            colunas: {
              include: {
                tasks: {
                  include: {
                    subtasks: {
                      orderBy: { id: 'asc' },
                    },
                  },
                  orderBy: { id: 'asc' },
                },
              },
              orderBy: { ordem: 'asc' },
            },
          },
          orderBy: { id: 'asc' },
        },
        velocidadeData: {
          orderBy: { ordem: 'asc' },
        },
        burndownData: {
          orderBy: { ordem: 'asc' },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    let projectLabels: { id: string; nome: string; cor: string; ordem: number }[] = [];
    try {
      projectLabels = await prisma.label.findMany({
        where: { projectId: id },
        orderBy: { ordem: 'asc' },
      });
    } catch {
      // Prisma client pode não ter modelo Label (ex: generate falhou)
    }

    const activePipelines = (project.pipelines ?? []).filter((p: { deletedAt?: Date | null }) => p.deletedAt == null);
    // Uma task é concluída quando todas as subtasks estão concluídas (subtasks mandam, não a coluna)
    const taskIsCompleted = (t: { subtasks?: { concluida: boolean }[] }) => {
      const subs = t.subtasks ?? [];
      return subs.length > 0 && subs.every((s) => s.concluida);
    };
    let totalTasks = 0;
    let completedTasks = 0;
    for (const p of activePipelines) {
      for (const col of p.colunas ?? []) {
        const tasks = (col.tasks ?? []).filter((t: { deletedAt?: Date | null }) => t.deletedAt == null);
        for (const t of tasks) {
          totalTasks += 1;
          if (taskIsCompleted(t)) completedTasks += 1;
        }
      }
    }
    const tarefasAtivasComputadas = Math.max(0, totalTasks - completedTasks);
    const progressoComputado = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : project.progresso;
    const totalWork = totalTasks;
    const workRemaining = Math.max(0, totalWork - completedTasks);
    let burndownPoints: number[] = [];
    if (totalWork > 0 && project.dataInicio && project.dataFim) {
      const start = new Date(project.dataInicio);
      const end = new Date(project.dataFim);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      const daysTotal = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
      const daysUntilToday = Math.min(daysTotal, Math.max(1, Math.ceil((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))));
      for (let i = 0; i < daysUntilToday; i++) {
        burndownPoints.push(i === daysUntilToday - 1 ? workRemaining : totalWork);
      }
      if (burndownPoints.length === 1) burndownPoints.unshift(totalWork);
    }
    if (burndownPoints.length < 2 && totalWork > 0) {
      burndownPoints = Array(6).fill(totalWork);
      burndownPoints[burndownPoints.length - 1] = workRemaining;
    }

    const allTaskIds = activePipelines.flatMap((p) =>
      (p.colunas ?? []).flatMap((c) => (c.tasks ?? []).filter((t) => t.deletedAt == null).map((t) => t.id))
    );
    const taskLabelsMap: Record<string, { id: string; nome: string; cor: string }[]> = {};
    if (allTaskIds.length > 0) {
      try {
        const rows = await prisma.$queryRawUnsafe<{ A: string; B: string }[]>(
          `SELECT A, B FROM _LabelToTask WHERE B IN (${allTaskIds.map(() => '?').join(',')})`,
          ...allTaskIds
        );
        const labelIdsByTask = new Map<string, string[]>();
        for (const r of rows) {
          const list = labelIdsByTask.get(r.B) ?? [];
          list.push(r.A);
          labelIdsByTask.set(r.B, list);
        }
        const labelIdSet = new Set(rows.map((r) => r.A));
        const labelsById = new Map<string, { id: string; nome: string; cor: string }>();
        for (const l of projectLabels) {
          if (labelIdSet.has(l.id)) labelsById.set(l.id, { id: l.id, nome: l.nome, cor: l.cor });
        }
        for (const [taskId, lids] of labelIdsByTask) {
          taskLabelsMap[taskId] = lids.map((lid) => labelsById.get(lid)!).filter(Boolean);
        }
      } catch {
        // join table pode não existir
      }
    }

    // Transformar para o formato esperado
    const transformed = {
      id: project.id,
      empresa: project.empresa,
      projectStatusId: project.projectStatusId ?? undefined,
      projectStatus: project.projectStatus
        ? { id: project.projectStatus.id, nome: project.projectStatus.nome, cor: project.projectStatus.cor, ordem: project.projectStatus.ordem }
        : undefined,
      gerente: project.gerente,
      diasAtraso: project.diasAtraso,
      statusBadge: project.statusBadge as 'Em Atraso' | 'No Prazo' | 'Em Andamento',
      indiceVelocidade: project.indiceVelocidade,
      velocidadeData: (project.velocidadeData ?? []).map((v) => v.valor),
      burndownData: burndownPoints,
      totalWork,
      statusVelocidade: project.dataFim ? (project.statusVelocidade as 'No Prazo' | 'Atrasado') : null,
      progresso: progressoComputado,
      proximaConclusao: project.proximaConclusao,
      tarefasAtivas: tarefasAtivasComputadas,
      statusGeral: project.dataFim ? (project.statusGeral as 'Excelente' | 'Atenção' | 'Crítico') : null,
      statusProjeto: project.statusProjeto as
        | 'Atrasado'
        | 'No Prazo'
        | 'Para Começar'
        | 'Stand By'
        | 'Aguardando Confirmação'
        | undefined,
      statusOnboarding: project.statusOnboarding as
        | 'Esperando Contrato'
        | 'Esperando Pagamento'
        | 'Iniciar Onboarding'
        | undefined,
      dataInicio: project.dataInicio,
      dataFim: project.dataFim || undefined,
      email: project.email || undefined,
      telefone: project.telefone || undefined,
      endereco: project.endereco || undefined,
      descricao: project.descricao || undefined,
      orcamento: project.orcamento || undefined,
      logo: project.logo || undefined,
      equipe: project.equipe.map((m) => ({
        id: m.id,
        nome: m.nome,
        cargo: m.cargo,
        avatar: m.avatar || undefined,
      })),
      timeline: project.timeline.map((t) => ({
        data: t.data,
        evento: t.evento,
        tipo: t.tipo as 'inicio' | 'milestone' | 'atraso' | 'conclusao',
      })),
      checklists: project.checklists.map((c) => ({
        id: c.id,
        nome: c.nome,
        items: c.items.map((i) => ({
          id: i.id,
          titulo: i.titulo,
          concluido: i.concluido,
        })),
      })),
      comentarios: project.comentarios.map((c) => ({
        id: c.id,
        autor: c.autor,
        data: c.data,
        texto: c.texto,
      })),
      labels: projectLabels.map((l) => ({
        id: l.id,
        nome: l.nome,
        cor: l.cor,
        ordem: l.ordem,
      })),
      pipelines: activePipelines.map((p) => ({
        id: p.id,
        nome: p.nome,
        colunas: (p.colunas ?? []).map((col) => ({
          id: col.id,
          nome: col.nome,
          ordem: col.ordem,
          cor: col.cor ?? undefined,
          corFonte: col.corFonte ?? undefined,
          responsavelNome: col.responsavelNome ?? undefined,
          tasks: (col.tasks ?? []).filter((t) => t.deletedAt == null).map((t) => {
            let tags: unknown;
            try {
              tags = t.tags ? JSON.parse(t.tags) : undefined;
            } catch {
              tags = undefined;
            }
            return {
            id: t.id,
            epicId: t.epicId || undefined,
            titulo: t.titulo,
            descricao: t.descricao || undefined,
            dataVencimento: t.dataVencimento || undefined,
            dataCriacao: t.dataCriacao,
            prioridade: (t.prioridade as 'baixa' | 'media' | 'alta' | 'urgente') || undefined,
            tags,
            responsavel: t.responsavelNome
              ? {
                  nome: t.responsavelNome,
                  avatar: t.responsavelAvatar || undefined,
                }
              : undefined,
            labels: taskLabelsMap[t.id] ?? (t as any).labels?.map((l: { id: string; nome: string; cor: string }) => ({ id: l.id, nome: l.nome, cor: l.cor })) ?? [],
            subtasks: (t.subtasks ?? []).map((s) => ({
              id: s.id,
              titulo: s.titulo,
              concluida: s.concluida,
              dataVencimento: s.dataVencimento || undefined,
              responsavel: s.responsavelNome
                ? {
                    nome: s.responsavelNome,
                    avatar: s.responsavelAvatar || undefined,
                  }
                : undefined,
            })),
          };
          }),
        })),
      })),
      metricas: {
        tarefasAtivas: tarefasAtivasComputadas,
        concluidas: completedTasks,
        atrasadas: 0,
      },
    };

    return NextResponse.json(transformed);
  } catch (error) {
    serverLogger.error('Error fetching project', error, { route: '/api/projects/[id]', method: 'GET' });
    return NextResponse.json(getClientErrorMessage('Failed to fetch project', error), { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    serverLogger.error('Error updating project', error, { route: '/api/projects/[id]', method: 'PUT' });
    return NextResponse.json(getClientErrorMessage('Failed to update project', error), { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    serverLogger.error('Error deleting project', error, { route: '/api/projects/[id]', method: 'DELETE' });
    return NextResponse.json(getClientErrorMessage('Failed to delete project', error), { status: 500 });
  }
}
