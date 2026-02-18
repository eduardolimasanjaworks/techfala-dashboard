'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Columns, Copy } from 'lucide-react';
import { KanbanBoard } from './kanban/kanban-board';
import type { Pipeline, Label } from '@/lib/mock-data';
import { clientError } from '@/lib/client-logger';

interface Epic { id: string; nome: string; items?: unknown[] }

interface PipelineManagerProps {
  pipelines: Pipeline[];
  onPipelinesChange: (pipelines: Pipeline[]) => void;
  equipe?: { nome: string; cargo: string; avatar?: string }[];
  epics?: Epic[];
  labels?: Label[];
  projectId?: string;
  onLabelCreated?: (label: Label) => void;
  onLabelDeleted?: (labelId: string) => void;
}

export function PipelineManager({
  pipelines: initialPipelines,
  onPipelinesChange,
  equipe = [],
  epics = [],
  labels = [],
  projectId,
  onLabelCreated,
  onLabelDeleted,
}: PipelineManagerProps) {
  const [pipelines, setPipelines] = useState(initialPipelines);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(
    initialPipelines.length > 0 ? initialPipelines[0].id : null
  );

  // Sincroniza com o pai quando os pipelines mudam (ex: refetch do projeto)
  useEffect(() => {
    setPipelines(initialPipelines);
  }, [initialPipelines]);
  const [isCreatingPipeline, setIsCreatingPipeline] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');

  const updatePipeline = (updatedPipeline: Pipeline) => {
    const updatedPipelines = pipelines.map(p =>
      p.id === updatedPipeline.id ? updatedPipeline : p
    );
    setPipelines(updatedPipelines);
    onPipelinesChange(updatedPipelines);
  };

  const createPipeline = async () => {
    if (!newPipelineName.trim()) return;

    try {
      // Obter projectId do contexto ou props
      const projectId = window.location.pathname.split('/')[2];
      
      const response = await fetch(`/api/projects/${projectId}/pipelines`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newPipelineName }),
      });

      if (response.ok) {
        const newPipeline = await response.json();
        const updatedPipelines = [...pipelines, newPipeline];
        setPipelines(updatedPipelines);
        setSelectedPipelineId(newPipeline.id);
        setIsCreatingPipeline(false);
        setNewPipelineName('');
        onPipelinesChange(updatedPipelines);
      }
    } catch {
      clientError('create_pipeline');
    }
  };

  const clonePipeline = async (pipelineId: string) => {
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    if (!pipeline || !projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/pipelines/${pipelineId}/clone`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: `${pipeline.nome} (cópia)` }),
      });
      if (res.ok) {
        const cloned = await res.json();
        const updatedPipelines = [...pipelines, cloned];
        setPipelines(updatedPipelines);
        setSelectedPipelineId(cloned.id);
        onPipelinesChange(updatedPipelines);
      } else {
        const err = await res.json().catch(() => ({}));
        clientError('clone_pipeline', undefined, { status: res.status, ...err });
        alert('Não foi possível clonar o pipeline. Tente novamente.');
      }
    } catch (e) {
      clientError('clone_pipeline', e);
      alert('Erro ao clonar pipeline.');
    }
  };

  const deletePipeline = async (pipelineId: string) => {
    const pipeline = pipelines.find(p => p.id === pipelineId);
    if (!pipeline) return;
    if (!window.confirm(`Excluir o pipeline "${pipeline.nome}"? Ele irá para a lixeira e poderá ser restaurado depois.`)) {
      return;
    }
    try {
      const response = await fetch(`/api/pipelines/${pipelineId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        const updatedPipelines = pipelines.filter(p => p.id !== pipelineId);
        setPipelines(updatedPipelines);
        onPipelinesChange(updatedPipelines);

        if (selectedPipelineId === pipelineId) {
          setSelectedPipelineId(updatedPipelines.length > 0 ? updatedPipelines[0].id : null);
        }
      } else {
        const err = await response.json().catch(() => ({}));
        clientError('delete_pipeline', undefined, { status: response.status, ...err });
        alert('Não foi possível excluir o pipeline. Tente novamente.');
      }
    } catch (e) {
      clientError('delete_pipeline', e);
    }
  };

  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);

  return (
    <div className="space-y-6">
      {/* Pipeline Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {pipelines.map((pipeline) => (
          <div
            key={pipeline.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedPipelineId(pipeline.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedPipelineId(pipeline.id);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              selectedPipelineId === pipeline.id
                ? 'bg-[#8B5CF6] text-white'
                : 'bg-[#0A0A0F] text-[#9CA3AF] hover:bg-[#151520] hover:text-white border border-[#1F1F2E]'
            }`}
          >
            <Columns className="w-4 h-4 shrink-0" />
            <span className="font-medium">{pipeline.nome}</span>
            <div className="ml-2 flex items-center gap-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  clonePipeline(pipeline.id);
                }}
                className="p-0.5 rounded text-current opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/30"
                aria-label={`Clonar pipeline ${pipeline.nome}`}
                title="Clonar pipeline"
              >
                <Copy className="w-3 h-3" />
              </button>
              {pipelines.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    deletePipeline(pipeline.id);
                  }}
                  className="p-0.5 rounded text-current opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/30"
                  aria-label={`Excluir pipeline ${pipeline.nome}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}

        {isCreatingPipeline ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#0A0A0F] border border-[#8B5CF6] rounded-lg">
            <input
              type="text"
              value={newPipelineName}
              onChange={(e) => setNewPipelineName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createPipeline()}
              placeholder="Nome do pipeline..."
              className="bg-transparent text-white border-none outline-none placeholder-[#9CA3AF] w-40"
              autoFocus
            />
            <button
              onClick={createPipeline}
              className="text-[#00D084] hover:text-[#00965F]"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsCreatingPipeline(false);
                setNewPipelineName('');
              }}
              className="text-[#9CA3AF] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreatingPipeline(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0A0A0F] text-[#9CA3AF] hover:bg-[#151520] hover:text-white border border-[#1F1F2E] rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Pipeline</span>
          </button>
        )}
      </div>

      {/* Selected Pipeline Board */}
      {selectedPipeline ? (
        <KanbanBoard
          pipeline={selectedPipeline}
          onPipelineChange={updatePipeline}
          equipe={equipe}
          epics={epics}
          labels={labels}
          projectId={projectId}
          onLabelCreated={onLabelCreated}
          onLabelDeleted={onLabelDeleted}
        />
      ) : (
        <div className="text-center py-12 bg-[#0A0A0F] border border-[#1F1F2E] rounded-lg">
          <Columns className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
          <p className="text-[#9CA3AF] mb-4">Nenhum pipeline criado ainda</p>
          <button
            onClick={() => setIsCreatingPipeline(true)}
            className="px-4 py-2 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#7C3AED] transition-colors"
          >
            Criar Primeiro Pipeline
          </button>
        </div>
      )}
    </div>
  );
}
