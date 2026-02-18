'use client';

import { useState } from 'react';
import { ArrowLeft, Edit2, Check, X, Trash2, Copy } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Project } from '@/lib/mock-data';

interface ProjectDetailHeaderProps {
    project: Project;
    progressOverride?: number;
    onProjectUpdated?: () => void;
}

export function ProjectDetailHeader({ project, progressOverride, onProjectUpdated }: ProjectDetailHeaderProps) {
    const router = useRouter();
    const displayProgress = progressOverride !== undefined ? progressOverride : project.progresso;
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState(project.empresa);
    const [saving, setSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [cloning, setCloning] = useState(false);

    const handleSaveName = async () => {
        const trimmed = editName.trim();
        if (!trimmed || trimmed === project.empresa) {
            setIsEditingName(false);
            setEditName(project.empresa);
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`/api/projects/${project.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empresa: trimmed }),
            });
            if (res.ok) {
                setIsEditingName(false);
                onProjectUpdated?.();
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProject = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/projects/${project.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.ok) {
                router.push('/');
                return;
            }
        } finally {
            setSaving(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleCloneProject = async () => {
        setCloning(true);
        try {
            const res = await fetch(`/api/projects/${project.id}/clone`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empresa: `${project.empresa} (cópia)` }),
            });
            if (res.ok) {
                const cloned = await res.json();
                onProjectUpdated?.();
                router.push(`/projects/${cloned.id}`);
            }
        } finally {
            setCloning(false);
        }
    };

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
                    <div className="flex items-center gap-4 mb-4 flex-wrap">
                        {isEditingName ? (
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="flex-1 min-w-0 px-4 py-2 bg-[#151520] border border-[#1F1F2E] rounded-lg text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSaveName}
                                    disabled={saving || !editName.trim()}
                                    className="p-2 bg-[#00D084] text-[#0A0A0F] rounded-lg hover:bg-[#00965F] disabled:opacity-50"
                                    title="Salvar"
                                >
                                    <Check className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditingName(false);
                                        setEditName(project.empresa);
                                    }}
                                    disabled={saving}
                                    className="p-2 border border-[#1F1F2E] text-[#9CA3AF] rounded-lg hover:bg-[#151520]"
                                    title="Cancelar"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-5xl font-bold text-white tracking-tight">
                                    {project.empresa}
                                </h1>
                                <button
                                    onClick={() => {
                                        setEditName(project.empresa);
                                        setIsEditingName(true);
                                    }}
                                    className="p-2 text-[#9CA3AF] hover:text-[#8B5CF6] hover:bg-white/5 rounded-lg transition-colors"
                                    title="Editar nome"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                            </>
                        )}
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

                <div className="flex flex-col items-end gap-4">
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
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCloneProject}
                            disabled={cloning}
                            className="flex items-center gap-2 px-4 py-2 text-[#8B5CF6] hover:bg-[#8B5CF6]/10 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            title="Clonar projeto"
                        >
                            <Copy className="w-4 h-4" />
                            {cloning ? 'Clonando...' : 'Clonar projeto'}
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Excluir projeto
                        </button>
                    </div>
                </div>
            </div>

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => !saving && setShowDeleteConfirm(false)}>
                    <div className="bg-[#151520] border border-[#1F1F2E] rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-white mb-2">Excluir projeto?</h3>
                        <p className="text-sm text-[#9CA3AF] mb-4">Esta ação não pode ser desfeita. O projeto e todos os dados serão removidos.</p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleDeleteProject}
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
                            >
                                {saving ? 'Excluindo...' : 'Excluir'}
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={saving}
                                className="flex-1 px-4 py-2 border border-[#1F1F2E] text-[#9CA3AF] rounded-lg font-medium hover:bg-[#1F1F2E]"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
