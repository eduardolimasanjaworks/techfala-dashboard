'use client';

import { useState } from 'react';
import { Calendar, User, X, ArrowRight, CheckSquare, Square } from 'lucide-react';
import type { Task, Coluna } from '@/lib/mock-data';

interface TaskCardProps {
  task: Task;
  equipe: { nome: string; cargo: string; avatar?: string }[];
  allColumns?: Coluna[];
  currentColumnId?: string;
  isDragging?: boolean;
  onDelete?: () => void;
  onClick?: () => void;
  onMoveToColumn?: (targetColumnId: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (taskId: string) => void;
  onMoveTasks?: (taskIds: string[], targetColumnId: string) => void;
  selectedCount?: number;
  /** Atributos e listeners do dnd-kit para arrastar; se passados, o card inteiro fica draggable */
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function TaskCard({
  task,
  equipe = [],
  allColumns = [],
  currentColumnId,
  isDragging = false,
  onDelete,
  onClick,
  onMoveToColumn,
  isSelected = false,
  onToggleSelect,
  onMoveTasks,
  selectedCount = 0,
  dragHandleProps,
}: TaskCardProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const otherColumns = allColumns.filter((c) => c.id !== currentColumnId);
  const completedSubtasks = task.subtasks?.filter(s => s.concluida).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const isOverdue = task.dataVencimento
    ? new Date(task.dataVencimento) < new Date() && !task.subtasks?.every(s => s.concluida)
    : false;

  const priorityColors = {
    baixa: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    media: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    alta: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    urgente: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <div
      className={`relative bg-[#12121a] border rounded-2xl p-4 transition-all duration-200 group ${
        isSelected ? 'ring-2 ring-[#8B5CF6] border-[#8B5CF6]/50' : 'border-white/10'
      } ${
        dragHandleProps ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } hover:border-[#8B5CF6]/40 hover:shadow-lg hover:shadow-[#8B5CF6]/5 ${
        isDragging ? 'shadow-xl scale-[1.02] ring-2 ring-[#8B5CF6]/50' : ''
      }`}
      onClick={onClick}
      {...(dragHandleProps ?? {})}
    >
      {/* Checkbox para seleção múltipla */}
      {onToggleSelect && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleSelect(task.id); }}
          className="absolute left-2 top-2 z-10 p-1 rounded text-[#9CA3AF] hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10 opacity-0 group-hover:opacity-100 transition-opacity"
          title={isSelected ? 'Desmarcar' : 'Selecionar para mover'}
        >
          {isSelected ? <CheckSquare className="w-4 h-4 text-[#8B5CF6]" /> : <Square className="w-4 h-4" />}
        </button>
      )}
      {/* Labels no topo, estilo Trello */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3 -mt-0.5 -mx-0.5">
          {task.labels.map((l) => (
            <span
              key={l.id}
              className="px-2 py-1 rounded text-xs font-medium max-w-[120px] truncate"
              style={{
                backgroundColor: `${l.cor}25`,
                borderLeft: `3px solid ${l.cor}`,
                color: l.cor,
              }}
              title={l.nome}
            >
              {l.nome}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h5 className="text-sm font-medium text-white mb-0.5 leading-snug">{task.titulo}</h5>
          <div className="flex items-center gap-2 flex-wrap text-xs text-white/50">
            {task.responsavel && (
              <span className="flex items-center gap-1 shrink-0">
                <User className="w-3 h-3" />
                {task.responsavel.nome}
              </span>
            )}
            {task.dataVencimento && (
              <span className="flex items-center gap-1 shrink-0">
                <Calendar className="w-3 h-3" />
                {new Date(task.dataVencimento).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
          {task.descricao && (
            <p className="text-xs text-white/50 line-clamp-2 leading-relaxed mt-1">{task.descricao}</p>
          )}
        </div>
      </div>

      {/* Prioridade e tags */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {task.prioridade && (
          <span
            className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${priorityColors[task.prioridade]}`}
          >
            {task.prioridade}
          </span>
        )}
        {task.tags?.map((tag, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 rounded-lg text-xs bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Subtasks Progress */}
      {totalSubtasks > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-white/50 mb-1">
            <span>Subtarefas</span>
            <span className="font-medium text-white/70">
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#8B5CF6] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer - atraso, Mover e ações */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          {task.dataVencimento && isOverdue && (
            <div className="flex items-center gap-1 text-xs text-red-400">
              <Calendar className="w-3 h-3" />
              <span>Atrasado</span>
            </div>
          )}
          {onMoveToColumn && otherColumns.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowMoveMenu((v) => !v); }}
                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-[#8B5CF6] transition-opacity px-2 py-1 rounded-lg hover:bg-[#8B5CF6]/10"
                title="Mover card"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                Mover
              </button>
              {showMoveMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowMoveMenu(false); }} />
                  <div className="absolute left-0 bottom-full mb-1 z-50 min-w-[160px] bg-[#1a1b26] border border-[#1F1F2E] rounded-lg shadow-xl py-1 max-h-48 overflow-y-auto">
                    {otherColumns.map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveToColumn?.(col.id);
                          setShowMoveMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#8B5CF6]/20 flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col.cor || '#8B5CF6' }} />
                        {col.nome}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="opacity-0 group-hover:opacity-100 text-red-400/80 hover:text-red-400 transition-opacity p-1 rounded-lg hover:bg-red-500/10"
              title="Excluir"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
