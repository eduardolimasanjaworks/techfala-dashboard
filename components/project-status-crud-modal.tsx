'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Pencil, Trash2 } from 'lucide-react';

interface ProjectStatus {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
}

interface ProjectStatusCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ProjectStatusCrudModal({ isOpen, onClose, onSaved }: ProjectStatusCrudModalProps) {
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editCor, setEditCor] = useState('#8B5CF6');
  const [adding, setAdding] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newCor, setNewCor] = useState('#8B5CF6');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStatuses();
    }
  }, [isOpen]);

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/project-statuses', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStatuses(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newNome.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/project-statuses', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newNome.trim(), cor: newCor }),
      });
      if (res.ok) {
        setNewNome('');
        setNewCor('#8B5CF6');
        setAdding(false);
        await fetchStatuses();
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !editNome.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/project-statuses/${editingId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: editNome.trim(), cor: editCor }),
      });
      if (res.ok) {
        setEditingId(null);
        await fetchStatuses();
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este status? Projetos com este status ficarão "Sem status".')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/project-statuses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        await fetchStatuses();
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#252630] border border-white/15 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-white/15">
          <h2 className="text-xl font-bold text-[#f4f4f5]">Status de projeto (etiquetas)</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#a1a1aa] hover:bg-white/10 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <p className="text-[#a1a1aa]">Carregando...</p>
          ) : (
            <>
              {statuses.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                >
                  {editingId === s.id ? (
                    <>
                      <input
                        type="text"
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#1a1b26] border border-white/20 rounded-lg text-white"
                        placeholder="Nome"
                      />
                      <input
                        type="color"
                        value={editCor}
                        onChange={(e) => setEditCor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <button
                        onClick={handleUpdate}
                        disabled={saving}
                        className="px-3 py-2 bg-[#00D084] text-[#0A0A0F] rounded-lg font-medium disabled:opacity-50"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        disabled={saving}
                        className="px-3 py-2 border border-white/20 text-[#a1a1aa] rounded-lg"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <div
                        className="w-3 h-8 rounded"
                        style={{ backgroundColor: s.cor }}
                      />
                      <span className="flex-1 font-medium text-white">{s.nome}</span>
                      <button
                        onClick={() => {
                          setEditingId(s.id);
                          setEditNome(s.nome);
                          setEditCor(s.cor);
                        }}
                        className="p-2 text-[#a1a1aa] hover:text-white hover:bg-white/10 rounded-lg"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={saving}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg disabled:opacity-50"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
              {adding ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-[#8B5CF6]/30">
                  <input
                    type="text"
                    value={newNome}
                    onChange={(e) => setNewNome(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#1a1b26] border border-white/20 rounded-lg text-white"
                    placeholder="Nome do status"
                  />
                  <input
                    type="color"
                    value={newCor}
                    onChange={(e) => setNewCor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <button
                    onClick={handleAdd}
                    disabled={saving || !newNome.trim()}
                    className="px-3 py-2 bg-[#8B5CF6] text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => {
                      setAdding(false);
                      setNewNome('');
                      setNewCor('#8B5CF6');
                    }}
                    disabled={saving}
                    className="px-3 py-2 border border-white/20 text-[#a1a1aa] rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-white/20 text-[#a1a1aa] rounded-xl hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Novo status
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
