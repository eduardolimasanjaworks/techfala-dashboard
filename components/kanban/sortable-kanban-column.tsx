'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Coluna } from '@/lib/mock-data';
import { KanbanColumn } from './kanban-column';

interface SortableKanbanColumnProps {
  coluna: Coluna;
  equipe: { nome: string; cargo: string; avatar?: string }[];
  allColumns: Coluna[];
  onAddTask: () => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask?: (taskId: string, updates: any) => void;
  onTaskClick: (task: any) => void;
  onRenameColumn?: (columnId: string, nome: string) => void;
  onUpdateColumn?: (columnId: string, updates: { cor?: string; corFonte?: string; responsavelNome?: string | null }) => void;
  onDeleteColumn?: () => void;
  onMoveTasks?: (taskIds: string[], targetColumnId: string) => void;
  selectedTaskIds?: string[];
  onToggleTaskSelect?: (taskId: string) => void;
  isAddingTask: boolean;
  newTaskTitle: string;
  onNewTaskTitleChange: (title: string) => void;
  onConfirmAddTask: () => void;
  onCancelAddTask: () => void;
}

export function SortableKanbanColumn(props: SortableKanbanColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.coluna.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="min-h-0">
      <KanbanColumn {...props} currentColumnId={props.coluna.id} columnDragHandleProps={{ attributes, listeners }} />
    </div>
  );
}
