'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@tremor/react';
import type { Project } from '@/lib/mock-data';

interface ProjectDetailHeaderProps {
    project: Project;
    progressOverride?: number;
}

export function ProjectDetailHeader({ project, progressOverride }: ProjectDetailHeaderProps) {
    const displayProgress = progressOverride !== undefined ? progressOverride : project.progresso;

    return (
        <div className="mb-10 relative z-10">
            <Link
                href="/"
                className="group inline-flex items-center gap-2 text-[#9CA3AF] hover:text-white transition-colors mb-8 px-4 py-2 rounded-full hover:bg-white/5 w-fit"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Voltar ao Dashboard</span>
            </Link>

            <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                        <h1 className="text-5xl font-bold text-white tracking-tight">
                            {project.empresa}
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mb-6">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                            <span className="text-sm text-[#9CA3AF]">Gerente:</span>
                            <span className="text-sm font-medium text-white">{project.gerente}</span>
                        </div>

                        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${project.statusBadge === 'Em Atraso'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                            {project.statusBadge}
                        </div>

                        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${project.statusGeral === 'Excelente' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                project.statusGeral === 'Atenção' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    'bg-gray-500/10 text-gray-400 border-gray-500/20'
                            }`}>
                            Status: {project.statusGeral}
                        </div>
                    </div>
                </div>

                <div className="text-right bg-[#151520]/40 backdrop-blur-sm p-6 rounded-2xl border border-[#1F1F2E]/60 shadow-xl">
                    <p className="text-sm font-medium text-[#9CA3AF] mb-1">Progresso Geral</p>
                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 mb-2">
                        {displayProgress}%
                    </div>
                    <div className="flex items-center justify-end gap-2 text-xs text-[#6B7280]">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        Iniciado em {project.dataInicio}
                    </div>
                </div>
            </div>
        </div>
    );
}
