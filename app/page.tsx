'use client';

import { RefreshCw, Plus, LogOut, Shield, Lock, User, BookOpen, Tags, LayoutGrid, List } from 'lucide-react';
import { KpiCard } from '@/components/kpi-card';
import { ProjectsKanban } from '@/components/projects-kanban';
import { ProjectRow } from '@/components/project-row';
import { ProjectStatusCrudModal } from '@/components/project-status-crud-modal';
import { BottomGlow } from '@/components/bottom-glow';
import { NewProjectModal, type NewProjectData } from '@/components/new-project-modal';
import { useState, useEffect } from 'react';
import type { Project } from '@/lib/mock-data';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clientError } from '@/lib/client-logger';

const CARGO_LABEL: Record<string, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  usuario: 'Usuário',
};

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStatuses, setProjectStatuses] = useState<{ id: string; nome: string; cor: string; ordem: number }[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusCrudOpen, setIsStatusCrudOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<{ nome: string; email: string; cargo: string } | null>(null);
  const [passwordForm, setPasswordForm] = useState({ senhaAtual: '', senhaNova: '', senhaNovaConfirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
      }
      router.push('/login');
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchStatuses();
    fetchSession();
  }, []);

  const fetchStatuses = async () => {
    try {
      const res = await fetch('/api/project-statuses', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setProjectStatuses(data);
      }
    } catch {
      // ignore
    }
  };

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' });
      if (res.ok) {
        const { user } = await res.json();
        setUserInfo({ nome: user.nome, email: user.email, cargo: user.cargo });
      }
    } catch {
      // sessão inválida ou não autenticado
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch {
      clientError('fetch_projects');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async (newProjectData: NewProjectData) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresa: newProjectData.empresa,
          gerente: newProjectData.gerente,
          dataInicio: newProjectData.dataInicio,
          dataFim: newProjectData.dataFim || undefined,
          statusOnboarding: newProjectData.statusOnboarding || undefined,
          equipe: [],
        }),
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (response.ok) {
        const newProject = await response.json();
        setProjects([newProject, ...projects]);
        setIsModalOpen(false);
      }
    } catch {
      clientError('create_project');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);
    if (passwordForm.senhaNova !== passwordForm.senhaNovaConfirm) {
      setPasswordError('A confirmação da nova senha não confere.');
      return;
    }
    if (passwordForm.senhaNova.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senhaAtual: passwordForm.senhaAtual,
          senhaNova: passwordForm.senhaNova,
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        setPasswordError(data.error || 'Senha atual incorreta.');
        return;
      }
      if (!res.ok) {
        setPasswordError(data.error || 'Erro ao alterar senha.');
        return;
      }
      setPasswordSuccess(true);
      setPasswordForm({ senhaAtual: '', senhaNova: '', senhaNovaConfirm: '' });
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess(false);
      }, 1500);
    } catch {
      setPasswordError('Erro de conexão. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1b26] via-[#252630] to-[#1a1b26] relative">
      <BottomGlow />
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddProject}
      />
      <ProjectStatusCrudModal
        isOpen={isStatusCrudOpen}
        onClose={() => setIsStatusCrudOpen(false)}
        onSaved={fetchStatuses}
      />

      {/* Modal Alterar senha */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[#252630] border border-white/15 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-white/15">
              <h2 className="text-xl font-bold text-[#f4f4f5] flex items-center gap-2">
                <Lock className="w-5 h-5" /> Alterar senha
              </h2>
              <p className="text-base text-[#a1a1aa] mt-1">Informe a senha atual e a nova senha. Nenhum e-mail será enviado.</p>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {passwordError && (
                <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-base">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-base">
                  Senha alterada com sucesso.
                </div>
              )}
              <div>
                <label className="block text-base text-[#d4d4d8] mb-2 font-medium">Senha atual</label>
                <input
                  type="password"
                  value={passwordForm.senhaAtual}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, senhaAtual: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#1a1b26] border border-white/20 rounded-xl text-[#f4f4f5] placeholder-[#71717a] text-base"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="block text-base text-[#d4d4d8] mb-2 font-medium">Nova senha</label>
                <input
                  type="password"
                  value={passwordForm.senhaNova}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, senhaNova: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#1a1b26] border border-white/20 rounded-xl text-[#f4f4f5] placeholder-[#71717a] text-base"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Confirmar nova senha</label>
                <input
                  type="password"
                  value={passwordForm.senhaNovaConfirm}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, senhaNovaConfirm: e.target.value }))}
                  className="w-full px-4 py-2 bg-[#0A0A0F] border border-white/10 rounded-lg text-white placeholder-white/30"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setPasswordError('');
                    setPasswordForm({ senhaAtual: '', senhaNova: '', senhaNovaConfirm: '' });
                  }}
                  className="flex-1 py-3 border border-white/20 text-[#e4e4e7] rounded-xl font-medium hover:bg-white/10 text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#8B5CF6] text-white rounded-xl font-semibold hover:bg-[#7C3AED] text-base"
                >
                  Alterar senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="relative z-10 min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-semibold text-[#f4f4f5] tracking-tight">
                  Dashboard
                </h1>
                <p className="mt-2 text-base text-[#a1a1aa]">
                  Visão geral da performance e entregas da equipe.
                </p>
              </div>
              {userInfo && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 w-fit">
                  <User className="w-4 h-4 text-white/50 shrink-0" />
                  <span className="text-sm font-medium text-white">{userInfo.nome}</span>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-sm font-medium shrink-0 ${
                      userInfo.cargo === 'admin'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : userInfo.cargo === 'gerente'
                          ? 'bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/30'
                          : 'bg-white/10 text-white/70 border border-white/10'
                    }`}
                  >
                    {CARGO_LABEL[userInfo.cargo] ?? userInfo.cargo}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {userInfo?.cargo === 'admin' && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors"
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  Painel Admin
                </Link>
              )}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors"
              >
                <Plus className="w-4 h-4 shrink-0" />
                Novo Projeto
              </button>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium border border-white/15 text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                title="Documentação da API"
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                API Docs
              </Link>
              <button
                type="button"
                onClick={() => setIsStatusCrudOpen(true)}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium border border-white/15 text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                title="Criar, editar e excluir colunas do Kanban (etiquetas de projeto)"
              >
                <Tags className="w-4 h-4 shrink-0" />
                Etiquetas / Colunas
              </button>
              <button
                type="button"
                onClick={() => { fetchProjects(); fetchStatuses(); }}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium border border-white/15 text-white/80 hover:bg-white/5 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4 shrink-0" />
                Atualizar
              </button>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium border border-white/15 text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                title="Alterar senha"
              >
                <Lock className="w-4 h-4 shrink-0" />
                Alterar senha
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium border border-white/15 text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sair
              </button>
            </div>
          </header>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
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
              value={projects.length > 0 ? `${Math.round(projects.reduce((acc, p) => acc + p.progresso, 0) / projects.length)}%` : '0%'}
            />
          </div>

          {/* Search and Filter */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 p-1 focus-within:bg-white/15 focus-within:border-white/25 transition-all">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filtrar por empresa ou gerente..."
                className="w-full px-6 py-4 bg-transparent text-[#f4f4f5] placeholder-[#71717a] focus:outline-none text-lg"
              />
            </div>
            {/* Toggle Kanban / Lista */}
            <div className="flex rounded-xl border border-white/15 bg-white/[0.02] p-1">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-[#8B5CF6] text-white'
                    : 'text-[#a1a1aa] hover:text-white hover:bg-white/5'
                }`}
                title="Visualização em colunas (Kanban)"
              >
                <LayoutGrid className="w-4 h-4 shrink-0" />
                Kanban
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#8B5CF6] text-white'
                    : 'text-[#a1a1aa] hover:text-white hover:bg-white/5'
                }`}
                title="Visualização em lista"
              >
                <List className="w-4 h-4 shrink-0" />
                Lista
              </button>
            </div>
          </div>

          {/* Projetos: Kanban ou Lista */}
          <div className="rounded-2xl">
            {loading ? (
              <div className="text-center py-16 text-lg text-[#a1a1aa]">Carregando projetos...</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-16 text-lg text-[#a1a1aa]">
                Nenhum projeto encontrado. Crie seu primeiro projeto!
              </div>
            ) : viewMode === 'kanban' ? (
              <ProjectsKanban
                projects={projects}
                statuses={projectStatuses}
                onProjectsChange={setProjects}
                onStatusesChange={() => { fetchProjects(); fetchStatuses(); }}
                filterQuery={filterQuery}
                onManageStatuses={() => setIsStatusCrudOpen(true)}
              />
            ) : (
              (() => {
                const q = filterQuery.trim().toLowerCase();
                const filtered = q
                  ? projects.filter(
                      (p) =>
                        p.empresa?.toLowerCase().includes(q) || p.gerente?.toLowerCase().includes(q)
                    )
                  : projects;
                return (
                  <div className="bg-transparent">
                    {filtered.map((project) => (
                      <ProjectRow key={project.id} project={project} />
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
