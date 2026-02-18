'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Member {
    id?: string;
    nome: string;
    cargo: string;
    avatar?: string;
}

interface User {
    id: string;
    nome: string;
    cargo?: string;
}

interface ProjectTeamProps {
    projectId: string;
    members: Member[];
    onChanged: () => void;
}

export function ProjectTeam({ projectId, members, onChanged }: ProjectTeamProps) {
    const [adding, setAdding] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/users', { credentials: 'include' })
            .then((r) => r.ok ? r.json() : [])
            .then(setUsers)
            .catch(() => setUsers([]));
    }, []);

    const memberNomes = new Set(members.map((m) => m.nome));
    const availableUsers = users.filter((u) => !memberNomes.has(u.nome));

    const handleAdd = async () => {
        const user = users.find((u) => u.id === selectedUserId);
        if (!user) return;
        setSaving(true);
        try {
            const res = await fetch('/api/team-members', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    nome: user.nome,
                    cargo: user.cargo || 'usuario',
                }),
            });
            if (res.ok) {
                setSelectedUserId('');
                setAdding(false);
                onChanged();
            }
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async (memberId: string) => {
        if (!memberId) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/team-members?id=${encodeURIComponent(memberId)}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.ok) onChanged();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {members.map((member, index) => (
                    <div
                        key={member.id ?? index}
                        className="flex items-center justify-between gap-3 p-3 bg-[#0A0A0F] rounded-lg group"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[#8B5CF6] flex items-center justify-center text-white font-semibold flex-shrink-0">
                                {member.nome.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-white font-medium text-sm truncate">{member.nome}</p>
                                <p className="text-xs text-[#9CA3AF] truncate">{member.cargo}</p>
                            </div>
                        </div>
                        {member.id && (
                            <button
                                onClick={() => handleRemove(member.id!)}
                                disabled={saving}
                                className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-opacity disabled:opacity-50"
                                title="Remover da equipe"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {adding ? (
                <div className="p-3 bg-[#0A0A0F] rounded-lg space-y-2 border border-[#1F1F2E]">
                    <label className="text-xs text-[#9CA3AF] block">Selecionar usuário</label>
                    <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full px-3 py-2 bg-[#151520] border border-[#1F1F2E] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                    >
                        <option value="">Selecione...</option>
                        {availableUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.nome} {u.cargo ? `(${u.cargo})` : ''}
                            </option>
                        ))}
                    </select>
                    {availableUsers.length === 0 && (
                        <p className="text-xs text-[#9CA3AF]">Todos os usuários já estão na equipe.</p>
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={handleAdd}
                            disabled={saving || !selectedUserId}
                            className="flex-1 px-3 py-2 bg-[#00D084] text-[#0A0A0F] rounded-lg text-sm font-medium hover:bg-[#00965F] disabled:opacity-50"
                        >
                            {saving ? 'Adicionando...' : 'Adicionar'}
                        </button>
                        <button
                            onClick={() => {
                                setAdding(false);
                                setSelectedUserId('');
                            }}
                            disabled={saving}
                            className="px-3 py-2 border border-[#1F1F2E] text-[#9CA3AF] rounded-lg text-sm font-medium hover:bg-[#151520]"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setAdding(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-[#1F1F2E] text-[#9CA3AF] rounded-lg text-sm font-medium hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar pessoa
                </button>
            )}
        </div>
    );
}
