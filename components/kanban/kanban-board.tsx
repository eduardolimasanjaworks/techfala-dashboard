'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import type { Pipeline, Task, Label } from '@/lib/mock-data';
import { SortableKanbanColumn } from './sortable-kanban-column';
import { TaskCard } from './task-card';
import { TaskDetailModal } from './task-detail-modal';
import { KanbanLabelFilter } from './kanban-label-filter';

interface Epic { id: string; nome: string; items?: unknown[] }

interface KanbanBoardProps {
  pipeline: Pipeline;
  onPipelineChange: (pipeline: Pipeline) => void;
  equipe?: { nome: string; cargo: string; avatar?: string }[];
  epics?: Epic[];
  labels?: Label[];
  projectId?: string;
  onLabelCreated?: (label: Label) => void;
  onLabelDeleted?: (labelId: string) => void;
}

export function KanbanBoard({ pipeline, onPipelineChange, equipe = [], epics = [], labels = [], projectId, onLabelCreated, onLabelDeleted }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [newTaskColumn, setNewTaskColumn] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  const filteredPipeline = useMemo(() => {
    if (selectedLabelIds.length === 0) return pipeline;
    return {
      ...pipeline,
      colunas: pipeline.colunas.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.labels?.some((l) => selectedLabelIds.includes(l.id))),
      })),
    };
  }, [pipeline, selectedLabelIds]);

  const activationConstraint = { distance: 8 };
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint }),
    useSensor(TouchSensor, { activationConstraint })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const isColumnDrag = pipeline.colunas.some(c => c.id === active.id);

    if (isColumnDrag) {
      const oldIndex = pipeline.colunas.findIndex(c => c.id === active.id);
      const newIndex = pipeline.colunas.findIndex(c => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const newColunas = arrayMove(pipeline.colunas, oldIndex, newIndex);
      const withOrdems = newColunas.map((col, i) => ({ ...col, ordem: i }));
      try {
        await Promise.all(
          withOrdems.map(col =>
            fetch(`/api/columns/${col.id}`, {
              method: 'PATCH',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ordem: col.ordem }),
            })
          )
        );
        onPipelineChange({ ...pipeline, colunas: withOrdems });
      } catch {
        // rollback handled by not updating state
      }
      return;
    }

    const taskId = active.id as string;
    let targetColumnId: string | null = null;
    if (pipeline.colunas.some(c => c.id === over.id)) {
      targetColumnId = over.id as string;
    } else {
      const col = pipeline.colunas.find(c => c.tasks.some(t => t.id === over.id));
      if (col) targetColumnId = col.id;
    }
    if (!targetColumnId) return;

    let sourceColumnId: string | null = null;
    let task: Task | undefined;
    for (const coluna of pipeline.colunas) {
      const foundTask = coluna.tasks.find(t => t.id === taskId);
      if (foundTask) {
        task = foundTask;
        sourceColumnId = coluna.id;
        break;
      }
    }

    if (!task || !sourceColumnId) return;

    // Reordenar dentro da mesma coluna
    if (sourceColumnId === targetColumnId) {
      const col = pipeline.colunas.find(c => c.id === sourceColumnId)!;
      const oldIndex = col.tasks.findIndex(t => t.id === taskId);
      let newIndex: number;
      if (pipeline.colunas.some(c => c.id === over.id)) {
        newIndex = col.tasks.length - 1;
      } else {
        const overTaskIdx = col.tasks.findIndex(t => t.id === over.id);
        newIndex = overTaskIdx >= 0 ? overTaskIdx : oldIndex;
      }
      if (oldIndex === newIndex) return;
      const newTasks = arrayMove(col.tasks, oldIndex, newIndex);
      const updatedColunas = pipeline.colunas.map(c =>
        c.id === sourceColumnId ? { ...c, tasks: newTasks } : c
      );
      onPipelineChange({ ...pipeline, colunas: updatedColunas });
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId: targetColumnId }),
      });
      if (!res.ok) return;
    } catch {
      return;
    }

    const updatedColunas = pipeline.colunas.map(coluna => {
      if (coluna.id === sourceColumnId) {
        return { ...coluna, tasks: coluna.tasks.filter(t => t.id !== taskId) };
      }
      if (coluna.id === targetColumnId) {
        return { ...coluna, tasks: [...coluna.tasks, task!] };
      }
      return coluna;
    });
    onPipelineChange({ ...pipeline, colunas: updatedColunas });
  };

  const addColumn = async () => {
    try {
      const res = await fetch(`/api/pipelines/${pipeline.id}/columns`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: 'Nova coluna' }),
      });
      if (res.ok) {
        const newCol = await res.json();
        onPipelineChange({
          ...pipeline,
          colunas: [...pipeline.colunas, newCol],
        });
      }
    } catch {
      // ignore
    }
  };

  const deleteColumn = async (columnId: string) => {
    const col = pipeline.colunas.find(c => c.id === columnId);
    if (!col) return;
    const taskCount = col.tasks.length;
    if (taskCount > 0 && !window.confirm(`A coluna "${col.nome}" tem ${taskCount} tarefa(s). Excluir mesmo assim? As tarefas serão removidas.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/columns/${columnId}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        if (selectedTask && pipeline.colunas.some(c => c.id === columnId && c.tasks.some(t => t.id === selectedTask.id))) {
          setSelectedTask(null);
        }
        onPipelineChange({
          ...pipeline,
          colunas: pipeline.colunas.filter(c => c.id !== columnId),
        });
      }
    } catch {
      // ignore
    }
  };

  const handleUpdateColumn = async (columnId: string, updates: { cor?: string; corFonte?: string; responsavelNome?: string | null }) => {
    try {
      const res = await fetch(`/api/columns/${columnId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        const newCor = updates.cor ?? updated.cor;
        const newCorFonte = updates.corFonte ?? updated.corFonte;
        const newResponsavel = updates.responsavelNome !== undefined ? updates.responsavelNome : (updated.responsavelNome ?? undefined);
        onPipelineChange({
          ...pipeline,
          colunas: pipeline.colunas.map((c) =>
            c.id === columnId
              ? { ...c, cor: newCor ?? c.cor, corFonte: newCorFonte ?? c.corFonte, responsavelNome: newResponsavel ?? c.responsavelNome }
              : c
          ),
        });
      }
    } catch {
      // ignore
    }
  };

  const handleMoveTasks = async (taskIds: string[], targetColumnId: string) => {
    try {
      for (const tid of taskIds) {
        const res = await fetch(`/api/tasks/${tid}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ columnId: targetColumnId }),
        });
        if (!res.ok) return;
      }
      const updatedColunas = pipeline.colunas.map((col) => {
        const moving = col.tasks.filter((t) => taskIds.includes(t.id));
        const staying = col.tasks.filter((t) => !taskIds.includes(t.id));
        if (col.id === targetColumnId) {
          const incoming = pipeline.colunas.flatMap((c) =>
            c.id !== targetColumnId ? c.tasks.filter((t) => taskIds.includes(t.id)) : []
          );
          return { ...col, tasks: [...col.tasks, ...incoming] };
        }
        return { ...col, tasks: staying };
      });
      onPipelineChange({ ...pipeline, colunas: updatedColunas });
      setSelectedTaskIds([]);
    } catch {
      // ignore
    }
  };

  const handleRenameColumn = async (columnId: string, nome: string) => {
    try {
      const res = await fetch(`/api/columns/${columnId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome }),
      });
      if (!res.ok) return;
      const updatedColunas = pipeline.colunas.map(c =>
        c.id === columnId ? { ...c, nome } : c
      );
      onPipelineChange({ ...pipeline, colunas: updatedColunas });
    } catch {
      // ignore
    }
  };

  const addTask = async (columnId: string) => {
    try {
      const response = await fetch(`/api/columns/${columnId}/tasks`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: newTaskTitle.trim() || '' }),
      });

      if (response.ok) {
        const newTask = await response.json();
        const updatedColunas = pipeline.colunas.map(coluna =>
          coluna.id === columnId
            ? { ...coluna, tasks: [...coluna.tasks, newTask] }
            : coluna
        );

        onPipelineChange({
          ...pipeline,
          colunas: updatedColunas,
        });

        setNewTaskTitle('');
        setNewTaskColumn(null);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const deleteTask = async (columnId: string, taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        const updatedColunas = pipeline.colunas.map(coluna =>
          coluna.id === columnId
            ? { ...coluna, tasks: coluna.tasks.filter(t => t.id !== taskId) }
            : coluna
        );

        onPipelineChange({
          ...pipeline,
          colunas: updatedColunas,
        });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const updateTask = async (columnId: string, taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        const updatedColunas = pipeline.colunas.map(coluna =>
          coluna.id === columnId
            ? {
                ...coluna,
                tasks: coluna.tasks.map(t =>
                  t.id === taskId ? updatedTask : t
                ),
              }
            : coluna
        );

        onPipelineChange({
          ...pipeline,
          colunas: updatedColunas,
        });
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const activeTask = activeId
    ? pipeline.colunas
        .flatMap(c => c.tasks)
        .find(t => t.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6 overflow-x-hidden">
        {selectedTaskIds.length > 0 && (
          <div className="mb-3 px-4 py-2 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 flex items-center justify-between">
            <span className="text-sm text-[#A78BFA]">
              {selectedTaskIds.length} card(s) selecionado(s) — use <strong>Mover</strong> em qualquer um para mover todos
            </span>
            <button
              type="button"
              onClick={() => setSelectedTaskIds([])}
              className="text-xs text-[#9CA3AF] hover:text-white"
            >
              Limpar seleção
            </button>
          </div>
        )}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-xl font-semibold text-white">{pipeline.nome}</h3>
          <KanbanLabelFilter
            labels={labels}
            selectedLabelIds={selectedLabelIds}
            onToggleLabel={(id) => setSelectedLabelIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
            projectId={projectId}
            onLabelCreated={onLabelCreated}
            onLabelDeleted={onLabelDeleted}
          />
        </div>

        <SortableContext
          items={filteredPipeline.colunas.map(c => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-4 overflow-x-auto pb-2">
            {filteredPipeline.colunas.map((coluna) => (
              <div key={coluna.id} className="flex-shrink-0 w-72 min-w-[288px]">
                <SortableKanbanColumn
                  coluna={coluna}
                  equipe={equipe}
                  allColumns={filteredPipeline.colunas}
                  onAddTask={() => setNewTaskColumn(coluna.id)}
                  onDeleteTask={(taskId) => deleteTask(coluna.id, taskId)}
                  onUpdateTask={(taskId, updates) => updateTask(coluna.id, taskId, updates)}
                  onTaskClick={(task) => setSelectedTask(task)}
                  onRenameColumn={handleRenameColumn}
                  onUpdateColumn={handleUpdateColumn}
                  onDeleteColumn={() => deleteColumn(coluna.id)}
                  onMoveTasks={handleMoveTasks}
                  selectedTaskIds={selectedTaskIds}
                  onToggleTaskSelect={(tid) =>
                    setSelectedTaskIds((prev) =>
                      prev.includes(tid) ? prev.filter((id) => id !== tid) : [...prev, tid]
                    )
                  }
                  isAddingTask={newTaskColumn === coluna.id}
                  newTaskTitle={newTaskTitle}
                  onNewTaskTitleChange={setNewTaskTitle}
                  onConfirmAddTask={() => addTask(coluna.id)}
                  onCancelAddTask={() => {
                    setNewTaskColumn(null);
                    setNewTaskTitle('');
                  }}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addColumn}
              className="flex-shrink-0 w-72 min-w-[288px] flex items-center justify-center gap-2 p-4 min-h-[500px] border-2 border-dashed border-[#1F1F2E] rounded-lg text-[#9CA3AF] hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors"
            >
              <span className="text-2xl">+</span>
              <span className="text-sm font-medium">Nova coluna</span>
            </button>
          </div>
        </SortableContext>
      </div>

      <DragOverlay modifiers={[snapCenterToCursor]}>
        {activeTask ? <TaskCard task={activeTask} equipe={equipe} isDragging /> : null}
      </DragOverlay>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          equipe={equipe}
          epics={epics}
          labels={labels}
          projectId={projectId}
          onLabelCreated={onLabelCreated}
          onClose={() => setSelectedTask(null)}
          columnId={pipeline.colunas.find(c => c.tasks.some(t => t.id === selectedTask.id))?.id}
          columns={pipeline.colunas.map(c => ({ id: c.id, nome: c.nome }))}
          allTasks={pipeline.colunas.flatMap(col => col.tasks.map(t => ({ id: t.id, titulo: t.titulo, columnId: col.id, columnNome: col.nome })))}
          onUpdate={async (updates) => {
            const column = pipeline.colunas.find(c =>
              c.tasks.some(t => t.id === selectedTask.id)
            );
            if (column) {
              await updateTask(column.id, selectedTask.id, updates);
            }
            setSelectedTask(null);
          }}
          onClone={async (payload) => {
            const targetCol = payload.targetColumnId ?? pipeline.colunas.find(c => c.tasks.some(t => t.id === selectedTask.id))?.id;
            if (!targetCol) return;
            const res = await fetch(`/api/columns/${targetCol}/tasks`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (!res.ok) return;
            const newTask = await res.json();
            const updatedColunas = pipeline.colunas.map(col =>
              col.id === targetCol ? { ...col, tasks: [...col.tasks, newTask] } : col
            );
            onPipelineChange({ ...pipeline, colunas: updatedColunas });
          }}
          onCloneList={async (payload) => {
            const listName = payload.listName === 'Sem lista' ? undefined : payload.listName;
            const res = await fetch(`/api/tasks/${payload.targetTaskId}/subtasks`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ listName, items: payload.items }),
            });
            if (res.ok) {
              setSelectedTask(null);
            }
          }}
        />
      )}
    </DndContext>
  );
}
