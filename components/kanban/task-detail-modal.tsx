'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, MessageSquare, Send, Pencil, Trash2, User, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { LabelsPopover } from './labels-popover';
import { Checkbox } from '@/components/ui/checkbox';
import type { Task, Subtask, SubtaskNested, TaskComment, SubtaskComment, SubtaskList, Label } from '@/lib/mock-data';

const autorPadrao = 'Você';

interface Epic { id: string; nome: string; items?: unknown[] }

export type CloneTaskPayload = {
  titulo: string;
  targetColumnId?: string;
  descricao?: string;
  dataVencimento?: string;
  prioridade?: Task['prioridade'];
  epicId?: string;
  tags?: string[];
  responsavel?: { nome: string };
  subtasks?: { titulo: string; concluida: boolean; ordem: number; responsavel?: { nome: string }; dataInicio?: string; dataVencimento?: string; nestedSubtasks?: { titulo: string; concluida: boolean; ordem: number; responsavel?: { nome: string }; dataInicio?: string; dataVencimento?: string }[] }[];
};

interface TaskDetailModalProps {
  task: Task;
  equipe: { nome: string; cargo: string; avatar?: string }[];
  epics?: Epic[];
  labels?: Label[];
  projectId?: string;
  onLabelCreated?: (label: Label) => void;
  onClose: () => void;
  onUpdate: (updates: Partial<Task> & { labelIds?: string[] }) => void;
  /** Coluna atual do card (para clonar na mesma coluna) */
  columnId?: string;
  /** Todas as colunas do pipeline (para escolher destino do clone) */
  columns?: { id: string; nome: string }[];
  /** Todas as tasks do pipeline (para clonar lista para outro card) */
  allTasks?: { id: string; titulo: string; columnId: string; columnNome: string }[];
  /** Chamado ao clonar o card; o pai cria a nova tarefa e atualiza o pipeline */
  onClone?: (payload: CloneTaskPayload) => Promise<void>;
  /** Chamado ao clonar uma lista de subtarefas para outro card */
  onCloneList?: (payload: { listName: string; items: { titulo: string }[]; targetTaskId: string; targetColumnId: string }) => Promise<void>;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export function TaskDetailModal({ task: initialTask, equipe, epics = [], labels: projectLabels = [], projectId, onLabelCreated, onClose, onUpdate, columnId, columns = [], allTasks = [], onClone, onCloneList }: TaskDetailModalProps) {
  const [task, setTask] = useState<Task>(initialTask);
  const [title, setTitle] = useState(initialTask.titulo);
  const [description, setDescription] = useState(initialTask.descricao || '');
  const [dueDate, setDueDate] = useState(initialTask.dataVencimento || '');
  const [responsible, setResponsible] = useState(initialTask.responsavel?.nome || '');
  const [priority, setPriority] = useState<Task['prioridade']>(initialTask.prioridade);
  const [epicId, setEpicId] = useState<string | undefined>(initialTask.epicId);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(initialTask.labels?.map((l) => l.id) ?? []);
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialTask.subtasks || []);
  const [taskComments, setTaskComments] = useState<TaskComment[]>(initialTask.taskComments || []);
  const [subtaskLists, setSubtaskLists] = useState<SubtaskList[]>(initialTask.subtaskLists || []);
  const [newComment, setNewComment] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskByList, setNewSubtaskByList] = useState<Record<string, string>>({});
  const [newListName, setNewListName] = useState('');
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [subtaskCommentInput, setSubtaskCommentInput] = useState<Record<string, string>>({});
  const [nestedCommentInput, setNestedCommentInput] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [mentionAt, setMentionAt] = useState<{ at: number; query: string } | null>(null);
  const [confirmCompleteSubtask, setConfirmCompleteSubtask] = useState<Subtask | null>(null);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const hasUnsavedChanges = (): boolean => {
    if (title !== (task.titulo ?? '')) return true;
    if (description !== (task.descricao ?? '')) return true;
    if (dueDate !== (task.dataVencimento ?? '')) return true;
    if (responsible !== (task.responsavel?.nome ?? '')) return true;
    if (priority !== (task.prioridade ?? undefined)) return true;
    if (epicId !== (task.epicId ?? undefined)) return true;
    const savedIds = [...(task.labels?.map((l) => l.id) ?? [])].sort();
    const currentIds = [...selectedLabelIds].sort();
    if (savedIds.length !== currentIds.length || savedIds.some((id, i) => id !== currentIds[i])) return true;
    const subKey = (s: Subtask) => {
      const nested = (s.nestedSubtasks ?? []).map((n) => `${n.id}:${n.titulo}:${n.concluida}`).join(',');
      return `${s.id}:${s.titulo}:${s.concluida}:${s.ordem ?? 0}:${nested}`;
    };
    const savedSubs = (task.subtasks ?? []).map(subKey).join('|');
    const currentSubs = subtasks.map(subKey).join('|');
    if (savedSubs !== currentSubs) return true;
    return false;
  };

  const handleRequestClose = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedConfirm(true);
    } else {
      onClose();
    }
  };

  const handleCloseAnyway = () => {
    setShowUnsavedConfirm(false);
    onClose();
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/tasks/${initialTask.id}`, { credentials: 'include' });
        if (res.ok && !cancelled) {
          const full = await res.json();
          setTask(full);
          setTitle(full.titulo);
          setDescription(full.descricao || '');
          setDueDate(full.dataVencimento || '');
          setResponsible(full.responsavel?.nome || '');
          setPriority(full.prioridade);
          setEpicId(full.epicId ?? undefined);
          setSelectedLabelIds(full.labels?.map((l: Label) => l.id) ?? []);
          setSubtasks(full.subtasks || []);
          setTaskComments(full.taskComments || []);
          setSubtaskLists(full.subtaskLists || []);
        }
      } catch {
        if (!cancelled) {
          setSubtasks(initialTask.subtasks || []);
          setTaskComments(initialTask.taskComments || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [initialTask.id]);

  const handleSave = () => {
    onUpdate({
      titulo: title,
      descricao: description,
      dataVencimento: dueDate || undefined,
      responsavel: responsible ? { nome: responsible } : undefined,
      prioridade: priority,
      epicId,
      labelIds: selectedLabelIds,
      subtasks: subtasks.map((s) => ({
        id: s.id,
        titulo: s.titulo,
        concluida: s.concluida,
        dataInicio: s.dataInicio,
        dataVencimento: s.dataVencimento,
        ordem: s.ordem ?? 0,
        subtaskListId: s.subtaskListId,
        responsavel: s.responsavel,
        nestedSubtasks: s.nestedSubtasks?.map((n) => ({
          id: n.id,
          titulo: n.titulo,
          concluida: n.concluida,
          dataInicio: n.dataInicio,
          dataVencimento: n.dataVencimento,
          ordem: n.ordem ?? 0,
          responsavel: n.responsavel,
          nestedComments: n.nestedComments,
        })),
      })),
    });
  };

  const addTaskComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: newComment.trim(), autor: autorPadrao }),
      });
      if (res.ok) {
        const c = await res.json();
        setTaskComments((prev) => [...prev, c]);
        setNewComment('');
      }
    } catch {
      const c: TaskComment = {
        id: `c-${Date.now()}`,
        autor: autorPadrao,
        texto: newComment.trim(),
        data: new Date().toISOString(),
      };
      setTaskComments((prev) => [...prev, c]);
      setNewComment('');
    }
  };

  const addSubtaskComment = async (subtaskId: string) => {
    const texto = subtaskCommentInput[subtaskId]?.trim();
    if (!texto) return;
    const addCommentToState = () => {
      const c: SubtaskComment = {
        id: `sc-${Date.now()}`,
        autor: autorPadrao,
        texto,
        data: new Date().toISOString(),
      };
      setSubtasks((prev) =>
        prev.map((s) =>
          s.id === subtaskId ? { ...s, subtaskComments: [...(s.subtaskComments || []), c] } : s
        )
      );
      setSubtaskCommentInput((prev) => ({ ...prev, [subtaskId]: '' }));
    };
    try {
      const res = await fetch(`/api/subtasks/${subtaskId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, autor: autorPadrao }),
      });
      if (res.ok) {
        const c = await res.json();
        setSubtasks((prev) =>
          prev.map((s) =>
            s.id === subtaskId
              ? { ...s, subtaskComments: [...(s.subtaskComments || []), c] }
              : s
          )
        );
        setSubtaskCommentInput((prev) => ({ ...prev, [subtaskId]: '' }));
      } else {
        // Subtarefa ainda não persistida (ex.: id client-side) ou API indisponível: guardar só em estado
        addCommentToState();
      }
    } catch {
      addCommentToState();
    }
  };

  const addSubtask = (subtaskListId?: string | null) => {
    const titulo = subtaskListId != null
      ? (newSubtaskByList[subtaskListId] || '').trim()
      : newSubtaskTitle.trim();
    if (!titulo) return;
    const newSubtask: Subtask = {
      id: `subtask-${Date.now()}`,
      titulo,
      concluida: false,
      ordem: subtasks.length,
      subtaskListId: subtaskListId || undefined,
    };
    setSubtasks((prev) => [...prev, newSubtask]);
    if (subtaskListId != null) {
      setNewSubtaskByList((prev) => ({ ...prev, [subtaskListId]: '' }));
    } else {
      setNewSubtaskTitle('');
    }
  };

  const addNestedSubtask = (parentId: string) => {
    const parent = subtasks.find((s) => s.id === parentId);
    const nested = parent?.nestedSubtasks || [];
    const newNested: SubtaskNested = {
      id: `nested-${Date.now()}`,
      titulo: 'Nova sub-subtarefa',
      concluida: false,
      ordem: nested.length,
    };
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === parentId
          ? { ...s, nestedSubtasks: [...(s.nestedSubtasks || []), newNested] }
          : s
      )
    );
  };

  const addList = async () => {
    const nome = newListName.trim() || 'Nova lista';
    setNewListName('');
    setShowCreateListModal(false);
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtask-lists`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome }),
      });
      if (res.ok) {
        const list = await res.json();
        setSubtaskLists((prev) => [...prev, { ...list, subtasks: [] }]);
      } else {
        setSubtaskLists((prev) => [...prev, { id: `list-${Date.now()}`, nome, ordem: prev.length, subtasks: [] }]);
      }
    } catch {
      setSubtaskLists((prev) => [...prev, { id: `list-${Date.now()}`, nome, ordem: prev.length, subtasks: [] }]);
    }
  };

  const toggleSubtask = (id: string) => {
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, concluida: !s.concluida } : s)));
    setConfirmCompleteSubtask(null);
  };

  const handleToggleSubtask = (s: Subtask) => {
    const willBecomeComplete = !s.concluida;
    if (willBecomeComplete) {
      const nested = s.nestedSubtasks ?? [];
      const allNestedDone = nested.length === 0 || nested.every((n) => n.concluida);
      if (!allNestedDone) {
        setConfirmCompleteSubtask(s);
        return;
      }
    }
    toggleSubtask(s.id);
  };

  const toggleNested = (parentId: string, nestedId: string) => {
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === parentId
          ? {
              ...s,
              nestedSubtasks: (s.nestedSubtasks || []).map((n) =>
                n.id === nestedId ? { ...n, concluida: !n.concluida } : n
              ),
            }
          : s
      )
    );
  };

  const updateSubtask = (id: string, updates: Partial<Subtask>) => {
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const updateNested = (parentId: string, nestedId: string, updates: Partial<SubtaskNested>) => {
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === parentId
          ? {
              ...s,
              nestedSubtasks: (s.nestedSubtasks || []).map((n) =>
                n.id === nestedId ? { ...n, ...updates } : n
              ),
            }
          : s
      )
    );
  };

  const deleteSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const addNestedComment = (parentSubtaskId: string, nestedId: string) => {
    const key = `${parentSubtaskId}-${nestedId}`;
    const texto = nestedCommentInput[key]?.trim();
    if (!texto) return;
    const newComment: SubtaskComment = {
      id: `nc-${Date.now()}`,
      autor: autorPadrao,
      texto,
      data: new Date().toISOString(),
    };
    const parent = subtasks.find((s) => s.id === parentSubtaskId);
    const nested = parent?.nestedSubtasks?.find((n) => n.id === nestedId);
    if (!nested) return;
    updateNested(parentSubtaskId, nestedId, {
      nestedComments: [...(nested.nestedComments || []), newComment],
    });
    setNestedCommentInput((prev) => ({ ...prev, [key]: '' }));
  };

  const deleteNested = (parentId: string, nestedId: string) => {
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === parentId
          ? { ...s, nestedSubtasks: (s.nestedSubtasks || []).filter((n) => n.id !== nestedId) }
          : s
      )
    );
  };

  const [listToDelete, setListToDelete] = useState<{ listId: string; listName: string; count: number } | null>(null);
  const [deleteListAlsoSubtasks, setDeleteListAlsoSubtasks] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [structureExpanded, setStructureExpanded] = useState(true);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneTargetColumnId, setCloneTargetColumnId] = useState(columnId ?? '');
  const [showCloneListModal, setShowCloneListModal] = useState<{ listName: string; items: { titulo: string }[] } | null>(null);
  const [cloneListTargetTaskId, setCloneListTargetTaskId] = useState('');
  const [cloneListTargetColumnId, setCloneListTargetColumnId] = useState(columnId ?? '');
  const [cloningList, setCloningList] = useState(false);

  useEffect(() => {
    if (showCloneModal && columns.length > 0 && !cloneTargetColumnId) {
      setCloneTargetColumnId(columnId ?? columns[0].id);
    }
  }, [showCloneModal, columns, columnId, cloneTargetColumnId]);

  useEffect(() => {
    if (showCloneListModal && columns.length > 0) {
      setCloneListTargetColumnId(columnId ?? columns[0].id);
      const firstTask = allTasks.find((t) => t.columnId === (columnId ?? columns[0]?.id));
      setCloneListTargetTaskId(firstTask?.id ?? '');
    }
  }, [showCloneListModal, columns, columnId, allTasks]);

  const handleCloneList = async () => {
    if (!onCloneList || !showCloneListModal || !cloneListTargetTaskId) return;
    setCloningList(true);
    try {
      await onCloneList({
        listName: showCloneListModal.listName,
        items: showCloneListModal.items,
        targetTaskId: cloneListTargetTaskId,
        targetColumnId: cloneListTargetColumnId,
      });
      setShowCloneListModal(null);
    } finally {
      setCloningList(false);
    }
  };

  const handleClone = async () => {
    if (!onClone) return;
    const targetCol = cloneTargetColumnId || columnId;
    if (!targetCol) return;
    setCloning(true);
    try {
      const baseTitle = task.titulo.trim();
      await onClone({
        titulo: baseTitle ? `${baseTitle} (Cópia)` : 'Cópia',
        targetColumnId: targetCol,
        descricao: description || undefined,
        dataVencimento: dueDate || undefined,
        prioridade: priority,
        epicId,
        tags: task.tags,
        responsavel: responsible ? { nome: responsible } : undefined,
        subtasks: subtasks.map((s, i) => ({
          titulo: s.titulo,
          concluida: false,
          ordem: i,
          responsavel: s.responsavel,
          dataInicio: s.dataInicio,
          dataVencimento: s.dataVencimento,
          nestedSubtasks: (s.nestedSubtasks ?? []).map((n, j) => ({
            titulo: n.titulo,
            concluida: false,
            ordem: j,
            responsavel: n.responsavel,
            dataInicio: n.dataInicio,
            dataVencimento: n.dataVencimento,
          })),
        })),
      });
      setShowCloneModal(false);
      onClose();
    } finally {
      setCloning(false);
    }
  };

  const deleteList = async (listId: string, alsoDeleteSubtasks: boolean) => {
    const subtaskIdsInList = subtasks.filter((s) => s.subtaskListId === listId).map((s) => s.id);
    setListToDelete(null);

    if (alsoDeleteSubtasks) {
      for (const sid of subtaskIdsInList) {
        try {
          await fetch(`/api/subtasks/${sid}`, { method: 'DELETE', credentials: 'include' });
        } catch {
          // remove em estado mesmo se API falhar
        }
      }
      setSubtasks((prev) => prev.filter((s) => s.subtaskListId !== listId));
    } else {
      setSubtasks((prev) =>
        prev.map((s) => (s.subtaskListId === listId ? { ...s, subtaskListId: undefined } : s))
      );
    }

    try {
      await fetch(`/api/subtask-lists/${listId}`, { method: 'DELETE', credentials: 'include' });
    } catch {
      // continua: remove lista em estado
    }
    setSubtaskLists((prev) => prev.filter((l) => l.id !== listId));
  };

  const subtasksByList = (): { listId: string | null; listName: string; items: Subtask[] }[] => {
    const semLista = subtasks.filter((s) => !s.subtaskListId);
    const out: { listId: string | null; listName: string; items: Subtask[] }[] = [];
    out.push({ listId: null, listName: 'Sem lista', items: semLista });
    subtaskLists.forEach((list) => {
      const items = subtasks.filter((s) => s.subtaskListId === list.id);
      out.push({ listId: list.id, listName: list.nome, items });
    });
    return out;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#151520] rounded-2xl p-8 text-white/60">Carregando...</div>
      </div>
    );
  }

  const modalContent = (
    <>
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm modal-layer-1 overflow-y-auto overflow-x-hidden">
      <div className="min-h-full flex flex-col items-center justify-center p-4 py-8">
        <div className="bg-[#0f0f14] border border-white/10 rounded-2xl shadow-2xl max-w-6xl w-full min-h-[70vh] my-auto flex flex-col overflow-hidden scroll-discreto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">{title || 'Detalhes da Tarefa'}</h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-white/50 flex-wrap">
              {responsible && (
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 shrink-0" />
                  {responsible}
                </span>
              )}
              {dueDate && (
                <span>{new Date(dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onClone && (columnId || columns.length > 0) && (
              <button
                type="button"
                onClick={() => setShowCloneModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 hover:text-white transition-colors text-sm disabled:opacity-50"
                title="Clonar card"
              >
                <Copy className="w-4 h-4" />
                Clonar
              </button>
            )}
            <button type="button" onClick={handleRequestClose} className="p-2 rounded-xl text-[#9CA3AF] hover:bg-white/10 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex min-h-0 scroll-discreto">
          {/* Coluna esquerda - Conteúdo principal */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto scroll-discreto">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-white/70">Título</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-white/70">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/70">Vencimento</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/70">Responsável</label>
                <select
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  className="w-full select-contraste rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50"
                >
                  <option value="">Selecione...</option>
                  {equipe.map((m, i) => (
                    <option key={i} value={m.nome}>{m.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/70">Prioridade</label>
              <select
                value={priority || ''}
                onChange={(e) => setPriority((e.target.value || undefined) as Task['prioridade'])}
                className="w-full select-contraste rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50"
              >
                <option value="">Nenhuma</option>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/70">Etiquetas</label>
              <div className="flex flex-wrap items-center gap-2">
                {selectedLabelIds
                  .map((id) => projectLabels.find((l) => l.id === id))
                  .filter((l): l is Label => Boolean(l))
                  .map((l) => (
                    <span
                      key={l.id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${l.cor}25`,
                        borderLeft: `3px solid ${l.cor}`,
                        color: l.cor,
                      }}
                    >
                      {l.nome}
                      <button
                        type="button"
                        onClick={() => setSelectedLabelIds((prev) => prev.filter((x) => x !== l.id))}
                        className="opacity-60 hover:opacity-100 ml-0.5 rounded p-0.5 hover:bg-black/10"
                        aria-label={`Remover ${l.nome}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                <LabelsPopover
                  labels={projectLabels}
                  selectedLabelIds={selectedLabelIds}
                  onToggleLabel={(id) =>
                    setSelectedLabelIds((prev) =>
                      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                    )
                  }
                  projectId={projectId}
                  onLabelCreated={(label) => {
                    onLabelCreated?.(label);
                  }}
                  title="Etiquetas"
                  mode="select"
                  placement="left"
                  trigger={
                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[#8B5CF6] hover:bg-[#8B5CF6]/10 border border-dashed border-[#8B5CF6]/40 hover:border-[#8B5CF6]/60 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar uma etiqueta
                    </button>
                  }
                />
              </div>
            </div>

            {epics.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/70">Epic</label>
                <select
                  value={epicId || ''}
                  onChange={(e) => setEpicId(e.target.value || undefined)}
                  className="w-full select-contraste rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50"
                >
                  <option value="">Nenhum</option>
                  {epics.map((epic) => (
                    <option key={epic.id} value={epic.id}>{epic.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Subtarefas agrupadas por lista */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-ui font-medium text-white/80">Subtarefas</label>
                <button
                  type="button"
                  onClick={() => setShowCreateListModal(true)}
                  className="btn-ghost btn-ghost-accent"
                >
                  <Plus className="w-4 h-4" />
                  Criar lista
                </button>
              </div>

              {/* Modal criar lista (sobre o modal principal) */}
              {showCreateListModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center modal-layer-2 p-4" onClick={() => setShowCreateListModal(false)}>
                  <div
                    className="bg-[#151520] border border-white/20 rounded-2xl shadow-2xl w-full max-w-sm p-5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h4 className="text-ui-lg font-semibold text-white mb-3">Nova lista</h4>
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addList()}
                      placeholder="Nome da lista..."
                      className="w-full bg-[#1a1a24] border border-white/20 rounded-xl px-4 py-3 text-ui text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 mb-4"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateListModal(false)}
                        className="btn-ghost flex-1"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => addList()}
                        className="flex-1 min-h-[44px] px-4 rounded-full bg-[#8B5CF6] text-white font-medium hover:bg-[#7C3AED] transition-colors"
                      >
                        Criar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {listToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center modal-layer-2 p-4" onClick={() => setListToDelete(null)}>
                  <div className="bg-[#151520] border border-white/20 rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <h4 className="text-ui-lg font-semibold text-white">Excluir lista?</h4>
                        <p className="text-ui-sm text-white/60">
                          {listToDelete.count === 0
                            ? 'Esta ação não pode ser desfeita.'
                            : 'Escolha o que fazer com as subtarefas desta lista.'}
                        </p>
                      </div>
                    </div>
                    {listToDelete.count > 0 && (
                      <label className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={deleteListAlsoSubtasks}
                          onChange={(e) => setDeleteListAlsoSubtasks(e.target.checked)}
                          className="rounded border-white/30 text-red-500 mt-0.5"
                        />
                        <span className="text-ui-sm text-white/80">
                          Excluir também as <strong>{listToDelete.count}</strong> subtarefas desta lista (não serão movidas para &quot;Sem lista&quot;)
                        </span>
                      </label>
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setListToDelete(null)} className="btn-ghost flex-1">Cancelar</button>
                      <button
                        type="button"
                        onClick={() => deleteList(listToDelete.listId, deleteListAlsoSubtasks)}
                        className="flex-1 min-h-[44px] px-4 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-medium hover:bg-red-500/30"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showCloneModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center modal-layer-2 p-4" onClick={() => setShowCloneModal(false)}>
                  <div className="bg-[#151520] border border-white/20 rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center">
                        <Copy className="w-5 h-5 text-[#8B5CF6]" />
                      </div>
                      <div>
                        <h4 className="text-ui-lg font-semibold text-white">Clonar card</h4>
                        <p className="text-ui-sm text-white/60">Escolha a coluna de destino para o clone.</p>
                      </div>
                    </div>
                    {columns.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-ui-sm font-medium text-white/70 mb-1.5">Coluna de destino</label>
                        <select
                          value={cloneTargetColumnId}
                          onChange={(e) => setCloneTargetColumnId(e.target.value)}
                          className="w-full select-contraste rounded-xl px-4 py-3 text-ui"
                        >
                          {columns.map((c) => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setShowCloneModal(false)} className="btn-ghost flex-1">Cancelar</button>
                      <button
                        type="button"
                        onClick={handleClone}
                        disabled={cloning}
                        className="flex-1 min-h-[44px] px-4 rounded-full bg-[#8B5CF6] text-white font-medium hover:bg-[#7C3AED] disabled:opacity-50"
                      >
                        {cloning ? 'Clonando...' : 'Clonar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showCloneListModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center modal-layer-2 p-4" onClick={() => setShowCloneListModal(null)}>
                  <div className="bg-[#151520] border border-white/20 rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center">
                        <Copy className="w-5 h-5 text-[#8B5CF6]" />
                      </div>
                      <div>
                        <h4 className="text-ui-lg font-semibold text-white">Clonar lista</h4>
                        <p className="text-ui-sm text-white/60">Clonar &quot;{showCloneListModal.listName}&quot; ({showCloneListModal.items.length} itens) para outro card.</p>
                      </div>
                    </div>
                    {columns.length > 0 && (
                      <>
                        <div className="mb-3">
                          <label className="block text-ui-sm font-medium text-white/70 mb-1.5">Coluna</label>
                          <select
                            value={cloneListTargetColumnId}
                            onChange={(e) => {
                              setCloneListTargetColumnId(e.target.value);
                              const first = allTasks.find((t) => t.columnId === e.target.value);
                              setCloneListTargetTaskId(first?.id ?? '');
                            }}
                            className="w-full select-contraste rounded-xl px-4 py-3 text-ui"
                          >
                            {columns.map((c) => (
                              <option key={c.id} value={c.id}>{c.nome}</option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-4">
                          <label className="block text-ui-sm font-medium text-white/70 mb-1.5">Card de destino</label>
                          <select
                            value={cloneListTargetTaskId}
                            onChange={(e) => setCloneListTargetTaskId(e.target.value)}
                            className="w-full select-contraste rounded-xl px-4 py-3 text-ui"
                          >
                            {allTasks.filter((t) => t.columnId === cloneListTargetColumnId).map((t) => (
                              <option key={t.id} value={t.id}>{t.titulo}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setShowCloneListModal(null)} className="btn-ghost flex-1">Cancelar</button>
                      <button
                        type="button"
                        onClick={handleCloneList}
                        disabled={cloningList || !cloneListTargetTaskId}
                        className="flex-1 min-h-[44px] px-4 rounded-full bg-[#8B5CF6] text-white font-medium hover:bg-[#7C3AED] disabled:opacity-50"
                      >
                        {cloningList ? 'Clonando...' : 'Clonar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {subtasksByList().map(({ listId, listName, items }) => (
                <div key={listId ?? 'none'} className="rounded-xl bg-[#151520] border border-white/20 overflow-hidden">
                  <div className="px-4 py-2.5 bg-[#1a1a24] border-b border-white/20 text-ui font-semibold text-white/90 flex items-center justify-between gap-2">
                    <span>{listName}</span>
                    <div className="flex items-center gap-1">
                      {onCloneList && columns.length > 0 && allTasks.length > 0 && items.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowCloneListModal({ listName, items: items.map((s) => ({ titulo: s.titulo })) })}
                          className="p-1.5 rounded-lg text-white/50 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10 transition-colors"
                          title="Clonar lista para outro card"
                          aria-label="Clonar lista"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                      {listId != null && (
                        <button
                          type="button"
                          onClick={() => { setDeleteListAlsoSubtasks(false); setListToDelete({ listId, listName, count: items.length }); }}
                          className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Excluir lista"
                          aria-label="Excluir lista"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    {items.map((s) => (
                      <SubtaskRow
                        key={s.id}
                        subtask={s}
                        equipe={equipe}
                        listas={subtaskLists}
                        onToggle={() => handleToggleSubtask(s)}
                        onUpdate={(u) => updateSubtask(s.id, u)}
                        onDelete={() => deleteSubtask(s.id)}
                        onAddNested={() => addNestedSubtask(s.id)}
                        onToggleNested={(nestedId) => toggleNested(s.id, nestedId)}
                        onUpdateNested={(nestedId, u) => updateNested(s.id, nestedId, u)}
                        onDeleteNested={(nestedId) => deleteNested(s.id, nestedId)}
                        commentInput={subtaskCommentInput[s.id] ?? ''}
                        onCommentInput={(v) => setSubtaskCommentInput((prev) => ({ ...prev, [s.id]: v }))}
                        onAddComment={() => addSubtaskComment(s.id)}
                        getNestedCommentInput={(nestedId) => nestedCommentInput[`${s.id}-${nestedId}`] ?? ''}
                        onNestedCommentInput={(nestedId, v) => setNestedCommentInput((prev) => ({ ...prev, [`${s.id}-${nestedId}`]: v }))}
                        onAddNestedComment={(nestedId) => addNestedComment(s.id, nestedId)}
                      />
                    ))}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={listId != null ? (newSubtaskByList[listId] ?? '') : newSubtaskTitle}
                        onChange={(e) =>
                          listId != null
                            ? setNewSubtaskByList((p) => ({ ...p, [listId]: e.target.value }))
                            : setNewSubtaskTitle(e.target.value)
                        }
                        onKeyDown={(e) => e.key === 'Enter' && addSubtask(listId)}
                placeholder="Adicionar um item..."
                className="flex-1 bg-[#1a1a24] border border-white/20 rounded-xl px-4 py-3 text-ui text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50"
                      />
                      <button
                        type="button"
                        onClick={() => addSubtask(listId)}
                        className="btn-ghost btn-ghost-accent min-w-[44px]"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna direita - Estrutura + Comentários (estilo Trello) */}
          <div className="w-[460px] shrink-0 border-l border-white/10 flex flex-col bg-[#0A0A0F]/80">
            {/* Árvore de dependências: Task → Subtask → Sub-subtarefa (expansível, bom contraste, linhas estáveis) */}
            <div className="border-b border-white/10">
              <button
                type="button"
                onClick={() => setStructureExpanded((e) => !e)}
                className="w-full px-5 py-4 flex items-center justify-between gap-2 text-left hover:bg-white/[0.03] transition-colors rounded-t-lg"
                aria-expanded={structureExpanded}
              >
                <h4 className="text-ui-lg font-semibold text-white flex items-center gap-2">
                  {structureExpanded ? (
                    <ChevronDown className="w-5 h-5 text-[#8B5CF6] shrink-0" aria-hidden />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-[#8B5CF6] shrink-0" aria-hidden />
                  )}
                  <svg className="w-5 h-5 text-[#8B5CF6] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h7" />
                  </svg>
                  Estrutura da tarefa
                </h4>
                {!structureExpanded && subtasks.length > 0 && (
                  <span className="text-ui-sm text-white/70">
                    {subtasks.length} {subtasks.length === 1 ? 'subtarefa' : 'subtarefas'}
                  </span>
                )}
              </button>
              {structureExpanded && (
                <div className="px-5 pb-4">
                  <div className="rounded-xl bg-[#151520] border border-white/15 p-3 text-ui-sm max-h-[280px] overflow-y-auto scroll-discreto">
                    <div className="font-medium text-white truncate" title={title}>{title}</div>
                    <div className="mt-2 space-y-0 pl-3 border-l-2 border-[#8B5CF6]/50" role="tree" aria-label="Hierarquia da tarefa">
                      {subtasks.length === 0 ? (
                        <p className="py-2 text-white/70 italic">Nenhuma subtarefa</p>
                      ) : (
                        subtasks.map((s) => {
                          const subStyle = s.concluida ? 'text-emerald-400' : (s.dataVencimento && new Date(s.dataVencimento) < new Date() ? 'text-red-400' : 'text-amber-400');
                          return (
                            <div key={s.id} className="py-1.5 pl-2 border-b border-white/10 last:border-b-0" role="treeitem">
                              <div className="flex items-center gap-2 flex-wrap gap-y-0.5">
                                <span className={`truncate min-w-0 font-medium ${subStyle}`}>{s.titulo}</span>
                                {s.responsavel?.nome && (
                                  <span className="text-white/75 text-xs flex items-center gap-1 shrink-0">
                                    <User className="w-3.5 h-3.5" aria-hidden />
                                    {s.responsavel.nome}
                                  </span>
                                )}
                                {(s.dataInicio || s.dataVencimento) && (
                                  <span className="text-white/70 text-xs shrink-0">
                                    {[s.dataInicio, s.dataVencimento]
                                      .filter((d): d is string => Boolean(d))
                                      .map((d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }))
                                      .join(' → ')}
                                  </span>
                                )}
                              </div>
                              {(s.nestedSubtasks?.length ?? 0) > 0 && (
                                <div className="mt-1.5 ml-2 pl-3 border-l-2 border-white/20 space-y-1" role="group">
                                  {s.nestedSubtasks!.map((n) => {
                                    const nestStyle = n.concluida ? 'text-emerald-400' : (n.dataVencimento && new Date(n.dataVencimento) < new Date() ? 'text-red-400' : 'text-amber-400');
                                    return (
                                      <div key={n.id} className="flex items-center gap-2 flex-wrap gap-y-0.5 py-0.5">
                                        <span className="text-white/60 text-xs shrink-0" aria-hidden>•</span>
                                        <span className={`truncate min-w-0 text-ui-sm ${nestStyle}`}>{n.titulo}</span>
                                        {n.responsavel?.nome && (
                                          <span className="text-white/70 text-xs flex items-center gap-1 shrink-0">
                                            <User className="w-3 h-3" aria-hidden />
                                            {n.responsavel.nome}
                                          </span>
                                        )}
                                        {(n.dataInicio || n.dataVencimento) && (
                                          <span className="text-white/65 text-xs shrink-0">
                                            {[n.dataInicio, n.dataVencimento]
                                              .filter((d): d is string => Boolean(d))
                                              .map((d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }))
                                              .join(' → ')}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-b border-white/10">
              <h4 className="text-ui-lg font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#8B5CF6]" />
                Comentários e atividade
              </h4>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-discreto">
              {taskComments.length === 0 ? (
                <p className="text-sm text-white/40">Nenhum comentário. Seja o primeiro.</p>
              ) : (
                taskComments.map((c) => (
                  <div key={c.id} className="rounded-xl bg-white/5 p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-full bg-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] text-xs font-semibold">
                        {c.autor.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-white">{c.autor}</span>
                      <span className="text-xs text-white/40 ml-auto">{formatDate(c.data)}</span>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed pl-9">{c.texto}</p>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-white/10 relative">
              <textarea
                ref={commentInputRef}
                value={newComment}
                onChange={(e) => {
                  const v = e.target.value;
                  setNewComment(v);
                  const start = e.target.selectionStart ?? 0;
                  const before = v.slice(0, start);
                  const lastAt = before.lastIndexOf('@');
                  if (lastAt === -1) {
                    setMentionAt(null);
                    return;
                  }
                  const query = before.slice(lastAt + 1);
                  const hasSpace = /\s/.test(query);
                  if (hasSpace) setMentionAt(null);
                  else setMentionAt({ at: lastAt, query });
                }}
                onKeyDown={(e) => {
                  if (mentionAt && e.key === 'Escape') setMentionAt(null);
                }}
                placeholder="Escreva um comentário... Use @ para mencionar"
                rows={2}
                className="w-full bg-[#1a1a24] border border-white/20 rounded-xl px-4 py-3 text-ui text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50"
              />
              {mentionAt && equipe.length > 0 && (() => {
                const q = mentionAt.query.toLowerCase();
                const suggestions = equipe.filter((m) => m.nome.toLowerCase().includes(q)).slice(0, 5);
                if (suggestions.length === 0) return null;
                return (
                  <ul className="absolute left-4 right-4 mt-1 py-1 bg-[#1a1a24] border border-white/25 rounded-xl shadow-xl modal-layer-3 max-h-40 overflow-auto scroll-discreto">
                    {suggestions.map((m, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#8B5CF6]/30 hover:text-white flex items-center gap-2"
                          onClick={() => {
                            const el = commentInputRef.current;
                            const start = mentionAt.at;
                            const end = el ? el.selectionStart : newComment.length;
                            const newText = newComment.slice(0, start) + '@' + m.nome + ' ' + newComment.slice(end);
                            setNewComment(newText);
                            setMentionAt(null);
                            setTimeout(() => el?.focus(), 0);
                          }}
                        >
                          <span className="text-[#8B5CF6]">@</span>
                          {m.nome}
                        </button>
                      </li>
                    ))}
                  </ul>
                );
              })()}
              <button
                type="button"
                onClick={addTaskComment}
                disabled={!newComment.trim()}
                className="mt-2 w-full flex items-center justify-center gap-2 min-h-[44px] py-2 rounded-full bg-[#8B5CF6] text-white text-ui font-medium hover:bg-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Enviar
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <button type="button" onClick={handleRequestClose} className="btn-ghost">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => { handleSave(); onClose(); }}
            className="min-h-[44px] px-6 rounded-full bg-[#8B5CF6] text-white font-medium hover:bg-[#7C3AED] transition-colors"
          >
            Salvar
          </button>
        </div>
        </div>
      </div>
    </div>

    {showUnsavedConfirm && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center modal-layer-3 p-4">
        <div className="bg-[#151520] border border-white/20 rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <span className="text-amber-400 text-lg">⚠</span>
            </div>
            <div>
              <h4 className="text-ui-lg font-semibold text-white">Alterações não salvas</h4>
              <p className="text-ui-sm text-white/60 mt-1">
                Você tem alterações que não foram salvas. Deseja sair mesmo assim? O progresso será perdido.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowUnsavedConfirm(false)} className="btn-ghost flex-1">Continuar editando</button>
            <button type="button" onClick={handleCloseAnyway} className="flex-1 min-h-[44px] px-4 rounded-full bg-amber-500/20 text-amber-400 font-medium hover:bg-amber-500/30 border border-amber-500/30">
              Sair sem salvar
            </button>
          </div>
        </div>
      </div>
    )}
    {confirmCompleteSubtask && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center modal-layer-3 p-4" onClick={() => setConfirmCompleteSubtask(null)}>
        <div className="bg-[#151520] border border-white/20 rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <span className="text-amber-400 text-lg">⚠</span>
            </div>
            <div>
              <h4 className="text-ui-lg font-semibold text-white">Sub-subtarefas pendentes</h4>
              <p className="text-ui-sm text-white/60 mt-1">
                Existem sub-subtarefas não concluídas. Confirmar que todas foram realizadas?
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirmCompleteSubtask(null)} className="btn-ghost flex-1">Cancelar</button>
            <button type="button" onClick={() => confirmCompleteSubtask && toggleSubtask(confirmCompleteSubtask.id)} className="flex-1 min-h-[44px] px-4 rounded-full bg-[#8B5CF6] text-white font-medium hover:bg-[#7C3AED]">
              Sim, concluir
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}

function NestedRow({
  nested,
  equipe,
  onToggle,
  onUpdate,
  onDelete,
  commentInput,
  onCommentInput,
  onAddComment,
}: {
  nested: SubtaskNested;
  equipe: { nome: string; cargo?: string; avatar?: string }[];
  onToggle: () => void;
  onUpdate: (u: Partial<SubtaskNested>) => void;
  onDelete: () => void;
  commentInput: string;
  onCommentInput: (v: string) => void;
  onAddComment: () => void;
}) {
  const comments = nested.nestedComments || [];
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mentionAt, setMentionAt] = useState<{ at: number; query: string } | null>(null);
  const commentRef = useRef<HTMLInputElement>(null);

  const handleConfirmDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
    setShowEditModal(false);
  };

  return (
    <>
      <div className="rounded-lg bg-[#1a1a24] border border-white/10 overflow-hidden">
        <div className="flex items-center gap-2 p-2 flex-wrap">
          <Checkbox checked={nested.concluida} onCheckedChange={onToggle} aria-label="Concluída" className="shrink-0" />
          <span className="flex-1 min-w-0 text-ui-sm text-white truncate">{nested.titulo}</span>
          {nested.responsavel?.nome && (
            <span className="text-white/50 text-xs flex items-center gap-1 shrink-0">
              <User className="w-3 h-3" />
              {nested.responsavel.nome}
            </span>
          )}
          <button type="button" onClick={() => setShowEditModal(true)} className="btn-ghost min-h-[32px] min-w-[32px] p-1.5" title="Editar">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => setShowDeleteConfirm(true)} className="flex items-center min-h-[32px] px-2 py-1 rounded-full border border-red-500/30 text-red-400/90 hover:bg-red-500/10 text-xs" title="Excluir">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center modal-layer-3 p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-[#151520] border border-white/20 rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h4 className="text-ui-lg font-semibold text-white">Excluir sub-subtarefa?</h4>
                <p className="text-ui-sm text-white/60">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="btn-ghost flex-1">Cancelar</button>
              <button type="button" onClick={handleConfirmDelete} className="flex-1 min-h-[44px] px-4 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-medium hover:bg-red-500/30">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center modal-layer-3 p-4 scroll-discreto" onClick={() => setShowEditModal(false)}>
          <div className="bg-[#151520] border border-white/20 rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h4 className="text-ui-lg font-semibold text-white">Editar sub-subtarefa</h4>
              <button type="button" onClick={() => setShowEditModal(false)} className="p-2 rounded-full text-white/60 hover:bg-white/10 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-ui-sm font-medium text-white/70 mb-1.5">Título</label>
                <input
                  type="text"
                  value={nested.titulo}
                  onChange={(e) => onUpdate({ titulo: e.target.value })}
                  className="w-full bg-[#1a1a24] border border-white/20 rounded-xl px-4 py-3 text-ui text-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-ui-sm font-medium text-white/70 mb-1.5">Início</label>
                  <input
                    type="date"
                    value={nested.dataInicio || ''}
                    onChange={(e) => onUpdate({ dataInicio: e.target.value || undefined })}
                    className="w-full select-contraste rounded-xl px-4 py-3 text-ui"
                  />
                </div>
                <div>
                  <label className="block text-ui-sm font-medium text-white/70 mb-1.5">Fim</label>
                  <input
                    type="date"
                    value={nested.dataVencimento || ''}
                    onChange={(e) => onUpdate({ dataVencimento: e.target.value || undefined })}
                    className="w-full select-contraste rounded-xl px-4 py-3 text-ui"
                  />
                </div>
              </div>
              <div>
                <label className="block text-ui-sm font-medium text-white/70 mb-1.5">Responsável</label>
                <select
                  value={nested.responsavel?.nome || ''}
                  onChange={(e) => onUpdate({ responsavel: e.target.value ? { nome: e.target.value } : undefined })}
                  className="w-full select-contraste rounded-xl px-4 py-3 text-ui"
                >
                  <option value="">—</option>
                  {equipe.map((m, i) => (
                    <option key={i} value={m.nome}>{m.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-ui-sm font-medium text-white/70 mb-2">Comentários ({comments.length})</p>
                <div className="space-y-2">
                  {comments.map((c) => (
                    <div key={c.id} className="rounded-xl bg-[#1a1a24] border border-white/10 p-3">
                      <span className="text-[#8B5CF6] font-medium text-ui-sm">{c.autor}</span>
                      <span className="text-white/40 text-ui-sm ml-2">{formatDate(c.data)}</span>
                      <p className="mt-1 text-white/80 text-ui-sm">{c.texto}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2 relative">
                  <input
                    ref={commentRef}
                    type="text"
                    value={commentInput}
                    onChange={(e) => {
                      const v = e.target.value;
                      onCommentInput(v);
                      const start = e.target.selectionStart ?? 0;
                      const before = v.slice(0, start);
                      const lastAt = before.lastIndexOf('@');
                      if (lastAt === -1) { setMentionAt(null); return; }
                      const query = before.slice(lastAt + 1);
                      if (/\s/.test(query)) setMentionAt(null);
                      else setMentionAt({ at: lastAt, query });
                    }}
                    onKeyDown={(e) => { if (mentionAt && e.key === 'Escape') setMentionAt(null); if (e.key === 'Enter') onAddComment(); }}
                    placeholder="Comentar... Use @ para mencionar"
                    className="flex-1 min-w-0 bg-[#0A0A0F] border border-white/20 rounded-xl px-4 py-2.5 text-ui-sm text-white placeholder-white/50"
                  />
                  {mentionAt && equipe.length > 0 && (() => {
                    const q = mentionAt.query.toLowerCase();
                    const suggestions = equipe.filter((m) => m.nome.toLowerCase().includes(q)).slice(0, 5);
                    if (suggestions.length === 0) return null;
                    return (
                      <ul className="absolute left-0 right-12 top-full mt-1 py-1 bg-[#1a1a24] border border-white/25 rounded-xl shadow-xl z-[100] max-h-36 overflow-auto scroll-discreto">
                        {suggestions.map((m, i) => (
                          <li key={i}>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-ui-sm text-white hover:bg-[#8B5CF6]/30 flex items-center gap-1"
                              onClick={() => {
                                const el = commentRef.current;
                                const start = mentionAt.at;
                                const end = el ? el.selectionStart ?? commentInput.length : commentInput.length;
                                const newText = commentInput.slice(0, start) + '@' + m.nome + ' ' + commentInput.slice(end);
                                onCommentInput(newText);
                                setMentionAt(null);
                                setTimeout(() => el?.focus(), 0);
                              }}
                            >
                              <span className="text-[#8B5CF6]">@</span> {m.nome}
                            </button>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                  <button type="button" onClick={onAddComment} disabled={!commentInput.trim()} className="min-h-[40px] min-w-[40px] p-2 rounded-full bg-[#8B5CF6] text-white disabled:opacity-50">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between bg-white/[0.02]">
              <button type="button" onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 min-h-[44px] px-4 rounded-full border border-red-500/30 text-red-400/90 hover:bg-red-500/10 text-ui-sm">
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
              <button type="button" onClick={() => setShowEditModal(false)} className="min-h-[44px] px-5 rounded-full bg-[#8B5CF6] text-white font-medium hover:bg-[#7C3AED]">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SubtaskRow({
  subtask,
  equipe,
  listas,
  onToggle,
  onUpdate,
  onDelete,
  onAddNested,
  onToggleNested,
  onUpdateNested,
  onDeleteNested,
  commentInput,
  onCommentInput,
  onAddComment,
  getNestedCommentInput,
  onNestedCommentInput,
  onAddNestedComment,
}: {
  subtask: Subtask;
  equipe: { nome: string; cargo?: string; avatar?: string }[];
  listas: SubtaskList[];
  onToggle: () => void;
  onUpdate: (u: Partial<Subtask>) => void;
  onDelete: () => void;
  onAddNested: () => void;
  onToggleNested: (nestedId: string) => void;
  onUpdateNested: (nestedId: string, u: Partial<SubtaskNested>) => void;
  onDeleteNested: (nestedId: string) => void;
  commentInput: string;
  onCommentInput: (v: string) => void;
  onAddComment: () => void;
  getNestedCommentInput: (nestedId: string) => string;
  onNestedCommentInput: (nestedId: string, v: string) => void;
  onAddNestedComment: (nestedId: string) => void;
}) {
  const comments = subtask.subtaskComments || [];
  const nested = subtask.nestedSubtasks || [];
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mentionAt, setMentionAt] = useState<{ at: number; query: string } | null>(null);
  const subCommentRef = useRef<HTMLInputElement>(null);

  const handleConfirmDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
    setShowEditModal(false);
  };

  return (
    <>
      <div className="rounded-xl bg-[#151520] border border-white/15 overflow-hidden">
        <div className="flex items-center gap-3 p-3 flex-wrap">
          <Checkbox checked={subtask.concluida} onCheckedChange={onToggle} aria-label="Concluída" className="shrink-0" />
          <span className="flex-1 min-w-0 text-ui text-white truncate">{subtask.titulo}</span>
          {(subtask.responsavel?.nome || subtask.dataInicio || subtask.dataVencimento) && (
            <div className="flex items-center gap-2 text-ui-sm text-white/50 shrink-0">
              {subtask.responsavel?.nome && (
                <span className="flex items-center gap-1" title="Responsável">
                  <User className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[100px]">{subtask.responsavel.nome}</span>
                </span>
              )}
              {(subtask.dataInicio || subtask.dataVencimento) && (
                <span className="text-white/40">
                  {[subtask.dataInicio, subtask.dataVencimento]
                    .filter((d): d is string => Boolean(d))
                    .map((d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }))
                    .join(' → ')}
                </span>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="btn-ghost min-h-[36px] min-w-[36px] px-3 py-1.5 text-ui-sm"
            title="Editar subtarefa"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-full border border-red-500/30 text-red-400/90 hover:bg-red-500/10 hover:text-red-400 text-ui-sm transition-colors"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center modal-layer-3 p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-[#151520] border border-white/20 rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h4 className="text-ui-lg font-semibold text-white">Excluir subtarefa?</h4>
                <p className="text-ui-sm text-white/60">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="btn-ghost flex-1">
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 min-h-[44px] px-4 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-medium hover:bg-red-500/30"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição da subtarefa */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center modal-layer-2 p-4 scroll-discreto" onClick={() => setShowEditModal(false)}>
          <div
            className="bg-[#151520] border border-white/20 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h4 className="text-ui-lg font-semibold text-white">Editar subtarefa</h4>
              <button type="button" onClick={() => setShowEditModal(false)} className="p-2 rounded-full text-white/60 hover:bg-white/10 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <label className="block text-ui-sm font-medium text-white/70 mb-1.5">Título</label>
                <input
                  type="text"
                  value={subtask.titulo}
                  onChange={(e) => onUpdate({ titulo: e.target.value })}
                  className="w-full bg-[#1a1a24] border border-white/20 rounded-xl px-4 py-3 text-ui text-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-ui-sm font-medium text-white/70 mb-1.5">Início</label>
                  <input
                    type="date"
                    value={subtask.dataInicio || ''}
                    onChange={(e) => onUpdate({ dataInicio: e.target.value || undefined })}
                    className="w-full select-contraste rounded-xl px-4 py-3 text-ui"
                  />
                </div>
                <div>
                  <label className="block text-ui-sm font-medium text-white/70 mb-1.5">Fim</label>
                  <input
                    type="date"
                    value={subtask.dataVencimento || ''}
                    onChange={(e) => onUpdate({ dataVencimento: e.target.value || undefined })}
                    className="w-full select-contraste rounded-xl px-4 py-3 text-ui"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-ui-sm font-medium text-white/70 mb-1.5">Lista</label>
                  <select
                    value={subtask.subtaskListId || ''}
                    onChange={(e) => onUpdate({ subtaskListId: e.target.value || undefined })}
                    className="w-full select-contraste rounded-xl px-4 py-3 text-ui"
                  >
                    <option value="">Sem lista</option>
                    {listas.map((l) => (
                      <option key={l.id} value={l.id}>{l.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-ui-sm font-medium text-white/70 mb-1.5">Responsável</label>
                  <select
                    value={subtask.responsavel?.nome || ''}
                    onChange={(e) => onUpdate({ responsavel: e.target.value ? { nome: e.target.value } : undefined })}
                    className="w-full select-contraste rounded-xl px-4 py-3 text-ui"
                  >
                    <option value="">—</option>
                    {equipe.map((m, i) => (
                      <option key={i} value={m.nome}>{m.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <p className="text-ui-sm font-medium text-white/70 mb-2">Sub-subtarefas</p>
                <div className="space-y-2">
                  {nested.map((n) => (
                    <NestedRow
                      key={n.id}
                      nested={n}
                      equipe={equipe}
                      onToggle={() => onToggleNested(n.id)}
                      onUpdate={(u) => onUpdateNested(n.id, u)}
                      onDelete={() => onDeleteNested(n.id)}
                      commentInput={getNestedCommentInput(n.id)}
                      onCommentInput={(v) => onNestedCommentInput(n.id, v)}
                      onAddComment={() => onAddNestedComment(n.id)}
                    />
                  ))}
                  <button type="button" onClick={onAddNested} className="btn-ghost btn-ghost-accent w-full justify-center mt-1">
                    <Plus className="w-4 h-4" /> Sub-subtarefa
                  </button>
                </div>
              </div>
              <div>
                <p className="text-ui-sm font-medium text-white/70 mb-2">Comentários ({comments.length})</p>
                <div className="space-y-2">
                  {comments.map((c) => (
                    <div key={c.id} className="rounded-xl bg-[#1a1a24] border border-white/10 p-3">
                      <span className="text-[#8B5CF6] font-medium text-ui-sm">{c.autor}</span>
                      <span className="text-white/40 text-ui-sm ml-2">{formatDate(c.data)}</span>
                      <p className="mt-1 text-white/80 text-ui-sm">{c.texto}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2 relative">
                  <input
                    ref={subCommentRef}
                    type="text"
                    value={commentInput}
                    onChange={(e) => {
                      const v = e.target.value;
                      onCommentInput(v);
                      const start = e.target.selectionStart ?? 0;
                      const before = v.slice(0, start);
                      const lastAt = before.lastIndexOf('@');
                      if (lastAt === -1) { setMentionAt(null); return; }
                      const query = before.slice(lastAt + 1);
                      if (/\s/.test(query)) setMentionAt(null);
                      else setMentionAt({ at: lastAt, query });
                    }}
                    onKeyDown={(e) => { if (mentionAt && e.key === 'Escape') setMentionAt(null); if (e.key === 'Enter') onAddComment(); }}
                    placeholder="Comentar... Use @ para mencionar"
                    className="flex-1 min-w-0 bg-[#0A0A0F] border border-white/20 rounded-xl px-4 py-2.5 text-ui-sm text-white placeholder-white/50"
                  />
                  {mentionAt && equipe.length > 0 && (() => {
                    const q = mentionAt.query.toLowerCase();
                    const suggestions = equipe.filter((m) => m.nome.toLowerCase().includes(q)).slice(0, 5);
                    if (suggestions.length === 0) return null;
                    return (
                      <ul className="absolute left-0 right-12 top-full mt-1 py-1 bg-[#1a1a24] border border-white/25 rounded-xl shadow-xl modal-layer-3 max-h-36 overflow-auto scroll-discreto">
                        {suggestions.map((m, i) => (
                          <li key={i}>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-ui-sm text-white hover:bg-[#8B5CF6]/30 flex items-center gap-1"
                              onClick={() => {
                                const el = subCommentRef.current;
                                const start = mentionAt.at;
                                const end = el ? el.selectionStart ?? commentInput.length : commentInput.length;
                                const newText = commentInput.slice(0, start) + '@' + m.nome + ' ' + commentInput.slice(end);
                                onCommentInput(newText);
                                setMentionAt(null);
                                setTimeout(() => el?.focus(), 0);
                              }}
                            >
                              <span className="text-[#8B5CF6]">@</span> {m.nome}
                            </button>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                  <button type="button" onClick={onAddComment} disabled={!commentInput.trim()} className="min-h-[40px] min-w-[40px] p-2 rounded-full bg-[#8B5CF6] text-white disabled:opacity-50">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 min-h-[44px] px-4 rounded-full border border-red-500/30 text-red-400/90 hover:bg-red-500/10 text-ui-sm"
              >
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
              <button type="button" onClick={() => setShowEditModal(false)} className="min-h-[44px] px-5 rounded-full bg-[#8B5CF6] text-white font-medium hover:bg-[#7C3AED]">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
