'use client';

import { use, useState, useMemo } from 'react';
import { notFound } from 'next/navigation';
import { mockProjects } from '@/lib/mock-data';
import { ProjectDetailHeader } from '@/components/project-detail-header';
import { ProjectInfoCard } from '@/components/project-info-card';
import { MultiChecklist } from '@/components/multi-checklist';
import { ProjectDates } from '@/components/project-dates';
import { ProjectComments } from '@/components/project-comments';
import { BottomGlow } from '@/components/bottom-glow';
import { BurndownChart } from '@/components/burndown-chart';
import { ProgressBar } from '@tremor/react';
import {
    Users,
    TrendingUp,
    CheckCircle2,
    Clock,
    ListChecks,
    CalendarDays,

    MessageSquare,
    Activity
} from 'lucide-react';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const project = mockProjects.find(p => p.id === id);

    if (!project) {
        notFound();
    }

    // Estado local para os checklists - permite atualização em tempo real
    const [checklists, setChecklists] = useState(project.checklists || []);

    // Calcula métricas baseadas nos checklists - recalcula quando checklists mudam
    const metrics = useMemo(() => {
        if (!checklists || checklists.length === 0) {
            return {
                totalTasks: 0,
                completedTasks: 0,
                activeTasks: 0,
                progress: 0,
            };
        }

        const allItems = checklists.flatMap(checklist => checklist.items);
        const totalTasks = allItems.length;
        const completedTasks = allItems.filter(item => item.concluido).length;
        const activeTasks = totalTasks - completedTasks;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
            totalTasks,
            completedTasks,
            activeTasks,
            progress,
        };
    }, [checklists]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#151520] to-[#0A0A0F] relative">
            <BottomGlow />

            <div className="relative z-10 min-h-screen p-6">
                <div className="max-w-7xl mx-auto">
                    <ProjectDetailHeader project={project} progressOverride={metrics.progress} />

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
                                            <span className="text-sm">Progresso Geral (baseado nos checklists)</span>
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

                                        <div className="bg-[#0f0f16] rounded-xl border border-[#1F1F2E]/50 overflow-hidden">
                                            <div className="p-4 border-b border-[#1F1F2E]/50 flex items-baseline gap-2">
                                                <span className="text-3xl font-bold text-white tracking-tight">
                                                    {project.indiceVelocidade}
                                                </span>
                                                <span className="text-sm text-[#9CA3AF]">
                                                    pontos / sprint
                                                </span>
                                            </div>

                                            <div className="p-4 bg-[#0A0A0F]/50">
                                                <div className="h-32 w-full">
                                                    <BurndownChart
                                                        workRemaining={project.burndownData}
                                                        totalWork={project.totalWork}
                                                        color={project.statusVelocidade === 'No Prazo' ? 'purple' : 'red'}
                                                        height={128}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ProjectInfoCard>

                            {/* Team */}
                            {project.equipe && (
                                <ProjectInfoCard title="Equipe do Projeto" icon={<Users />}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {project.equipe.map((member, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-3 p-3 bg-[#0A0A0F] rounded-lg"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-[#8B5CF6] flex items-center justify-center text-white font-semibold">
                                                    {member.nome.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium text-sm">{member.nome}</p>
                                                    <p className="text-xs text-[#9CA3AF]">{member.cargo}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ProjectInfoCard>
                            )}

                            {/* Project Dates */}
                            <ProjectInfoCard title="Datas do Projeto" icon={<CalendarDays />}>
                                <ProjectDates
                                    dataInicio={project.dataInicio}
                                    dataFim={project.dataFim}
                                />
                            </ProjectInfoCard>

                            {/* Comments */}
                            <ProjectInfoCard title="Comentários" icon={<MessageSquare />}>
                                <ProjectComments comments={project.comentarios || []} />
                            </ProjectInfoCard>
                        </div>

                        {/* Right Column - Checklists */}
                        <div className="space-y-6">
                            {/* Checklists */}
                            {checklists && checklists.length > 0 && (
                                <ProjectInfoCard title="Checklists do Projeto" icon={<ListChecks />}>
                                    <MultiChecklist
                                        checklists={checklists}
                                        onChecklistsChange={setChecklists}
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
