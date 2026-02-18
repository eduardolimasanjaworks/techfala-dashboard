'use client';

import { useState } from 'react';
import { Calendar, Edit2, Check, X } from 'lucide-react';

interface ProjectDatesProps {
    projectId: string;
    dataInicio: string;
    dataFim?: string;
    onSaved?: () => void;
}

export function ProjectDates({ projectId, dataInicio: initialDataInicio, dataFim: initialDataFim, onSaved }: ProjectDatesProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [dataInicio, setDataInicio] = useState(initialDataInicio);
    const [dataFim, setDataFim] = useState(initialDataFim || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!dataInicio?.trim()) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dataInicio: dataInicio || undefined,
                    dataFim: dataFim || null,
                }),
            });
            if (res.ok) {
                setIsEditing(false);
                onSaved?.();
            }
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setDataInicio(initialDataInicio);
        setDataFim(initialDataFim || '');
        setIsEditing(false);
    };

    // Converte DD/MM/YYYY para YYYY-MM-DD para input type="date"
    const formatToInputDate = (dateStr: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        if (dateStr.includes('-') && dateStr.length >= 10) return dateStr.slice(0, 10);
        return '';
    };

    // Converte YYYY-MM-DD para DD/MM/YYYY
    const formatToDisplayDate = (dateStr: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return '';
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    return (
        <div className="space-y-3">
            {isEditing ? (
                <>
                    {/* Modo de Edição */}
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-[#9CA3AF] mb-1 block">Data de Início</label>
                            <input
                                type="date"
                                value={formatToInputDate(dataInicio)}
                                onChange={(e) => setDataInicio(formatToDisplayDate(e.target.value))}
                                className="w-full px-3 py-2 bg-[#151520] border border-[#1F1F2E] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-[#9CA3AF] mb-1 block">Data de Término</label>
                            <input
                                type="date"
                                value={formatToInputDate(dataFim)}
                                onChange={(e) => setDataFim(formatToDisplayDate(e.target.value))}
                                className="w-full px-3 py-2 bg-[#151520] border border-[#1F1F2E] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                            />
                        </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#00D084] text-[#0A0A0F] rounded-lg text-sm font-medium hover:bg-[#00965F] transition-colors disabled:opacity-50"
                        >
                            <Check className="w-4 h-4" />
                            {saving ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                            onClick={handleCancel}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-[#1F1F2E] text-[#9CA3AF] rounded-lg text-sm font-medium hover:bg-[#151520] transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Cancelar
                        </button>
                    </div>
                </>
            ) : (
                <>
                    {/* Modo de Visualização */}
                    <div className="space-y-2">
                        <div className="flex items-start gap-3 p-3 bg-[#0A0A0F] rounded-lg">
                            <Calendar className="w-5 h-5 text-[#8B5CF6] mt-0.5" />
                            <div className="flex-1">
                                <p className="text-xs text-[#9CA3AF] mb-1">Data de Início</p>
                                <p className="text-white font-medium">{dataInicio}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-[#0A0A0F] rounded-lg">
                            <Calendar className="w-5 h-5 text-[#00D084] mt-0.5" />
                            <div className="flex-1">
                                <p className="text-xs text-[#9CA3AF] mb-1">Data de Término</p>
                                <p className="text-white font-medium">{dataFim || 'Não definida'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Botão Editar */}
                    <button
                        onClick={() => setIsEditing(true)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-[#1F1F2E] text-[#9CA3AF] rounded-lg text-sm font-medium hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                        Editar Datas
                    </button>
                </>
            )}
        </div>
    );
}
