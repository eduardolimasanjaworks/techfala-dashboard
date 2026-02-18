import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';
import { logActivity } from '@/lib/activity-log';

/** Clona um projeto inteiro (equipe, labels, checklists, pipelines, colunas, tasks, subtasks, timeline) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourceProjectId } = await params;
    const body = await request.json().catch(() => ({}));
    const newNome = typeof body.empresa === 'string' && body.empresa.trim()
      ? body.empresa.trim()
      : null;

    const source = await prisma.project.findFirst({
      where: { id: sourceProjectId },
      include: {
        equipe: true,
        labels: true,
        checklists: { include: { items: true } },
        timeline: true,
        pipelines: {
          where: { deletedAt: null },
          include: {
            colunas: {
              include: {
                tasks: {
                  include: {
                    subtasks: { orderBy: { id: 'asc' } },
                  },
                  where: { deletedAt: null },
                  orderBy: { id: 'asc' },
                },
              },
              orderBy: { ordem: 'asc' },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!source) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    const nomeProjeto = newNome ?? `${source.empresa} (cópia)`;

    const newProject = await prisma.project.create({
      data: {
        empresa: nomeProjeto,
        projectStatusId: source.projectStatusId,
        gerente: source.gerente,
        diasAtraso: source.diasAtraso,
        statusBadge: source.statusBadge,
        indiceVelocidade: source.indiceVelocidade,
        statusVelocidade: source.statusVelocidade,
        progresso: 0,
        proximaConclusao: '0.00',
        tarefasAtivas: 0,
        statusGeral: source.statusGeral,
        statusProjeto: source.statusProjeto,
        statusOnboarding: source.statusOnboarding,
        dataInicio: source.dataInicio,
        dataFim: source.dataFim,
        email: source.email,
        telefone: source.telefone,
        endereco: source.endereco,
        descricao: source.descricao,
        orcamento: source.orcamento,
        logo: source.logo,
        equipe: source.equipe.length
          ? { create: source.equipe.map((m) => ({ nome: m.nome, cargo: m.cargo, avatar: m.avatar })) }
          : undefined,
        labels: source.labels.length
          ? { create: source.labels.map((l) => ({ nome: l.nome, cor: l.cor, ordem: l.ordem })) }
          : undefined,
        checklists: source.checklists.length
          ? {
              create: source.checklists.map((c) => ({
                nome: c.nome,
                items: { create: c.items.map((i) => ({ titulo: i.titulo, concluido: i.concluido })) },
              })),
            }
          : undefined,
        timeline: source.timeline.length
          ? { create: source.timeline.map((t) => ({ data: t.data, evento: t.evento, tipo: t.tipo })) }
          : undefined,
      },
    });

    const checklistIdMap = new Map<string, string>();
    if (source.checklists.length) {
      const newChecklists = await prisma.checklist.findMany({
        where: { projectId: newProject.id },
        orderBy: { id: 'asc' },
      });
      source.checklists.forEach((c) => {
        const found = newChecklists.find((n) => n.nome === c.nome);
        if (found) checklistIdMap.set(c.id, found.id);
      });
    }

    for (const pipeline of source.pipelines) {
      const newPipeline = await prisma.pipeline.create({
        data: {
          projectId: newProject.id,
          nome: pipeline.nome,
        },
      });

      for (const col of pipeline.colunas) {
        const newCol = await prisma.column.create({
          data: {
            pipelineId: newPipeline.id,
            nome: col.nome,
            ordem: col.ordem,
            cor: col.cor ?? undefined,
            corFonte: col.corFonte ?? undefined,
            responsavelNome: col.responsavelNome ?? undefined,
          },
        });

        for (const task of col.tasks) {
          const epicId = task.epicId && checklistIdMap.has(task.epicId)
            ? checklistIdMap.get(task.epicId)!
            : undefined;

          await prisma.task.create({
            data: {
              columnId: newCol.id,
              epicId,
              titulo: task.titulo,
              descricao: task.descricao ?? undefined,
              dataVencimento: task.dataVencimento ?? undefined,
              dataCriacao: task.dataCriacao || new Date().toISOString().split('T')[0],
              prioridade: task.prioridade ?? undefined,
              tags: task.tags ?? undefined,
              responsavelNome: task.responsavelNome ?? undefined,
              responsavelAvatar: task.responsavelAvatar ?? undefined,
              subtasks: task.subtasks?.length
                ? {
                    create: task.subtasks.map((s) => ({
                      titulo: s.titulo,
                      concluida: false,
                      dataVencimento: s.dataVencimento ?? undefined,
                      responsavelNome: (s as any).responsavelNome ?? undefined,
                    })),
                  }
                : undefined,
            },
          });
        }
      }
    }

    await logActivity({
      request,
      projectId: newProject.id,
      action: 'project_cloned',
      details: { sourceProjectId, newProjectId: newProject.id },
    });

    const created = await prisma.project.findUnique({
      where: { id: newProject.id },
      include: {
        projectStatus: true,
        equipe: true,
        labels: true,
        checklists: { include: { items: true } },
        timeline: true,
        pipelines: {
          where: { deletedAt: null },
          include: {
            colunas: {
              include: {
                tasks: {
                  include: { subtasks: true },
                  where: { deletedAt: null },
                },
              },
              orderBy: { ordem: 'asc' },
            },
          },
        },
      },
    });

    if (!created) {
      return NextResponse.json({ error: 'Erro ao criar projeto clonado' }, { status: 500 });
    }

    const taskIsCompleted = (t: { subtasks?: { concluida: boolean }[] }) => {
      const subs = t.subtasks ?? [];
      return subs.length > 0 && subs.every((s) => s.concluida);
    };

    let totalTasks = 0;
    let completedTasks = 0;
    for (const p of created.pipelines ?? []) {
      for (const col of p.colunas ?? []) {
        const tasks = (col.tasks ?? []).filter((t: { deletedAt?: Date | null }) => t.deletedAt == null);
        for (const t of tasks) {
          totalTasks += 1;
          if (taskIsCompleted(t)) completedTasks += 1;
        }
      }
    }
    const tarefasAtivas = Math.max(0, totalTasks - completedTasks);
    const progresso = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return NextResponse.json({
      id: created.id,
      empresa: created.empresa,
      projectStatusId: created.projectStatusId ?? undefined,
      projectStatus: created.projectStatus
        ? { id: created.projectStatus.id, nome: created.projectStatus.nome, cor: created.projectStatus.cor, ordem: created.projectStatus.ordem }
        : undefined,
      gerente: created.gerente,
      diasAtraso: created.diasAtraso,
      statusBadge: created.statusBadge,
      indiceVelocidade: created.indiceVelocidade ?? null,
      velocidadeData: [],
      burndownData: [],
      totalWork: totalTasks,
      statusVelocidade: created.statusVelocidade,
      progresso,
      proximaConclusao: created.proximaConclusao,
      tarefasAtivas,
      statusGeral: created.dataFim ? created.statusGeral : '-',
      dataInicio: created.dataInicio,
      dataFim: created.dataFim ?? undefined,
      descricao: created.descricao ?? undefined,
      equipe: created.equipe.map((m) => ({ nome: m.nome, cargo: m.cargo, avatar: m.avatar ?? undefined })),
      checklists: created.checklists.map((c) => ({
        id: c.id,
        nome: c.nome,
        items: c.items.map((i) => ({ id: i.id, titulo: i.titulo, concluido: i.concluido })),
      })),
      labels: created.labels.map((l) => ({ id: l.id, nome: l.nome, cor: l.cor, ordem: l.ordem })),
      timeline: created.timeline.map((t) => ({ data: t.data, evento: t.evento, tipo: t.tipo })),
      pipelines: (created.pipelines ?? []).map((p) => ({
        id: p.id,
        nome: p.nome,
        colunas: (p.colunas ?? []).map((col) => ({
          id: col.id,
          nome: col.nome,
          ordem: col.ordem,
          cor: col.cor ?? undefined,
          responsavelNome: col.responsavelNome ?? undefined,
          tasks: (col.tasks ?? []).map((t: any) => ({
            id: t.id,
            titulo: t.titulo,
            descricao: t.descricao ?? undefined,
            prioridade: t.prioridade ?? undefined,
            responsavel: t.responsavelNome ? { nome: t.responsavelNome } : undefined,
            subtasks: (t.subtasks ?? []).map((s: any) => ({ id: s.id, titulo: s.titulo, concluida: s.concluida })),
          })),
        })),
      })),
      metricas: { tarefasAtivas, concluidas: completedTasks, atrasadas: 0 },
    });
  } catch (error) {
    serverLogger.error('Error cloning project', error, { route: '/api/projects/[id]/clone' });
    return NextResponse.json({ error: 'Erro ao clonar projeto' }, { status: 500 });
  }
}
