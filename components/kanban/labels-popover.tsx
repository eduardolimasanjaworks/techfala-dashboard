'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Tag, Plus, X, Pencil, Check } from 'lucide-react';
import type { Label } from '@/lib/mock-data';

const POPOVER_Z = 9999;

const CORES_PADRAO = ['#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#6B7280', '#14B8A6'];

interface LabelsPopoverProps {
  labels: Label[];
  selectedLabelIds: string[];
  onToggleLabel: (id: string) => void;
  projectId?: string;
  onLabelCreated?: (label: Label) => void;
  onLabelDeleted?: (labelId: string) => void;
  onLabelUpdated?: (label: Label) => void;
  title?: string;
  /** Se true, é modo filtro (no board). Se false, modo seleção (no modal do card). */
  mode?: 'filter' | 'select';
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Posição do popover em relação ao trigger */
  placement?: 'left' | 'right';
}

export function LabelsPopover({
  labels,
  selectedLabelIds,
  onToggleLabel,
  projectId,
  onLabelCreated,
  onLabelDeleted,
  onLabelUpdated,
  title = 'Etiquetas',
  mode = 'filter',
  trigger,
  open: controlledOpen,
  onOpenChange,
  placement = 'right',
}: LabelsPopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(CORES_PADRAO[0]);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isOpen = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const filteredLabels = search.trim()
    ? labels.filter((l) => l.nome.toLowerCase().includes(search.toLowerCase()))
    : labels;

  useEffect(() => {
    if (showCreate) inputRef.current?.focus();
  }, [showCreate]);

  const handleCreate = async () => {
    const name = newName.trim() || 'Nova etiqueta';
    if (!projectId || !onLabelCreated) return;
    const color = /^#[0-9A-Fa-f]{6}$/.test(newColor) ? newColor : CORES_PADRAO[0];
    setCreating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/labels`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: name, cor: color }),
      });
      if (res.ok) {
        const label = await res.json();
        onLabelCreated(label);
        setNewName('');
        setNewColor(CORES_PADRAO[0]);
        setShowCreate(false);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (labelId: string) => {
    const name = editName.trim();
    const color = /^#[0-9A-Fa-f]{6}$/.test(editColor) ? editColor : undefined;
    if (!name && !color) {
      setEditingId(null);
      return;
    }
    try {
      const res = await fetch(`/api/labels/${labelId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: name || undefined, cor: color }),
      });
      if (res.ok && onLabelUpdated) {
        const label = await res.json();
        onLabelUpdated(label);
      }
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, labelId: string) => {
    e.stopPropagation();
    try {
      await fetch(`/api/labels/${labelId}`, { method: 'DELETE', credentials: 'include' });
      onLabelDeleted?.(labelId);
    } catch {}
  };

  const startEdit = (l: Label) => {
    setEditingId(l.id);
    setEditName(l.nome);
    setEditColor(l.cor);
  };

  const [popoverStyle, setPopoverStyle] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!isOpen || !popoverRef.current) return;
    const updatePosition = () => {
      const rect = popoverRef.current?.getBoundingClientRect();
      if (!rect) return;
      const top = rect.bottom + 8;
      const left = placement === 'left' ? rect.left : rect.right - 288; // 288 = w-72
      setPopoverStyle({ top, left });
    };
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, placement]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!isOpen);
  };

  const popoverContent = isOpen && typeof document !== 'undefined' && createPortal(
    <>
      <div
        className="fixed inset-0"
        style={{ zIndex: POPOVER_Z }}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div
        className="fixed w-72 rounded-xl bg-[#151520] border border-white/15 shadow-2xl shadow-black/50 overflow-hidden"
        style={{
          zIndex: POPOVER_Z + 1,
          top: popoverStyle?.top ?? 0,
          left: popoverStyle?.left ?? 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
            <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h2 className="text-sm font-semibold text-white">{title}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </header>
            <div className="p-3 space-y-3">
              <div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar etiquetas..."
                  aria-describedby="labels-search-hint"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50"
                />
                <p id="labels-search-hint" className="mt-1 text-xs text-white/40">
                  A digitação atualiza automaticamente os resultados da pesquisa abaixo
                </p>
              </div>
              <fieldset>
                <legend className="sr-only">Lista de etiquetas</legend>
                <ul className="max-h-48 overflow-y-auto space-y-0.5">
                  {filteredLabels.map((l) => (
                    <li key={l.id}>
                      <label
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors ${
                          selectedLabelIds.includes(l.id) ? 'bg-white/5' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedLabelIds.includes(l.id)}
                          onChange={() => onToggleLabel(l.id)}
                          className="rounded border-white/30 text-[#8B5CF6] focus:ring-[#8B5CF6]/50"
                        />
                        {editingId === l.id ? (
                          <div className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdate(l.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              className="flex-1 min-w-0 px-2 py-1 rounded bg-white/10 text-white text-sm"
                              autoFocus
                            />
                            <input
                              type="color"
                              value={editColor}
                              onChange={(e) => setEditColor(e.target.value)}
                              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdate(l.id)}
                              className="p-1 text-green-400 hover:bg-green-500/20 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span
                              className="flex-1 min-w-0 truncate px-2 py-0.5 rounded text-xs font-medium"
                              style={{
                                backgroundColor: `${l.cor}25`,
                                borderLeft: `3px solid ${l.cor}`,
                                color: l.cor,
                              }}
                            >
                              {l.nome}
                            </span>
                            {onLabelUpdated && (
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); startEdit(l); }}
                                className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10 shrink-0"
                                aria-label={`Editar ${l.nome}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
              {showCreate ? (
                <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreate();
                      if (e.key === 'Escape') setShowCreate(false);
                    }}
                    placeholder="Nome da etiqueta"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/40"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border [&::-webkit-color-swatch]:border-white/20 [&::-webkit-color-swatch]:rounded"
                    />
                    <input
                      type="text"
                      value={newColor}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(v) || v === '') setNewColor(v || '#8B5CF6');
                      }}
                      placeholder="#RRGGBB"
                      className="flex-1 px-2 py-1 rounded bg-white/5 text-white text-xs"
                      maxLength={7}
                    />
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {CORES_PADRAO.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={`w-5 h-5 rounded-full border-2 ${newColor.toUpperCase() === c.toUpperCase() ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={creating}
                      className="flex-1 px-3 py-2 rounded-lg bg-[#8B5CF6] text-white text-sm font-medium hover:bg-[#7C3AED] disabled:opacity-50"
                    >
                      {creating ? '...' : 'Criar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="px-3 py-2 rounded-lg text-white/60 hover:text-white text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                projectId &&
                onLabelCreated && (
                  <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-[#8B5CF6] hover:bg-[#8B5CF6]/10 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Criar uma nova etiqueta
                  </button>
                )
              )}
            </div>
          </div>
    </>,
    document.body
  );

  return (
    <div className="relative" ref={popoverRef}>
      {trigger ? (
        <div
          role="button"
          tabIndex={0}
          onClick={handleTriggerClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen(!isOpen);
            }
          }}
          className="inline-block"
        >
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white border border-white/10 hover:border-[#8B5CF6]/50 hover:bg-white/5 transition-colors"
        >
          <Tag className="w-4 h-4" />
          {title}
        </button>
      )}
      {popoverContent}
    </div>
  );
}
