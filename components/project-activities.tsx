'use client';

import { useState, useEffect } from 'react';
import { History } from 'lucide-react';

interface ActivityItem {
  id: string;
  autor: string;
  action: string;
  actionLabel: string;
  details: Record<string, unknown>;
  createdAt: string;
  taskId?: string;
}

interface ProjectActivitiesProps {
  projectId: string;
  taskId?: string | null;
  limit?: number;
  /** Quando muda, força novo fetch (ex: após criar pipeline/card) */
  refreshTrigger?: number;
}

export function ProjectActivities({ projectId, taskId = null, limit = 50, refreshTrigger = 0 }: ProjectActivitiesProps) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const url = taskId
      ? `/api/projects/${projectId}/activities?taskId=${taskId}&limit=${limit}`
      : `/api/projects/${projectId}/activities?limit=${limit}`;
    fetch(url, { credentials: 'include' })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => { if (!cancelled) setItems(data); })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId, taskId, limit, refreshTrigger]);

  if (loading) {
    return (
      <div className="text-sm text-white/40 py-4">Carregando atividades...</div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-white/40">
        <History className="w-10 h-10 mb-2 opacity-50" />
        <p className="text-sm">Nenhuma atividade registrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
        >
          <div className="w-8 h-8 shrink-0 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6] text-xs font-semibold">
            {item.autor.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white">
              <span className="font-medium">{item.autor}</span>
              {' '}
              <span className="text-white/70">{item.actionLabel}</span>
              {Boolean(item.details?.titulo ?? item.details?.nome) && (
                <span className="text-white/50"> — {String(item.details?.titulo ?? item.details?.nome ?? '')}</span>
              )}
            </p>
            <p className="text-xs text-white/40 mt-0.5">
              {new Date(item.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
