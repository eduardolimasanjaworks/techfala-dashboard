'use client';

import { RefreshCw, Settings, Filter, Plus, BarChart3 } from 'lucide-react';
import { KpiCard } from '@/components/kpi-card';
import { ProjectRow } from '@/components/project-row';
import { mockProjects, mockStats } from '@/lib/mock-data';
import { BottomGlow } from '@/components/bottom-glow';
import { NewProjectModal, type NewProjectData } from '@/components/new-project-modal';
import { useState } from 'react';
import type { Project } from '@/lib/mock-data';
import Link from 'next/link';
import { GlassButton } from '@/components/ui/glass-button';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddProject = (newProjectData: NewProjectData) => {
    const newProject: Project = {
      id: `${projects.length + 1}`,
      empresa: newProjectData.empresa,
      gerente: newProjectData.gerente,
      diasAtraso: 0,
      statusBadge: 'No Prazo',
      indiceVelocidade: 5,
      statusVelocidade: 'No Prazo',
      progresso: 0,
      proximaConclusao: '0.00',
      tarefasAtivas: 0,
      statusGeral: 'Excelente',
      dataInicio: new Date().toLocaleDateString('pt-BR'),
      metricas: {
        tarefasAtivas: 0,
        concluidas: 0,
        atrasadas: 0,
      },
      velocidadeData: [5, 5, 5, 5, 5, 5, 5],
      burndownData: [50, 50, 50, 50, 50, 50, 50], // New project starting with 50 tasks
      totalWork: 50,
    };

    setProjects([...projects, newProject]);
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#151520] to-[#0A0A0F] relative">
      <BottomGlow />
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddProject}
      />

      <div className="relative z-10 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div>
              <h1 className="text-6xl md:text-8xl font-thin tracking-tighter text-white leading-none mb-4">
                Dashboard
              </h1>
              <p className="text-lg text-white/40 font-light max-w-xl pl-2 border-l border-purple-500/50">
                Visão geral da performance e entregas da equipe.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <GlassButton
                href="/dashboard"
                icon={<BarChart3 className="w-4 h-4" />}
                className="text-white hover:text-white"
              >
                Dashboard Geral
              </GlassButton>
              <GlassButton
                onClick={() => setIsModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
                variant="primary"
                className="text-white hover:text-white"
              >
                Novo Projeto
              </GlassButton>
              <button className="flex items-center gap-2 px-4 py-2 border border-[#1F1F2E] rounded-lg text-sm font-medium text-[#9CA3AF] hover:bg-[#151520] transition-colors">
                <Settings className="w-4 h-4" />
                Configurar Integração
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#8B5CF6] text-white rounded-lg text-sm font-medium hover:bg-[#7C3AED] transition-colors shadow-lg shadow-[#8B5CF6]/20">
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard title="Total de Clientes" value={projects.length} />
            <KpiCard
              title="No Prazo/Adiantados"
              value={projects.filter(p => p.statusVelocidade === 'No Prazo').length}
              variant="success"
            />
            <KpiCard
              title="Atrasados"
              value={projects.filter(p => p.statusVelocidade === 'Atrasado').length}
              variant="danger"
            />
            <KpiCard
              title="Progresso Médio"
              value={`${Math.round(projects.reduce((acc, p) => acc + p.progresso, 0) / projects.length)}%`}
            />
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-10">
            <div className="flex-1 w-full bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 p-1 focus-within:bg-white/10 focus-within:border-white/20 transition-all">
              <input
                type="text"
                placeholder="Filtrar projetos..."
                className="w-full px-6 py-3 bg-transparent text-white placeholder-white/30 focus:outline-none text-lg font-light"
              />
            </div>
            <GlassButton
              className="w-full md:w-auto text-white/60 hover:text-white"
            >
              <Filter className="w-4 h-4" />
              Ver Filtros Avançados
            </GlassButton>
          </div>

          {/* Table Header - Minimalist Glass */}
          <div className="grid grid-cols-12 gap-6 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <div className="col-span-3">
              <p className="text-[10px] font-medium text-white/30 uppercase tracking-[0.2em]">
                Projeto / Empresa
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-medium text-white/30 uppercase tracking-[0.2em]">
                Velocidade
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-medium text-white/30 uppercase tracking-[0.2em]">
                Progresso
              </p>
            </div>
            <div className="col-span-2 text-center">
              <p className="text-[10px] font-medium text-white/30 uppercase tracking-[0.2em]">
                Tarefas
              </p>
            </div>
            <div className="col-span-3">
              <p className="text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right">
                Status Geral
              </p>
            </div>
          </div>

          {/* Project List */}
          <div className="bg-transparent rounded-b-lg p-4">
            {projects.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
