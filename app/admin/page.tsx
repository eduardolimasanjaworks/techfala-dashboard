'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Plus,
  Pencil,
  Shield,
  UserX,
  UserCheck,
  History,
  Mail,
  Lock,
  User as UserIcon,
} from 'lucide-react';
import { BottomGlow } from '@/components/bottom-glow';
import { Checkbox } from '@/components/ui/checkbox';

type UserRow = {
  id: string;
  email: string;
  nome: string;
  cargo: string;
  ativo: boolean;
  createdAt: string;
  criadoPor: { id: string; nome: string; email: string } | null;
};

type AuditEntry = {
  id: string;
  userId: string;
  userNome: string;
  acao: string;
  alvoTipo: string;
  alvoId: string | null;
  detalhes: string | null;
  createdAt: string;
};

const CARGO_LABEL: Record<string, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  usuario: 'Usuário',
};

const AUDIT_ACAO_LABEL: Record<string, string> = {
  criar_usuario: 'Criar usuário',
  editar_usuario: 'Editar usuário',
  desativar_usuario: 'Desativar usuário',
  reativar_usuario: 'Reativar usuário',
};

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'users' | 'audit'>('users');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    cargo: 'usuario' as 'admin' | 'gerente' | 'usuario',
    ativo: true,
  });

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session', { credentials: 'include' });
      if (sessionRes.status === 401) {
        router.push('/login');
        return;
      }
      if (!sessionRes.ok) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const { user } = await sessionRes.json();
      if (user.cargo !== 'admin') {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setIsAdmin(true);
      await Promise.all([fetchUsers(), fetchAudit()]);
    } catch {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users', { credentials: 'include' });
    if (res.status === 403) {
      setIsAdmin(false);
      return;
    }
    if (res.ok) setUsers(await res.json());
  };

  const fetchAudit = async () => {
    const res = await fetch('/api/admin/audit?limit=50', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setAuditLogs(data.logs);
    }
  };

  const openCreate = () => {
    setForm({ nome: '', email: '', senha: '', cargo: 'usuario', ativo: true });
    setError('');
    setModal('create');
  };

  const openEdit = (u: UserRow) => {
    setEditingUser(u);
    setForm({
      nome: u.nome,
      email: u.email,
      senha: '',
      cargo: u.cargo as 'admin' | 'gerente' | 'usuario',
      ativo: u.ativo,
    });
    setError('');
    setModal('edit');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        cargo: form.cargo,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Erro ao criar usuário');
      return;
    }
    setModal(null);
    await fetchUsers();
    await fetchAudit();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setError('');
    const body: { nome: string; email: string; cargo: string; ativo: boolean; senha?: string } = {
      nome: form.nome,
      email: form.email,
      cargo: form.cargo,
      ativo: form.ativo,
    };
    if (form.senha) body.senha = form.senha;
    const res = await fetch(`/api/admin/users/${editingUser.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Erro ao atualizar');
      return;
    }
    setModal(null);
    setEditingUser(null);
    await fetchUsers();
    await fetchAudit();
  };

  const toggleAtivo = async (u: UserRow) => {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !u.ativo }),
    });
    if (res.ok) {
      await fetchUsers();
      await fetchAudit();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#151520] to-[#0A0A0F] flex items-center justify-center">
        <div className="text-white/40">Carregando...</div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#151520] to-[#0A0A0F] flex items-center justify-center p-6">
        <div className="bg-[#0A0A0F]/80 border border-white/10 rounded-2xl p-8 max-w-md text-center">
          <Shield className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Acesso restrito</h1>
          <p className="text-white/60 mb-6">Apenas administradores podem acessar esta página.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#8B5CF6] hover:text-[#A78BFA]"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#151520] to-[#0A0A0F] relative">
      <BottomGlow />
      <div className="relative z-10 min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar aos projetos
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Painel administrativo</h1>
              <p className="text-white/50 mt-1">Usuários e auditoria</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab('users')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === 'users'
                    ? 'bg-[#8B5CF6] text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <Users className="w-4 h-4" /> Usuários
              </button>
              <button
                type="button"
                onClick={() => setTab('audit')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === 'audit'
                    ? 'bg-[#8B5CF6] text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <History className="w-4 h-4" /> Auditoria
              </button>
            </div>
          </div>

          {tab === 'users' && (
            <>
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={openCreate}
                  className="flex items-center gap-2 px-4 py-2 bg-[#8B5CF6] text-white rounded-lg text-sm font-medium hover:bg-[#7C3AED]"
                >
                  <Plus className="w-4 h-4" /> Novo usuário
                </button>
              </div>
              <div className="bg-[#0A0A0F]/60 border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50 uppercase">Nome</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50 uppercase">E-mail</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50 uppercase">Cargo</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50 uppercase">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50 uppercase">Criado por</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-white/50 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="py-3 px-4 text-white font-medium">{u.nome}</td>
                          <td className="py-3 px-4 text-white/80">{u.email}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#8B5CF6]/20 text-[#A78BFA]">
                              {CARGO_LABEL[u.cargo] ?? u.cargo}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {u.ativo ? (
                              <span className="text-emerald-400 text-sm">Ativo</span>
                            ) : (
                              <span className="text-white/40 text-sm">Inativo</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-white/60 text-sm">
                            {u.criadoPor ? `${u.criadoPor.nome} (${u.criadoPor.email})` : '—'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEdit(u)}
                                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleAtivo(u)}
                                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
                                title={u.ativo ? 'Desativar' : 'Reativar'}
                              >
                                {u.ativo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {users.length === 0 && (
                  <div className="py-12 text-center text-white/40">Nenhum usuário cadastrado.</div>
                )}
              </div>
            </>
          )}

          {tab === 'audit' && (
            <div className="bg-[#0A0A0F]/60 border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-xs font-medium text-white/50 uppercase">Data</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-white/50 uppercase">Quem</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-white/50 uppercase">Ação</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-white/50 uppercase">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-b border-white/5">
                        <td className="py-3 px-4 text-white/70 text-sm">
                          {new Date(log.createdAt).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-white/80">{log.userNome}</td>
                        <td className="py-3 px-4">
                          <span className="text-[#A78BFA] text-sm">
                            {AUDIT_ACAO_LABEL[log.acao] ?? log.acao.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white/50 text-sm max-w-sm">
                          {log.detalhes ? (() => {
                            try {
                              const d = JSON.parse(log.detalhes) as Record<string, unknown>;
                              if (log.acao === 'alterar_senha' && d.emailAlvo && d.alteradoPor) {
                                return `Usuário ${String(d.emailAlvo)} — alterado por ${String(d.alteradoPor)}`;
                              }
                              if (log.acao === 'usuario_alterou_propria_senha' && d.email) {
                                return `Conta ${String(d.email)}`;
                              }
                              return log.detalhes;
                            } catch {
                              return log.detalhes;
                            }
                          })() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {auditLogs.length === 0 && (
                <div className="py-12 text-center text-white/40">Nenhum registro de auditoria.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Criar / Editar */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#151520] border border-white/10 rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">
                {modal === 'create' ? 'Novo usuário' : 'Editar usuário'}
              </h2>
            </div>
            <form onSubmit={modal === 'create' ? handleCreate : handleEdit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm text-white/60 mb-1">Nome</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className="w-full px-4 py-2 bg-[#0A0A0F] border border-white/10 rounded-lg text-white placeholder-white/30"
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2 bg-[#0A0A0F] border border-white/10 rounded-lg text-white placeholder-white/30"
                  placeholder="email@exemplo.com"
                  required
                  readOnly={modal === 'edit'}
                />
                {modal === 'edit' && (
                  <p className="text-xs text-white/40 mt-1">E-mail não pode ser alterado.</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">
                  Senha {modal === 'edit' && '(deixe em branco para não alterar)'}
                </label>
                <input
                  type="password"
                  value={form.senha}
                  onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                  className="w-full px-4 py-2 bg-[#0A0A0F] border border-white/10 rounded-lg text-white placeholder-white/30"
                  placeholder={modal === 'create' ? 'Senha' : '••••••••'}
                  required={modal === 'create'}
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Cargo</label>
                <select
                  value={form.cargo}
                  onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value as 'admin' | 'gerente' | 'usuario' }))}
                  className="w-full px-4 py-2 bg-[#0A0A0F] border border-white/10 rounded-lg text-white"
                >
                  <option value="usuario">Usuário</option>
                  <option value="gerente">Gerente</option>
                  <option value="admin">Administrador</option>
                </select>
                <p className="text-xs text-white/40 mt-1">Administradores podem criar e gerenciar usuários.</p>
              </div>
              {modal === 'edit' && (
                <Checkbox
                  id="ativo"
                  checked={form.ativo}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))}
                  label="Usuário ativo"
                />
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setModal(null); setEditingUser(null); }}
                  className="flex-1 py-2 border border-white/20 text-white/80 rounded-lg hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#8B5CF6] text-white rounded-lg font-medium hover:bg-[#7C3AED]"
                >
                  {modal === 'create' ? 'Criar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
