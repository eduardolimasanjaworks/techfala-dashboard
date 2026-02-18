'use client';

import { useState, useEffect } from 'react';
import { Trash2, RotateCcw, Columns } from 'lucide-react';

interface TrashTask {
  id: string;
  titulo: string;
  descricao?: string;
  deletedAt: string;
  columnNome: string;
  pipelineNome: string;
}

interface TrashPipeline {
  id: string;
  nome: string;
  deletedAt: string;
}

interface ProjectTrashProps {
  projectId: string;
  onRestore?: () => void;
}

export function ProjectTrash({ projectId, onRestore }: ProjectTrashProps) {
  const [tasks, setTasks] = useState<TrashTask[]>([]);
  const [pipelines, setPipelines] = useState<TrashPipeline[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/trash`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks ?? []);
        setPipelines(data.pipelines ?? []);
      }
    } catch {
      setTasks([]);
      setPipelines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, [projectId]);

  const handleRestoreTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/restore`, { method: 'POST', credentials: 'include' });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        onRestore?.();
      }
    } catch {
      //
    }
  };

  const handleRestorePipeline = async (pipelineId: string) => {
    try {
      const res = await fetch(`/api/pipelines/${pipelineId}/restore`, { method: 'POST', credentials: 'include' });
      if (res.ok) {
        setPipelines((prev) => prev.filter((p) => p.id !== pipelineId));
        onRestore?.();
      }
    } catch {
      //
    }
  };

  const empty = tasks.length === 0 && pipelines.length === 0;

  if (loading) {
    return (
      <div className="text-sm text-white/40 py-4">Carregando lixeira...</div>
    );
  }

  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-white/40">
        <Trash2 className="w-10 h-10 mb-2 opacity-50" />
        <p className="text-sm">Nenhum item na lixeira</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pipelines.length > 0 && (
        <div>
          <p className="text-xs font-medium text-white/50 uppercase mb-2">Pipelines</p>
          <div className="space-y-2">
            {pipelines.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Columns className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                  <div>
                    <p className="font-medium text-white truncate">{p.nome}</p>
                    <p className="text-xs text-white/40">
                      Apagado em {new Date(p.deletedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRestorePipeline(p.id)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8B5CF6]/20 text-[#8B5CF6] hover:bg-[#8B5CF6]/30 text-sm font-medium transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restaurar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {tasks.length > 0 && (
        <div>
          <p className="text-xs font-medium text-white/50 uppercase mb-2">Cards</p>
          <div className="space-y-2">
            {tasks.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{item.titulo}</p>
                  <p className="text-xs text-white/50 mt-0.5">{item.pipelineNome} → {item.columnNome}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Apagado em {new Date(item.deletedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRestoreTask(item.id)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8B5CF6]/20 text-[#8B5CF6] hover:bg-[#8B5CF6]/30 text-sm font-medium transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restaurar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
