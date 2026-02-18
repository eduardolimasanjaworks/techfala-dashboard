'use client';

import { useState, useEffect } from 'react';
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
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { FileText, User, GripVertical } from 'lucide-react';
import Link from 'next/link';
import type { Project } from '@/lib/mock-data';

interface ProjectStatus {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
}

interface ProjectsKanbanProps {
  projects: Project[];
  statuses: ProjectStatus[];
  onProjectsChange: (projects: Project[]) => void;
  onStatusesChange: () => void;
  filterQuery?: string;
  onManageStatuses: () => void;
}

function ProjectCard({ project, isDragging }: { project: Project; isDragging?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-white/15 bg-[#252630]/80 backdrop-blur p-4 transition-all ${
        isDragging ? 'opacity-70 shadow-2xl ring-2 ring-[#8B5CF6]' : 'hover:border-white/25'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center text-purple-400 shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#f4f4f5] truncate">{project.empresa}</p>
          <p className="text-sm text-[#a1a1aa] flex items-center gap-1 truncate">
            <User className="w-3.5 h-3.5 shrink-0" />
            {project.gerente}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-[#71717a]">Progresso</span>
            <span className="text-sm font-bold text-white">{project.progresso}%</span>
          </div>
          <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${project.progresso}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DraggableProjectCard({ project }: { project: Project }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: project.id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Link href={`/projects/${project.id}`} className="block" onClick={(e) => isDragging && e.preventDefault()}>
        <div className="flex items-start gap-2 group">
          <div
            {...attributes}
            {...listeners}
            className="p-1 rounded cursor-grab active:cursor-grabbing text-[#71717a] hover:text-white/70 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 touch-none"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <ProjectCard project={project} isDragging={isDragging} />
          </div>
        </div>
      </Link>
    </div>
  );
}

function KanbanColumn({
  status,
  projects,
  onManageStatuses,
  isOver,
  setNodeRef,
}: {
  status: ProjectStatus;
  projects: Project[];
  onManageStatuses: () => void;
  isOver: boolean;
  setNodeRef: (el: HTMLElement | null) => void;
}) {
  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 min-w-[288px] rounded-2xl border p-4 min-h-[400px] transition-colors ${
        isOver ? 'border-[#8B5CF6] bg-[#8B5CF6]/5' : 'border-white/10 bg-white/[0.02]'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: `${status.cor}25`,
            borderLeft: `4px solid ${status.cor}`,
            color: status.cor,
          }}
        >
          {status.nome}
        </div>
      </div>
      <div className="space-y-0">
        {projects.map((p) => (
          <DraggableProjectCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  );
}

export function ProjectsKanban({
  projects,
  statuses,
  onProjectsChange,
  onStatusesChange,
  filterQuery = '',
  onManageStatuses,
}: ProjectsKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const q = filterQuery.trim().toLowerCase();
  const filteredProjects = q
    ? projects.filter(
        (p) =>
          p.empresa?.toLowerCase().includes(q) || p.gerente?.toLowerCase().includes(q)
      )
    : projects;

  const projectsByStatus = (statusId: string) =>
    filteredProjects.filter((p) => p.projectStatusId === statusId);

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

    const projectId = active.id as string;
    const targetStatusId = over.id as string;
    const isNone = targetStatusId === '_none';
    const validTarget = isNone || statuses.some((s) => s.id === targetStatusId);
    if (!validTarget) return;

    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const newStatusId = isNone ? null : targetStatusId;

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectStatusId: newStatusId }),
      });
      if (res.ok) {
        onProjectsChange(
          projects.map((p) =>
            p.id === projectId ? { ...p, projectStatusId: newStatusId ?? undefined } : p
          )
        );
      }
    } catch {
      // rollback via refetch
      onStatusesChange();
    }
  };

  const activeProject = activeId ? projects.find((p) => p.id === activeId) : null;

  if (statuses.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
        <p className="text-[#a1a1aa] mb-4">Nenhum status de projeto definido. Crie etiquetas para organizar os projetos em colunas.</p>
        <button
          onClick={onManageStatuses}
          className="px-4 py-2 rounded-xl bg-[#8B5CF6] text-white font-medium hover:bg-[#7C3AED]"
        >
          Gerenciar status
        </button>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((status) => (
          <DroppableColumn
            key={status.id}
            id={status.id}
            status={status}
            projects={projectsByStatus(status.id)}
            onManageStatuses={onManageStatuses}
          />
        ))}
        {/* Coluna "Sem status" para projetos não categorizados */}
        <DroppableColumn
          key="_none"
          id="_none"
          status={{ id: '_none', nome: 'Sem status', cor: '#71717a', ordem: 999 }}
          projects={filteredProjects.filter((p) => !p.projectStatusId)}
          onManageStatuses={onManageStatuses}
        />
      </div>

      <DragOverlay>
        {activeProject ? (
          <div className="w-72">
            <ProjectCard project={activeProject} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function DroppableColumn({
  id,
  status,
  projects,
  onManageStatuses,
}: {
  id: string;
  status: ProjectStatus;
  projects: Project[];
  onManageStatuses: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <KanbanColumn
      status={status}
      projects={projects}
      onManageStatuses={onManageStatuses}
      isOver={isOver}
      setNodeRef={setNodeRef}
    />
  );
}
