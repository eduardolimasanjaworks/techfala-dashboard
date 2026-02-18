'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, GripVertical, Trash2, User, Palette, Type } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Coluna, Task } from '@/lib/mock-data';
import { SortableTaskCard } from './sortable-task-card';

interface KanbanColumnProps {
  coluna: Coluna;
  equipe: { nome: string; cargo: string; avatar?: string }[];
  allColumns: Coluna[];
  currentColumnId: string;
  onAddTask: () => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onTaskClick: (task: Task) => void;
  onRenameColumn?: (columnId: string, nome: string) => void;
  onUpdateColumn?: (columnId: string, updates: { cor?: string; corFonte?: string; responsavelNome?: string | null }) => void;
  onDeleteColumn?: () => void;
  onMoveTasks?: (taskIds: string[], targetColumnId: string) => void;
  selectedTaskIds?: string[];
  onToggleTaskSelect?: (taskId: string) => void;
  columnDragHandleProps?: { attributes: any; listeners: any };
  isAddingTask: boolean;
  newTaskTitle: string;
  onNewTaskTitleChange: (title: string) => void;
  onConfirmAddTask: () => void;
  onCancelAddTask: () => void;
}

export function KanbanColumn({
  coluna,
  equipe,
  allColumns,
  currentColumnId,
  onAddTask,
  onDeleteTask,
  onUpdateTask,
  onTaskClick,
  onRenameColumn,
  onUpdateColumn,
  onDeleteColumn,
  onMoveTasks,
  selectedTaskIds = [],
  onToggleTaskSelect,
  columnDragHandleProps,
  isAddingTask,
  newTaskTitle,
  onNewTaskTitleChange,
  onConfirmAddTask,
  onCancelAddTask,
}: KanbanColumnProps) {
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState(coluna.nome);
  const DEFAULT_COR = '#1b064b';
  const DEFAULT_COR_FONTE = '#ffffff';

  const [editingCor, setEditingCor] = useState(false);
  const [editCor, setEditCor] = useState(coluna.cor || DEFAULT_COR);
  const [editCorFonte, setEditCorFonte] = useState(coluna.corFonte || DEFAULT_COR_FONTE);
  const [editingResponsavel, setEditingResponsavel] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { setNodeRef, isOver } = useDroppable({ id: coluna.id });
  const columnColor = coluna.cor || DEFAULT_COR;
  const columnFontColor = coluna.corFonte || DEFAULT_COR_FONTE;

  useEffect(() => {
    setEditName(coluna.nome);
  }, [coluna.nome]);

  useEffect(() => {
    setEditCor(coluna.cor || DEFAULT_COR);
    setEditCorFonte(coluna.corFonte || DEFAULT_COR_FONTE);
  }, [coluna.cor, coluna.corFonte]);

  useEffect(() => {
    if (editingName) inputRef.current?.focus();
  }, [editingName]);

  const saveRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== coluna.nome && onRenameColumn) {
      onRenameColumn(coluna.id, trimmed);
    } else {
      setEditName(coluna.nome);
    }
    setEditingName(false);
  };

  const saveCor = () => {
    let c = (editCor.trim() || '#8B5CF6');
    if (!c.startsWith('#')) c = `#${c}`;
    if (onUpdateColumn) {
      onUpdateColumn(coluna.id, { cor: c });
    }
    setEditingCor(false);
  };

  const saveResponsavel = (nome: string | null) => {
    if (onUpdateColumn) {
      onUpdateColumn(coluna.id, { responsavelNome: nome || null });
    }
    setEditingResponsavel(false);
  };

  const bgColor = columnColor.startsWith('#') ? columnColor : `#${columnColor}`;
  const fontColor = columnFontColor.startsWith('#') ? columnFontColor : `#${columnFontColor}`;
  const bgStyle = { backgroundColor: bgColor, borderLeft: `4px solid ${bgColor}`, color: fontColor };

  return (
    <div
      ref={setNodeRef}
      className={`border border-[#1F1F2E] rounded-lg p-4 min-h-[500px] flex flex-col transition-colors ${
        isOver ? 'ring-2 ring-[#8B5CF6]' : ''
      }`}
      style={bgStyle}
    >
      <div className="flex items-center justify-between mb-4 gap-2">
        {columnDragHandleProps && (
          <button
            type="button"
            className="p-1 rounded text-[#9CA3AF] hover:bg-[#1F1F2E] hover:text-white cursor-grab active:cursor-grabbing touch-none shrink-0"
            {...columnDragHandleProps.attributes}
            {...columnDragHandleProps.listeners}
            aria-label="Arrastar coluna"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
        {editingName ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={saveRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveRename();
              if (e.key === 'Escape') {
                setEditName(coluna.nome);
                setEditingName(false);
              }
            }}
            className="flex-1 min-w-0 bg-[#151520] text-white text-sm font-semibold px-2 py-1 rounded border border-[#8B5CF6] outline-none"
          />
        ) : (
          <h4
            className="font-semibold truncate cursor-pointer hover:opacity-80 py-1"
            style={{ color: fontColor }}
            onClick={() => onRenameColumn && setEditingName(true)}
            title="Clique para renomear"
          >
            {coluna.nome}
          </h4>
        )}
        <span className="text-sm bg-[#151520]/80 px-2 py-1 rounded shrink-0" style={{ color: fontColor }}>
          {coluna.tasks.length}
        </span>
        {onDeleteColumn && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDeleteColumn(); }}
            className="p-1 rounded text-[#9CA3AF] hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
            aria-label={`Excluir coluna ${coluna.nome}`}
            title="Excluir coluna"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {/* Cor e responsável da coluna */}
      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
        {editingCor ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-[#9CA3AF]" aria-label="Fundo" />
              <input
                type="color"
                value={editCor.startsWith('#') ? editCor : `#${editCor}`}
                onChange={(e) => setEditCor(e.target.value)}
                className="w-8 h-6 rounded cursor-pointer border-0 p-0"
              />
              <input
                type="text"
                value={editCor}
                onChange={(e) => setEditCor(e.target.value)}
                className="w-20 bg-[#151520] text-white px-2 py-1 rounded border border-[#1F1F2E] text-xs"
                placeholder="#1b064b"
              />
            </div>
            <div className="flex items-center gap-1">
              <Type className="w-3.5 h-3.5 text-[#9CA3AF]" aria-label="Fonte" />
              <input
                type="color"
                value={editCorFonte.startsWith('#') ? editCorFonte : `#${editCorFonte}`}
                onChange={(e) => setEditCorFonte(e.target.value)}
                className="w-8 h-6 rounded cursor-pointer border-0 p-0"
              />
              <input
                type="text"
                value={editCorFonte}
                onChange={(e) => setEditCorFonte(e.target.value)}
                className="w-20 bg-[#151520] text-white px-2 py-1 rounded border border-[#1F1F2E] text-xs"
                placeholder="#ffffff"
              />
            </div>
            <button type="button" onClick={saveCor} className="px-2 py-1 bg-[#8B5CF6] text-white rounded">Ok</button>
            <button type="button" onClick={() => setEditingCor(false)} className="px-2 py-1 text-[#9CA3AF]">Cancelar</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingCor(true)}
            className="flex items-center gap-1 text-[#9CA3AF] hover:text-white"
            title="Editar cor da coluna"
          >
            <Palette className="w-3.5 h-3.5" />
            <span
              className="w-3 h-3 rounded border border-white/30"
              style={{ backgroundColor: columnColor }}
            />
          </button>
        )}
        {editingResponsavel ? (
          <select
            value={coluna.responsavelNome ?? ''}
            onChange={(e) => saveResponsavel(e.target.value || null)}
            onBlur={() => setEditingResponsavel(false)}
            className="bg-[#151520] text-white text-xs px-2 py-1 rounded border border-[#1F1F2E] max-w-[120px]"
            autoFocus
          >
            <option value="">Sem responsável</option>
            {equipe.map((m) => (
              <option key={m.nome} value={m.nome}>{m.nome}</option>
            ))}
          </select>
        ) : (
          <button
            type="button"
            onClick={() => setEditingResponsavel(true)}
            className="flex items-center gap-1 text-[#9CA3AF] hover:text-white truncate max-w-[140px]"
            title="Definir responsável da coluna"
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            {coluna.responsavelNome || 'Responsável'}
          </button>
        )}
      </div>

      <SortableContext
        items={coluna.tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden min-h-0">
          {coluna.tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              equipe={equipe}
              allColumns={allColumns}
              currentColumnId={currentColumnId}
              onDelete={() => onDeleteTask(task.id)}
              onClick={() => onTaskClick(task)}
              onMoveToColumn={
                onMoveTasks
                  ? (targetId) =>
                      onMoveTasks(
                        selectedTaskIds.includes(task.id) && selectedTaskIds.length > 0
                          ? selectedTaskIds
                          : [task.id],
                        targetId
                      )
                  : undefined
              }
              isSelected={selectedTaskIds.includes(task.id)}
              onToggleSelect={onToggleTaskSelect}
            />
          ))}
        </div>
      </SortableContext>

      {isAddingTask ? (
        <div className="mt-4 p-3 bg-[#151520] rounded-lg border border-[#8B5CF6]">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => onNewTaskTitleChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onConfirmAddTask()}
            placeholder="Nome da tarefa..."
            className="w-full bg-transparent text-white text-sm border-none outline-none placeholder-[#9CA3AF] mb-2"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={onConfirmAddTask}
              className="flex-1 px-3 py-1.5 bg-[#8B5CF6] text-white rounded text-sm hover:bg-[#7C3AED] transition-colors"
            >
              Adicionar
            </button>
            <button
              onClick={onCancelAddTask}
              className="px-3 py-1.5 bg-[#1F1F2E] text-[#9CA3AF] rounded text-sm hover:bg-[#2A2A3E] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onAddTask}
          className="mt-4 w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[#1F1F2E] rounded-lg text-[#9CA3AF] hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Adicionar tarefa</span>
        </button>
      )}
    </div>
  );
}
