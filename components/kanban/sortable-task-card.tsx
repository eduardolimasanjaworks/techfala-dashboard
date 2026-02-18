'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './task-card';
import type { Task, Coluna } from '@/lib/mock-data';

interface SortableTaskCardProps {
  task: Task;
  equipe: { nome: string; cargo: string; avatar?: string }[];
  allColumns?: Coluna[];
  currentColumnId?: string;
  onDelete: () => void;
  onClick: () => void;
  onMoveToColumn?: (targetColumnId: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (taskId: string) => void;
}

export function SortableTaskCard({
  task,
  equipe,
  allColumns = [],
  currentColumnId,
  onDelete,
  onClick,
  onMoveToColumn,
  isSelected,
  onToggleSelect,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group">
      <TaskCard
        task={task}
        equipe={equipe}
        allColumns={allColumns}
        currentColumnId={currentColumnId}
        isDragging={isDragging}
        onDelete={onDelete}
        onClick={onClick}
        onMoveToColumn={onMoveToColumn}
        isSelected={isSelected}
        onToggleSelect={onToggleSelect}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
