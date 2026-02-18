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
        <Link href={`/projects/${project.id}`} className="block group mb-5">
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#252630]/60 backdrop-blur-xl p-7 transition-all duration-500 hover:bg-[#252630]/90 hover:border-white/25 hover:shadow-xl hover:shadow-purple-900/10">
                <div className="absolute -left-20 top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 skew-x-12 transition-all duration-700 group-hover:translate-x-[500%] group-hover:opacity-100" />

                <div className="grid grid-cols-12 gap-8 items-center relative z-10">
                    {/* Empresa + Atrasado */}
                    <div className="col-span-12 md:col-span-3">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/15 text-purple-400 group-hover:text-purple-300 group-hover:border-purple-500/40 transition-colors">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold text-[#f4f4f5] tracking-tight group-hover:text-purple-300 transition-colors">
                                {project.empresa}
                            </h3>
                        </div>
                        <div className="pl-16 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-[#a1a1aa]">
                                <User className="w-4 h-4" />
                                <span>{project.gerente}</span>
                            </div>
                            {project.diasAtraso > 0 && (
                                <div className="flex items-center gap-2 text-sm font-semibold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg w-fit">
                                    <Calendar className="w-4 h-4" />
                                    <span>{project.diasAtraso} dias de atraso</span>
                                </div>
                            )}
                            {project.statusVelocidade === 'Atrasado' && project.diasAtraso === 0 && (
                                <div className="flex items-center gap-2 text-sm font-semibold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg w-fit">Atrasado</div>
                            )}
                        </div>
                    </div>

                    {/* Burndown — só quando houver tasks; senão alerta de preenchimento */}
                    <div className="col-span-12 md:col-span-2">
                        {(project.totalWork ?? 0) > 0 && (project.burndownData?.length ?? 0) > 0 ? (
                            <div className="h-16 w-full opacity-90 group-hover:opacity-100 transition-opacity pt-10 pb-8">
                                <BurndownChart
                                    workRemaining={project.burndownData ?? []}
                                    totalWork={project.totalWork}
                                    color={project.statusVelocidade === 'Atrasado' ? 'red' : 'purple'}
                                    height={64}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5" role="alert">
                                <span className="text-amber-400 text-sm font-medium">Cards precisam de preenchimento</span>
                            </div>
                        )}
                    </div>

                    {/* Progresso % */}
                    <div className="col-span-12 md:col-span-2">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm text-[#a1a1aa] font-medium uppercase tracking-wider">Progresso</span>
                            <span className="text-2xl font-bold text-[#f4f4f5]">{project.progresso}%</span>
                        </div>
                        <div className="w-full bg-white/15 h-2.5 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ease-out ${project.statusVelocidade === 'Atrasado' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                style={{ width: `${project.progresso}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-[#71717a] mt-2 text-right">
                            Próx. milestone: {project.proximaConclusao}
                        </p>
                    </div>

                    {/* Tarefas Pendentes */}
                    <div className="col-span-12 md:col-span-2 text-center">
                        <div className="inline-flex flex-col items-center justify-center p-4 rounded-xl bg-white/10 border border-white/15 group-hover:border-white/25 transition-colors min-w-[100px]">
                            <span className="text-3xl font-bold text-[#f4f4f5]">{project.tarefasAtivas}</span>
                            <span className="text-sm text-[#a1a1aa] font-medium uppercase tracking-wider mt-1">Pendentes</span>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-12 md:col-span-3">
                        <div className="flex justify-end gap-3 flex-wrap">
                            {project.statusGeral != null && (
                                <div className={`px-4 py-2 rounded-xl text-sm font-semibold border ${project.statusGeral === 'Excelente' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                                    project.statusGeral === 'Atenção' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
                                        project.statusGeral === 'Crítico' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
                                            'bg-white/10 text-[#d4d4d8] border-white/15'
                                    }`}>
                                    {project.statusGeral}
                                </div>
                            )}
                            <div className="px-4 py-2 rounded-xl text-sm bg-white/10 text-[#a1a1aa] border border-white/15">
                                Início: {project.dataInicio}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
