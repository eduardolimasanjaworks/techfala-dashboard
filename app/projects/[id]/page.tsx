'use client';

import { use, useState, useMemo, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { ProjectDetailHeader } from '@/components/project-detail-header';
import { ProjectInfoCard } from '@/components/project-info-card';
import { MultiChecklist } from '@/components/multi-checklist';
import { ProjectDates } from '@/components/project-dates';
import { ProjectComments } from '@/components/project-comments';
import { BottomGlow } from '@/components/bottom-glow';
import { BurndownChart } from '@/components/burndown-chart';
import { ProgressBar } from '@tremor/react';
import { PipelineManager } from '@/components/pipeline-manager';
import { clientError } from '@/lib/client-logger';
import {
    Users,
    TrendingUp,
    CheckCircle2,
    Clock,
    ListChecks,
    CalendarDays,
    MessageSquare,
    Activity,
    Columns,
    Trash2,
    History
} from 'lucide-react';
import { ProjectTrash } from '@/components/project-trash';
import { ProjectActivities } from '@/components/project-activities';
import { ProjectTeam } from '@/components/project-team';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
    const router = useRouter();
    const { id } = use(params);
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // Estado local para os checklists - permite atualização em tempo real
    const [checklists, setChecklists] = useState<any[]>([]);
    // Estado local para os pipelines - permite atualização em tempo real
    const [pipelines, setPipelines] = useState<any[]>([]);
    // Incrementa quando pipelines/tasks mudam para forçar refetch do registro de atividades
    const [activityRefreshKey, setActivityRefreshKey] = useState(0);

    useEffect(() => {
        fetchProject();
    }, [id]);

    // Métricas a partir dos dados reais do Kanban (pipelines/colunas/tasks)
    const metrics = useMemo(() => {
        if (!pipelines || pipelines.length === 0) {
            return {
                totalTasks: 0,
                completedTasks: 0,
                activeTasks: 0,
                progress: 0,
                totalSubtasks: 0,
                completedSubtasks: 0,
            };
        }
        // Uma task é concluída quando todas as subtasks estão concluídas (subtasks mandam, não a coluna)
        const taskIsCompleted = (t: { subtasks?: { concluida: boolean }[] }) => {
            const subs = t.subtasks ?? [];
            return subs.length > 0 && subs.every((s) => s.concluida);
        };
        let totalTasks = 0;
        let completedTasks = 0;
        for (const p of pipelines) {
            for (const col of p.colunas || []) {
                const tasks = col.tasks || [];
                for (const t of tasks) {
                    totalTasks += 1;
                    if (taskIsCompleted(t)) completedTasks += 1;
                }
            }
        }
        const activeTasks = totalTasks - completedTasks;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const allSubtasks = pipelines.flatMap((p: { colunas?: { tasks?: { subtasks?: unknown[] }[] }[] }) => (p.colunas || []).flatMap((c: { tasks?: { subtasks?: unknown[] }[] }) => (c.tasks || []).flatMap((t: { subtasks?: unknown[] }) => t.subtasks || [])));
        const totalSubtasks = allSubtasks.length;
        const completedSubtasks = allSubtasks.filter((s) => (s as { concluida?: boolean }).concluida).length;
        return {
            totalTasks,
            completedTasks,
            activeTasks,
            progress,
            totalSubtasks,
            completedSubtasks,
        };
    }, [pipelines]);

    // Burndown só existe quando há data fim: estimativa proporcional até dataFim
    const burndownFromKanban = useMemo(() => {
        if (!project?.dataFim || !project?.dataInicio) return null;
        const start = new Date(project.dataInicio);
        const end = new Date(project.dataFim);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        if (today <= start) return null;
        const total = metrics.totalTasks;
        const workRemainingNow = Math.max(0, total - metrics.completedTasks);
        const daysTotal = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
        const daysUntilToday = Math.min(daysTotal, Math.ceil((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
        if (daysUntilToday < 1) return null;
        const points: number[] = [];
        for (let i = 0; i < daysUntilToday; i++) {
            points.push(i === daysUntilToday - 1 ? workRemainingNow : total);
        }
        // Gráfico precisa de pelo menos 2 pontos
        if (points.length === 1) points.unshift(total);
        return { workRemaining: points, totalWork: total };
    }, [project?.dataInicio, project?.dataFim, metrics.totalTasks, metrics.completedTasks]);

    const fetchProject = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/projects/${id}`, { credentials: 'include' });
            if (response.status === 401) {
                router.push('/login');
                return;
            }
            if (response.ok) {
                const data = await response.json();
                setProject(data);
                setChecklists(data.checklists || []);
                setPipelines(data.pipelines || []);
            } else {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/56aa2456-555e-4a18-938a-fda027b38124',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/projects/[id]/page.tsx:fetchProject',message:'response not ok',data:{status:response.status,url:response.url},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
                // #endregion
                if (response.status === 404) {
                    notFound();
                }
            }
        } catch (e) {
            // #region agent log
            const errMsg = e instanceof Error ? e.message : String(e);
            fetch('http://127.0.0.1:7242/ingest/56aa2456-555e-4a18-938a-fda027b38124',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/projects/[id]/page.tsx:fetchProject:catch',message:'fetch threw',data:{errMsg},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
            // #endregion
            clientError('fetch_project');
        } finally {
            setLoading(false);
        }
    };

    const handleChecklistsChange = async (newChecklists: any[]) => {
        setChecklists(newChecklists);
        // Salvar no banco
        for (const checklist of newChecklists) {
            try {
                await fetch('/api/checklists', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: checklist.id,
                        nome: checklist.nome,
                        items: checklist.items,
                    }),
                });
            } catch {
                clientError('update_checklist');
            }
        }
    };

    const handlePipelinesChange = (newPipelines: any[]) => {
        setPipelines(newPipelines);
        setActivityRefreshKey((k) => k + 1); // Atualiza o registro de atividades (pipeline criado, card movido, etc.)
        // Persistência é feita pelas APIs específicas: PATCH /api/columns (renomear/reordenar), PUT/DELETE /api/tasks, POST /api/columns/.../tasks.
        // Não fazemos PUT em todos os pipelines a cada mudança (era lento e podia sobrescrever colunas no banco).
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#151520] to-[#0A0A0F] relative flex items-center justify-center">
                <div className="text-white/40">Carregando projeto...</div>
            </div>
        );
    }

    if (!project) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#151520] to-[#0A0A0F] relative">
            <BottomGlow />

            <div className="relative z-10 min-h-screen p-6">
                <div className="max-w-7xl mx-auto">
                    <ProjectDetailHeader project={project} progressOverride={metrics.progress} onProjectUpdated={fetchProject} />

                    {/* Visão por Epic (Checklists = Epics) */}
                    {checklists && checklists.length > 0 && pipelines && pipelines.length > 0 && (() => {
                        const epicMap = new Map<string, { nome: string; tasks: { id: string; titulo: string; pipelineNome: string; colunaNome: string }[] }>();
                        for (const c of checklists) {
                            epicMap.set(c.id, { nome: c.nome, tasks: [] });
                        }
                        let semEpic: { id: string; titulo: string; pipelineNome: string; colunaNome: string }[] = [];
                        for (const p of pipelines) {
                            for (const col of p.colunas || []) {
                                for (const t of col.tasks || []) {
                                    const item = { id: t.id, titulo: t.titulo, pipelineNome: p.nome, colunaNome: col.nome };
                                    if (t.epicId && epicMap.has(t.epicId)) {
                                        epicMap.get(t.epicId)!.tasks.push(item);
                                    } else {
                                        semEpic.push(item);
                                    }
                                }
                            }
                        }
                        const epicsWithTasks = [...epicMap.entries()].map(([id, v]) => ({ id, ...v }));
                        if (epicsWithTasks.every(e => e.tasks.length === 0) && semEpic.length === 0) return null;
                        return (
                            <div className="mb-6">
                                <ProjectInfoCard title="Visão por Epic" icon={<ListChecks />}>
                                    <p className="text-sm text-[#9CA3AF] mb-4">Checklists como Epics: visão macro do que está em cada pipeline.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {epicsWithTasks.map((epic) => (
                                            <div key={epic.id} className="bg-[#0A0A0F] rounded-lg border border-[#1F1F2E]/50 p-4">
                                                <div className="font-medium text-white mb-2">{epic.nome}</div>
                                                <ul className="text-sm text-[#9CA3AF] space-y-1">
                                                    {epic.tasks.length === 0 ? <li>Nenhuma task vinculada</li> : epic.tasks.map((t) => (
                                                        <li key={t.id} className="truncate" title={`${t.pipelineNome} → ${t.colunaNome}`}>{t.titulo}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                        {semEpic.length > 0 && (
                                            <div className="bg-[#0A0A0F] rounded-lg border border-[#1F1F2E]/50 p-4">
                                                <div className="font-medium text-[#9CA3AF] mb-2">Sem Epic</div>
                                                <ul className="text-sm text-[#9CA3AF] space-y-1">
                                                    {semEpic.slice(0, 10).map((t) => (
                                                        <li key={t.id} className="truncate" title={`${t.pipelineNome} → ${t.colunaNome}`}>{t.titulo}</li>
                                                    ))}
                                                    {semEpic.length > 10 && <li>+{semEpic.length - 10} mais</li>}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </ProjectInfoCard>
                            </div>
                        );
                    })()}

                    {/* Kanban/Pipelines Section - full width, sem card para modais escaparem */}
                    <div className="mb-6 -mx-6 px-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-[#A78BFA] ring-1 ring-white/10">
                                <Columns className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-medium tracking-wide text-white/60 uppercase">Kanban / Pipelines</h3>
                        </div>
                        <div className="overflow-visible">
                            <PipelineManager
                                pipelines={pipelines}
                                onPipelinesChange={handlePipelinesChange}
                                equipe={project.equipe || []}
                                epics={checklists || []}
                                labels={project.labels ?? []}
                                projectId={id}
                                onLabelCreated={(label) => setProject((prev: any) => ({ ...prev, labels: [...(prev?.labels || []), label] }))}
                                onLabelDeleted={(labelId) => setProject((prev: any) => ({ ...prev, labels: (prev?.labels || []).filter((l: any) => l.id !== labelId) }))}
                            />
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Main Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Project Description */}
                            {project.descricao && (
                                <ProjectInfoCard title="Descrição do Projeto">
                                    <p className="text-[#D0D0D0] leading-relaxed">
                                        {project.descricao}
                                    </p>
                                </ProjectInfoCard>
                            )}

                            {/* Metrics Overview - Calculado pelos Checklists */}
                            <ProjectInfoCard title="Métricas e Progresso" icon={<TrendingUp />}>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm">Progresso Geral (Kanban)</span>
                                            <span className="text-white font-semibold">{metrics.progress}%</span>
                                        </div>
                                        <ProgressBar
                                            value={metrics.progress}
                                            color={metrics.progress > 70 ? 'emerald' : metrics.progress > 40 ? 'yellow' : 'red'}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 pt-4">
                                        <div className="text-center p-3 bg-[#0A0A0F] rounded-lg">
                                            <div className="flex items-center justify-center gap-2 mb-1">
                                                <Clock className="w-4 h-4 text-yellow-500" />
                                                <span className="text-2xl font-bold text-white">
                                                    {metrics.activeTasks}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#9CA3AF]">Não Concluídas</p>
                                        </div>
                                        <div className="text-center p-3 bg-[#0A0A0F] rounded-lg">
                                            <div className="flex items-center justify-center gap-2 mb-1">
                                                <CheckCircle2 className="w-4 h-4 text-[#00D084]" />
                                                <span className="text-2xl font-bold text-white">
                                                    {metrics.completedTasks}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#9CA3AF]">Concluídas</p>
                                        </div>
                                        <div className="text-center p-3 bg-[#0A0A0F] rounded-lg">
                                            <div className="flex items-center justify-center gap-2 mb-1">
                                                <ListChecks className="w-4 h-4 text-[#8B5CF6]" />
                                                <span className="text-2xl font-bold text-white">
                                                    {metrics.totalTasks}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#9CA3AF]">Total</p>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-[#1F1F2E]">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-white">
                                                <div className="p-1.5 bg-[#8B5CF6]/10 rounded-lg">
                                                    <Activity className="w-4 h-4 text-[#8B5CF6]" />
                                                </div>
                                                <span className="font-medium">Índice de Velocidade</span>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${project.statusVelocidade === 'No Prazo'
                                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                {project.statusVelocidade}
                                            </span>
                                        </div>

                                        {project.dataFim && (() => {
                                            const hasTasks = (burndownFromKanban?.totalWork ?? 0) > 0;
                                            if (!hasTasks) {
                                                return (
                                                    <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3" role="alert">
                                                        <span className="text-amber-400 text-sm font-medium">Cards precisam de preenchimento</span>
                                                    </div>
                                                );
                                            }
                                            if (!burndownFromKanban) return null;
                                            return (
                                            <div className="bg-[#0f0f16] rounded-xl border border-[#1F1F2E]/50 overflow-hidden">
                                                <div className="p-4 border-b border-[#1F1F2E]/50 flex items-baseline gap-2">
                                                    <span className="text-3xl font-bold text-white tracking-tight">
                                                        {metrics.totalTasks - metrics.completedTasks}
                                                    </span>
                                                    <span className="text-sm text-[#9CA3AF]">
                                                        pontos / sprint (restante)
                                                    </span>
                                                </div>

                                                <div className="p-4 bg-[#0A0A0F]/50 pt-6">
                                                    <div className="h-32 w-full">
                                                        <BurndownChart
                                                            workRemaining={burndownFromKanban.workRemaining}
                                                            totalWork={burndownFromKanban.totalWork}
                                                            color={project.statusVelocidade === 'No Prazo' ? 'purple' : 'red'}
                                                            height={128}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </ProjectInfoCard>

                            {/* Team */}
                            <ProjectInfoCard title="Equipe do Projeto" icon={<Users />}>
                                <ProjectTeam
                                    projectId={id}
                                    members={project.equipe || []}
                                    onChanged={fetchProject}
                                />
                            </ProjectInfoCard>

                            {/* Project Dates */}
                            <ProjectInfoCard title="Datas do Projeto" icon={<CalendarDays />}>
                                <ProjectDates
                                    projectId={id}
                                    dataInicio={project.dataInicio}
                                    dataFim={project.dataFim}
                                    onSaved={fetchProject}
                                />
                            </ProjectInfoCard>

                            {/* Comments */}
                            <ProjectInfoCard title="Comentários" icon={<MessageSquare />}>
                                <ProjectComments comments={project.comentarios || []} />
                            </ProjectInfoCard>
                        </div>

                        {/* Right Column - Checklists, Lixeira, Atividades */}
                        <div className="space-y-6">
                            {/* Lixeira */}
                            <ProjectInfoCard title="Lixeira" icon={<Trash2 />}>
                                <ProjectTrash
                                    projectId={id}
                                    onRestore={fetchProject}
                                />
                            </ProjectInfoCard>

                            {/* Registro de atividades */}
                            <ProjectInfoCard title="Registro de atividades" icon={<History />}>
                                <ProjectActivities projectId={id} limit={30} refreshTrigger={activityRefreshKey} />
                            </ProjectInfoCard>

                            {/* Checklists */}
                            {checklists && checklists.length > 0 && (
                                <ProjectInfoCard title="Checklists do Projeto" icon={<ListChecks />}>
                                    <MultiChecklist
                                        checklists={checklists}
                                        onChecklistsChange={handleChecklistsChange}
                                    />
                                </ProjectInfoCard>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
