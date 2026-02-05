'use client';

import { ArrowLeft, TrendingUp, Users, CheckCircle2, Clock, AlertTriangle, Calendar } from 'lucide-react';
import Link from 'next/link';
import { mockProjects } from '@/lib/mock-data';
import { BottomGlow } from '@/components/bottom-glow';
import { ProgressBar } from '@tremor/react';
import { StatusPieChart } from '@/components/status-pie-chart';
import { useMemo } from 'react';

export default function DashboardOverviewPage() {
    // Calcula métricas agregadas de todos os projetos
    const overallMetrics = useMemo(() => {
        const totalProjects = mockProjects.length;
        const totalProgress = mockProjects.reduce((sum, p) => sum + p.progresso, 0);
        const averageProgress = Math.round(totalProgress / totalProjects);

        // Conta projetos por status
        const excellent = mockProjects.filter(p => p.statusGeral === 'Excelente').length;
        const attention = mockProjects.filter(p => p.statusGeral === 'Atenção').length;
        const critical = mockProjects.filter(p => p.statusGeral === 'Crítico').length;

        // Conta  projetos por statusProjeto
        const statusCount = {
            atrasado: mockProjects.filter(p => p.statusProjeto === 'Atrasado').length,
            noPrazo: mockProjects.filter(p => p.statusProjeto === 'No Prazo').length,
            paraComecar: mockProjects.filter(p => p.statusProjeto === 'Para Começar').length,
            standBy: mockProjects.filter(p => p.statusProjeto === 'Stand By').length,
            aguardandoConfirmacao: mockProjects.filter(p => p.statusProjeto === 'Aguardando Confirmação').length,
        };

        // Soma todas as tarefas
        let totalTasks = 0;
        let completedTasks = 0;
        let activeTasks = 0;

        mockProjects.forEach(project => {
            if (project.checklists) {
                project.checklists.forEach(checklist => {
                    totalTasks += checklist.items.length;
                    completedTasks += checklist.items.filter(item => item.concluido).length;
                });
            }
        });

        activeTasks = totalTasks - completedTasks;

        // Agrupa membros de equipe com seus projetos
        const memberProjects = new Map<string, string[]>();
        mockProjects.forEach(project => {
            if (project.equipe) {
                project.equipe.forEach(member => {
                    const currentProjects = memberProjects.get(member.nome) || [];
                    memberProjects.set(member.nome, [...currentProjects, project.empresa]);
                });
            }
        });

        // Agrupa projetos por status de onboarding
        const onboardingGroups = {
            esperandoContrato: mockProjects.filter(p => p.statusOnboarding === 'Esperando Contrato'),
            esperandoPagamento: mockProjects.filter(p => p.statusOnboarding === 'Esperando Pagamento'),
            iniciarOnboarding: mockProjects.filter(p => p.statusOnboarding === 'Iniciar Onboarding'),
        };

        return {
            totalProjects,
            averageProgress,
            excellent,
            attention,
            critical,
            statusCount,
            totalTasks,
            completedTasks,
            activeTasks,
            totalMembers: memberProjects.size,
            memberProjects,
            onboardingGroups,
        };
    }, []);

    const statusChartData = [
        { label: 'No Prazo', value: overallMetrics.statusCount.noPrazo, color: '#10B981' },
        { label: 'Atrasado', value: overallMetrics.statusCount.atrasado, color: '#EF4444' },
        { label: 'Para Começar', value: overallMetrics.statusCount.paraComecar, color: '#3B82F6' },
        { label: 'Stand By', value: overallMetrics.statusCount.standBy, color: '#F59E0B' },
        { label: 'Aguardando Confirmação', value: overallMetrics.statusCount.aguardandoConfirmacao, color: '#8B5CF6' },
    ].filter(item => item.value > 0); // Remove categorias com 0

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#151520] to-[#0A0A0F] relative">
            <BottomGlow />

            <div className="relative z-10 min-h-screen p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-[#9CA3AF] hover:text-white transition-colors mb-6"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">Voltar aos Projetos</span>
                        </Link>

                        <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-[#B0B0B0] to-[#808080] bg-clip-text text-transparent mb-2">
                            Dashboard Geral
                        </h1>
                        <p className="text-[#9CA3AF]">
                            Visão consolidada de todos os projetos ativos
                        </p>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Total Projects */}
                        <div className="bg-gradient-to-br from-[#151520] to-[#0A0A0F] border border-[#1F1F2E] rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-[#8B5CF6]" />
                                </div>
                                <span className="text-3xl font-bold text-white">{overallMetrics.totalProjects}</span>
                            </div>
                            <h3 className="text-sm text-[#9CA3AF] mb-1">Total de Projetos</h3>
                            <p className="text-xs text-[#9CA3AF]">
                                {overallMetrics.statusCount.noPrazo} no prazo · {overallMetrics.statusCount.atrasado} atrasados
                            </p>
                        </div>

                        {/* Average Progress */}
                        <div className="bg-gradient-to-br from-[#151520] to-[#0A0A0F] border border-[#1F1F2E] rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-lg bg-[#00D084]/10 flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-[#00D084]" />
                                </div>
                                <span className="text-3xl font-bold text-white">{overallMetrics.averageProgress}%</span>
                            </div>
                            <h3 className="text-sm text-[#9CA3AF] mb-2">Progresso Médio</h3>
                            <ProgressBar
                                value={overallMetrics.averageProgress}
                                color={overallMetrics.averageProgress > 70 ? 'emerald' : overallMetrics.averageProgress > 40 ? 'yellow' : 'red'}
                                className="mt-2"
                            />
                        </div>

                        {/* Tasks Overview */}
                        <div className="bg-gradient-to-br from-[#151520] to-[#0A0A0F] border border-[#1F1F2E] rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-lg bg-[#00D084]/10 flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-[#00D084]" />
                                </div>
                                <span className="text-3xl font-bold text-white">{overallMetrics.completedTasks}</span>
                            </div>
                            <h3 className="text-sm text-[#9CA3AF] mb-1">Tarefas Concluídas</h3>
                            <p className="text-xs text-[#9CA3AF]">
                                {overallMetrics.activeTasks} ativas · {overallMetrics.totalTasks} total
                            </p>
                        </div>

                        {/* Team Members */}
                        <div className="bg-gradient-to-br from-[#151520] to-[#0A0A0F] border border-[#1F1F2E] rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center">
                                    <Users className="w-6 h-6 text-[#8B5CF6]" />
                                </div>
                                <span className="text-3xl font-bold text-white">{overallMetrics.totalMembers}</span>
                            </div>
                            <h3 className="text-sm text-[#9CA3AF] mb-1">Membros da Equipe</h3>
                            <p className="text-xs text-[#9CA3AF]">Trabalhando em {overallMetrics.totalProjects} projetos</p>
                        </div>
                    </div>

                    {/* Status Distribution Pie Chart */}
                    <div className="bg-gradient-to-br from-[#151520] to-[#0A0A0F] border border-[#1F1F2E] rounded-xl p-6 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-6">Distribuição de Status dos Projetos</h2>
                        <StatusPieChart data={statusChartData} />
                    </div>

                    {/* Onboarding Status Lists */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Esperando Contrato */}
                        <div className="bg-gradient-to-br from-[#151520] to-[#0A0A0F] border border-[#1F1F2E] rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white">Esperando Contrato</h3>
                                <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm font-medium">
                                    {overallMetrics.onboardingGroups.esperandoContrato.length}
                                </span>
                            </div>
                            <div className="space-y-3">
                                {overallMetrics.onboardingGroups.esperandoContrato.length > 0 ? (
                                    overallMetrics.onboardingGroups.esperandoContrato.map((project) => (
                                        <Link
                                            key={project.id}
                                            href={`/projects/${project.id}`}
                                            className="block p-3 bg-[#0A0A0F] border border-blue-500/20 rounded-lg hover:border-blue-500/50 hover:bg-[#151520] transition-all group"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                                                    {project.empresa}
                                                </h4>
                                                <span className="text-xs text-blue-400">{project.progresso}%</span>
                                            </div>
                                            <p className="text-xs text-[#9CA3AF]">Gerente: {project.gerente}</p>
                                        </Link>
                                    ))
                                ) : (
                                    <p className="text-sm text-[#9CA3AF] text-center py-4">Nenhum projeto aguardando contrato</p>
                                )}
                            </div>
                        </div>

                        {/* Esperando Pagamento */}
                        <div className="bg-gradient-to-br from-[#151520] to-[#0A0A0F] border border-[#1F1F2E] rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white">Esperando Pagamento</h3>
                                <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-sm font-medium">
                                    {overallMetrics.onboardingGroups.esperandoPagamento.length}
                                </span>
                            </div>
                            <div className="space-y-3">
                                {overallMetrics.onboardingGroups.esperandoPagamento.length > 0 ? (
                                    overallMetrics.onboardingGroups.esperandoPagamento.map((project) => (
                                        <Link
                                            key={project.id}
                                            href={`/projects/${project.id}`}
                                            className="block p-3 bg-[#0A0A0F] border border-yellow-500/20 rounded-lg hover:border-yellow-500/50 hover:bg-[#151520] transition-all group"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-semibold text-white group-hover:text-yellow-400 transition-colors">
                                                    {project.empresa}
                                                </h4>
                                                <span className="text-xs text-yellow-400">{project.progresso}%</span>
                                            </div>
                                            <p className="text-xs text-[#9CA3AF]">Gerente: {project.gerente}</p>
                                        </Link>
                                    ))
                                ) : (
                                    <p className="text-sm text-[#9CA3AF] text-center py-4">Nenhum projeto aguardando pagamento</p>
                                )}
                            </div>
                        </div>

                        {/* Iniciar Onboarding */}
                        <div className="bg-gradient-to-br from-[#151520] to-[#0A0A0F] border border-[#1F1F2E] rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white">Iniciar Onboarding</h3>
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-sm font-medium">
                                    {overallMetrics.onboardingGroups.iniciarOnboarding.length}
                                </span>
                            </div>
                            <div className="space-y-3">
                                {overallMetrics.onboardingGroups.iniciarOnboarding.length > 0 ? (
                                    overallMetrics.onboardingGroups.iniciarOnboarding.map((project) => (
                                        <Link
                                            key={project.id}
                                            href={`/projects/${project.id}`}
                                            className="block p-3 bg-[#0A0A0F] border border-emerald-500/20 rounded-lg hover:border-emerald-500/50 hover:bg-[#151520] transition-all group"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                                                    {project.empresa}
                                                </h4>
                                                <span className="text-xs text-emerald-400">{project.progresso}%</span>
                                            </div>
                                            <p className="text-xs text-[#9CA3AF]">Gerente: {project.gerente}</p>
                                        </Link>
                                    ))
                                ) : (
                                    <p className="text-sm text-[#9CA3AF] text-center py-4">Nenhum projeto pronto para onboarding</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Team Members and Their Projects */}
                    <div className="bg-gradient-to-br from-[#151520] to-[#0A0A0F] border border-[#1F1F2E] rounded-xl p-6 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-6">Membros da Equipe e Seus Projetos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from(overallMetrics.memberProjects.entries()).map(([member, projects]) => (
                                <div
                                    key={member}
                                    className="p-4 bg-[#0A0A0F] border border-[#1F1F2E] rounded-lg hover:border-[#8B5CF6]/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-[#8B5CF6] flex items-center justify-center text-white font-semibold">
                                            {member.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold">{member}</h3>
                                            <p className="text-xs text-[#9CA3AF]">{projects.length} projeto(s)</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {projects.map((projectName, idx) => {
                                            const project = mockProjects.find(p => p.empresa === projectName);
                                            return project ? (
                                                <Link
                                                    key={idx}
                                                    href={`/projects/${project.id}`}
                                                    className="block p-2 bg-[#151520] rounded text-xs text-[#D0D0D0] hover:bg-[#1F1F2E] hover:text-white transition-colors"
                                                >
                                                    {projectName}
                                                </Link>
                                            ) : (
                                                <div key={idx} className="p-2 bg-[#151520] rounded text-xs text-[#D0D0D0]">
                                                    {projectName}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Projects Progress Overview */}
                    <div className="bg-gradient-to-br from-[#151520] to-[#0A0A0F] border border-[#1F1F2E] rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-white mb-6">Progresso de Cada Projeto</h2>
                        <div className="space-y-4">
                            {mockProjects.map((project) => {
                                const getStatusColor = () => {
                                    switch (project.statusProjeto) {
                                        case 'No Prazo': return 'text-emerald-500';
                                        case 'Atrasado': return 'text-red-500';
                                        case 'Para Começar': return 'text-blue-500';
                                        case 'Stand By': return 'text-yellow-500';
                                        case 'Aguardando Confirmação': return 'text-purple-500';
                                        default: return 'text-gray-500';
                                    }
                                };

                                const getStatusBg = () => {
                                    switch (project.statusProjeto) {
                                        case 'No Prazo': return 'bg-emerald-500/10';
                                        case 'Atrasado': return 'bg-red-500/10';
                                        case 'Para Começar': return 'bg-blue-500/10';
                                        case 'Stand By': return 'bg-yellow-500/10';
                                        case 'Aguardando Confirmação': return 'bg-purple-500/10';
                                        default: return 'bg-gray-500/10';
                                    }
                                };

                                return (
                                    <Link
                                        key={project.id}
                                        href={`/projects/${project.id}`}
                                        className="block p-4 bg-[#0A0A0F] border border-[#1F1F2E] rounded-lg hover:border-[#8B5CF6]/50 transition-all group"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-white group-hover:text-[#8B5CF6] transition-colors mb-1">
                                                    {project.empresa}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm text-[#9CA3AF]">Gerente: {project.gerente}</p>
                                                    {project.statusProjeto && (
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBg()} ${getStatusColor()}`}>
                                                            {project.statusProjeto}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-bold text-white">{project.progresso}%</span>
                                                <p className="text-xs text-[#9CA3AF]">Progresso</p>
                                            </div>
                                        </div>
                                        <ProgressBar
                                            value={project.progresso}
                                            color={project.progresso > 70 ? 'emerald' : project.progresso > 40 ? 'yellow' : 'red'}
                                        />
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
