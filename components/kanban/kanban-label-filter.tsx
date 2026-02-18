'use client';

import { Tag } from 'lucide-react';
import { LabelsPopover } from './labels-popover';
import type { Label } from '@/lib/mock-data';

interface KanbanLabelFilterProps {
  labels: Label[];
  selectedLabelIds: string[];
  onToggleLabel: (id: string) => void;
  projectId?: string;
  onLabelCreated?: (label: Label) => void;
  onLabelDeleted?: (labelId: string) => void;
}

export function KanbanLabelFilter({
  labels,
  selectedLabelIds,
  onToggleLabel,
  projectId,
  onLabelCreated,
  onLabelDeleted,
}: KanbanLabelFilterProps) {
  return (
    <LabelsPopover
      labels={labels}
      selectedLabelIds={selectedLabelIds}
      onToggleLabel={onToggleLabel}
      projectId={projectId}
      onLabelCreated={onLabelCreated}
      onLabelDeleted={onLabelDeleted}
      title="Etiquetas"
      mode="filter"
      placement="right"
      trigger={
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white border border-white/10 hover:border-[#8B5CF6]/50 hover:bg-white/5 transition-colors"
        >
          <Tag className="w-4 h-4" />
          Filtrar por etiquetas
          {selectedLabelIds.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-[#8B5CF6]/30 text-[#8B5CF6]">
              {selectedLabelIds.length}
            </span>
          )}
        </button>
      }
    />
  );
}
