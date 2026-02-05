'use client';

import { Badge, ProgressBar } from '@tremor/react';
import { FileText, User, Calendar } from 'lucide-react';
import type { Project } from '@/lib/mock-data';
import { BurndownChart } from './burndown-chart';
import Link from 'next/link';

interface ProjectRowProps {
    project: Project;
}

export function ProjectRow({ project }: ProjectRowProps) {
    return (
        <Link href={`/projects/${project.id}`} className="block group mb-4">
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0A0A0F]/30 backdrop-blur-xl p-6 transition-all duration-500 hover:bg-[#0A0A0F]/50 hover:border-white/10 hover:shadow-2xl hover:shadow-purple-900/10">
                {/* Hover Glow */}
                <div className="absolute -left-20 top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 skew-x-12 transition-all duration-700 group-hover:translate-x-[500%] group-hover:opacity-100" />

                <div className="grid grid-cols-12 gap-6 items-center relative z-10">
                    {/* Empresa Section */}
                    <div className="col-span-12 md:col-span-3">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5 text-purple-400 group-hover:text-purple-300 group-hover:border-purple-500/30 transition-colors">
                                <FileText className="w-4 h-4" />
                            </div>
                            <h3 className="text-xl font-light text-white tracking-tight group-hover:text-purple-300 transition-colors">
                                {project.empresa}
                            </h3>
                        </div>
                        <div className="pl-11 space-y-1">
                            <div className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-wider">
                                <User className="w-3 h-3" />
                                <span>{project.gerente}</span>
                            </div>
                            {project.diasAtraso > 0 && (
                                <div className="flex items-center gap-2 text-xs text-rose-400">
                                    <Calendar className="w-3 h-3" />
                                    <span>{project.diasAtraso} dias de atraso</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Velocidade Chart */}
                    <div className="col-span-12 md:col-span-2">
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-2xl font-light text-white">{project.indiceVelocidade}</span>
                            <span className="text-[10px] text-white/30 uppercase tracking-widest">pts/sprint</span>
                        </div>
                        <div className="h-10 w-full opacity-50 group-hover:opacity-100 transition-opacity">
                            <BurndownChart
                                workRemaining={project.burndownData}
                                totalWork={project.totalWork}
                                color={project.statusVelocidade === 'No Prazo' ? 'purple' : 'red'}
                                height={40}
                            />
                        </div>
                    </div>

                    {/* Progresso Section */}
                    <div className="col-span-12 md:col-span-2">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-xs text-white/40 uppercase tracking-wider">Progresso</span>
                            <span className="text-sm text-white font-medium">{project.progresso}%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ease-out ${project.statusVelocidade === 'No Prazo' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                style={{ width: `${project.progresso}%` }}
                            ></div>
                        </div>
                        <p className="text-[10px] text-white/30 mt-2 text-right">
                            Próx. milestone: {project.proximaConclusao}
                        </p>
                    </div>

                    {/* Tarefas Section */}
                    <div className="col-span-12 md:col-span-2 text-center">
                        <div className="inline-flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors">
                            <span className="text-xl font-medium text-white">{project.tarefasAtivas}</span>
                            <span className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Pendentes</span>
                        </div>
                    </div>

                    {/* Status & Metrics */}
                    <div className="col-span-12 md:col-span-3">
                        <div className="flex justify-end gap-2 mb-3">
                            <div className={`px-3 py-1 rounded-full text-[10px] font-medium border ${project.statusGeral === 'Excelente' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                project.statusGeral === 'Atenção' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                    'bg-white/5 text-white/60 border-white/10'
                                }`}>
                                {project.statusGeral}
                            </div>
                            <div className="px-3 py-1 rounded-full text-[10px] bg-white/5 text-white/40 border border-white/5">
                                Início: {project.dataInicio}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
