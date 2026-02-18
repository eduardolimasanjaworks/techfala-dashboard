import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';
import { getClientErrorMessage } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include') || 'full';
    // include: minimal | pipelines | full
    // minimal: projetos sem pipelines
    // pipelines: projetos + pipelines + colunas (sem tasks)
    // full: projetos + pipelines + colunas + tasks (cards)
    const includeTasks = include === 'full';
    const includePipelines = include === 'pipelines' || include === 'full';

    const projects = await prisma.project.findMany({
      include: {
        projectStatus: true,
        equipe: { orderBy: { nome: 'asc' } },
        timeline: { orderBy: { data: 'asc' } },
        checklists: {
          include: { items: { orderBy: { id: 'asc' } } },
          orderBy: { id: 'asc' },
        },
        comentarios: { orderBy: { data: 'desc' } },
        pipelines: includePipelines
          ? {
              include: {
                colunas: {
                  include: includeTasks
                    ? {
                        tasks: {
                          include: { subtasks: { orderBy: { id: 'asc' } } },
                          orderBy: { id: 'asc' },
                        },
                      }
                    : undefined,
                  orderBy: { ordem: 'asc' },
                },
              },
              orderBy: { id: 'asc' },
            }
          : false,
        velocidadeData: { orderBy: { ordem: 'asc' } },
        burndownData: { orderBy: { ordem: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Uma task é concluída quando todas as subtasks estão concluídas (subtasks mandam, não a coluna)
    const taskIsCompleted = (t: { subtasks?: { concluida: boolean }[] }) => {
      const subs = t.subtasks ?? [];
      return subs.length > 0 && subs.every((s) => s.concluida);
    };

    // Transformar os dados para o formato esperado pelo frontend
    const transformedProjects = projects.map((project) => {
      const activePipelines = (project.pipelines ?? []).filter((p: { deletedAt?: Date | null }) => p.deletedAt == null);
      let totalTasks = 0;
      let completedTasks = 0;
      for (const p of activePipelines) {
        const cols = (p as { colunas?: { tasks?: { deletedAt?: Date | null; subtasks?: { concluida: boolean }[] }[] }[] }).colunas ?? [];
        for (const col of cols) {
          const tasks = (col.tasks ?? []).filter((t: { deletedAt?: Date | null }) => t.deletedAt == null);
          for (const t of tasks) {
            totalTasks += 1;
            if (taskIsCompleted(t)) completedTasks += 1;
          }
        }
      }
      const tarefasAtivasComputadas = Math.max(0, totalTasks - completedTasks);
      const progressoComputado = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : project.progresso;

      // Burndown baseado nas tasks reais do Kanban (não no BurndownData do banco)
      const totalWork = totalTasks;
      const workRemaining = Math.max(0, totalWork - completedTasks);
      let burndownPoints: number[] = [];
      if (totalWork > 0) {
        const dataInicio = project.dataInicio;
        const dataFim = project.dataFim;
        if (dataInicio && dataFim) {
          const start = new Date(dataInicio);
          const end = new Date(dataFim);
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
        if (burndownPoints.length < 2) {
          burndownPoints = Array(6).fill(totalWork);
          burndownPoints[burndownPoints.length - 1] = workRemaining;
        }
      }

      return {
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
      velocidadeData: project.velocidadeData.map((v) => v.valor),
      burndownData: burndownPoints,
      totalWork,
      statusVelocidade: (project.dataFim ? project.statusVelocidade : null) as 'No Prazo' | 'Atrasado' | null,
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
      pipelines: (project.pipelines ?? [])
        .filter((p: { deletedAt?: Date | null }) => p.deletedAt == null)
        .map((p) => {
          type TaskCol = { id: string; titulo: string; descricao?: string | null; dataVencimento?: string | null; dataCriacao: string; prioridade?: string | null; tags?: string | null; responsavelNome?: string | null; responsavelAvatar?: string | null; deletedAt?: Date | null; subtasks: { id: string; titulo: string; concluida: boolean; dataVencimento?: string | null; responsavelNome?: string | null; responsavelAvatar?: string | null }[] };
          type PipelineCol = { id: string; nome: string; ordem: number; cor?: string | null; corFonte?: string | null; responsavelNome?: string | null; tasks?: TaskCol[] };
          const pipelineWithColunas = p as { id: string; nome: string; colunas?: PipelineCol[] };
          return {
            id: pipelineWithColunas.id,
            nome: pipelineWithColunas.nome,
            colunas: (pipelineWithColunas.colunas ?? []).map((col) => ({
              id: col.id,
              nome: col.nome,
              ordem: col.ordem,
              cor: col.cor ?? undefined,
              corFonte: col.corFonte ?? undefined,
              responsavelNome: col.responsavelNome ?? undefined,
              tasks: (col.tasks ?? [])
                .filter((t) => (t as { deletedAt?: Date | null }).deletedAt == null)
                .map((t) => ({
                  id: t.id,
                  titulo: t.titulo,
                  descricao: t.descricao || undefined,
                  dataVencimento: t.dataVencimento || undefined,
                  dataCriacao: t.dataCriacao,
                  prioridade: (t.prioridade as 'baixa' | 'media' | 'alta' | 'urgente') || undefined,
                  tags: t.tags ? JSON.parse(t.tags) : undefined,
                  responsavel: t.responsavelNome
                    ? { nome: t.responsavelNome, avatar: t.responsavelAvatar || undefined }
                    : undefined,
                  subtasks: t.subtasks.map((s) => ({
                    id: s.id,
                    titulo: s.titulo,
                    concluida: s.concluida,
                    dataVencimento: s.dataVencimento || undefined,
                    responsavel: s.responsavelNome
                      ? { nome: s.responsavelNome, avatar: s.responsavelAvatar || undefined }
                      : undefined,
                  })),
                })),
            })),
          };
        }),
      metricas: {
        tarefasAtivas: tarefasAtivasComputadas,
        concluidas: completedTasks,
        atrasadas: 0,
      },
    };
    });

    return NextResponse.json(transformedProjects);
  } catch (error) {
    serverLogger.error('Error fetching projects', error, { route: '/api/projects', method: 'GET' });
    return NextResponse.json(getClientErrorMessage('Failed to fetch projects', error), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      empresa,
      gerente,
      dataInicio,
      dataFim,
      descricao,
      email,
      telefone,
      endereco,
      orcamento,
      logo,
      equipe,
      statusOnboarding,
    } = body;

    // Validação de campos obrigatórios
    if (!empresa || !gerente) {
      return NextResponse.json(
        { error: 'Empresa e gerente são obrigatórios' },
        { status: 400 }
      );
    }

    const hasDataFim = !!body.dataFim;
    const projectStatusId = body.projectStatusId || null;
    const newProject = await prisma.project.create({
      data: {
        empresa,
        projectStatusId,
        gerente,
        dataInicio: dataInicio || new Date().toLocaleDateString('pt-BR'),
        dataFim: dataFim || null,
        descricao,
        email,
        telefone,
        endereco,
        orcamento,
        logo,
        statusBadge: hasDataFim ? 'No Prazo' : 'Em Andamento',
        statusVelocidade: hasDataFim ? 'No Prazo' : 'No Prazo',
        progresso: 0,
        proximaConclusao: '0.00',
        tarefasAtivas: 0,
        statusGeral: hasDataFim ? 'Excelente' : '-',
        statusOnboarding: statusOnboarding || null,
        equipe: equipe
          ? {
              create: equipe.map((m: { nome: string; cargo: string; avatar?: string }) => ({
                nome: m.nome,
                cargo: m.cargo,
                avatar: m.avatar,
              })),
            }
          : undefined,
      },
      include: {
        equipe: true,
        projectStatus: true,
      },
    });

    serverLogger.info('Project created', {
      projectId: newProject.id,
      empresa: newProject.empresa,
      gerente: newProject.gerente,
      hasDataFim,
      route: '/api/projects',
      method: 'POST',
    });

    // Projeto novo não tem pipelines/tasks ainda → burndown vazio
    return NextResponse.json({
      id: newProject.id,
      empresa: newProject.empresa,
      projectStatusId: newProject.projectStatusId ?? undefined,
      projectStatus: newProject.projectStatus
        ? { id: newProject.projectStatus.id, nome: newProject.projectStatus.nome, cor: newProject.projectStatus.cor, ordem: newProject.projectStatus.ordem }
        : undefined,
      gerente: newProject.gerente,
      diasAtraso: newProject.diasAtraso,
      statusBadge: newProject.statusBadge,
      indiceVelocidade: newProject.indiceVelocidade ?? null,
      velocidadeData: [],
      burndownData: [],
      totalWork: 0,
      statusVelocidade: newProject.statusVelocidade,
      progresso: newProject.progresso,
      proximaConclusao: newProject.proximaConclusao,
      tarefasAtivas: newProject.tarefasAtivas,
      statusGeral: hasDataFim ? newProject.statusGeral : '-',
      dataInicio: newProject.dataInicio,
      dataFim: newProject.dataFim || undefined,
      metricas: {
        tarefasAtivas: 0,
        concluidas: 0,
        atrasadas: 0,
      },
      equipe: newProject.equipe.map((m) => ({
        nome: m.nome,
        cargo: m.cargo,
        avatar: m.avatar || undefined,
      })),
      checklists: [],
      comentarios: [],
      pipelines: [],
      timeline: [],
    });
  } catch (error) {
    serverLogger.error('Error creating project', error, { route: '/api/projects', method: 'POST' });
    return NextResponse.json(getClientErrorMessage('Failed to create project', error), { status: 500 });
  }
}
