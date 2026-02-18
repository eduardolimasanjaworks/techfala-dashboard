'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

const BASE = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

function CurlBlock({ cmd, title }: { cmd: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-white mb-2">{title}</p>
      <div className="relative group">
        <pre className="bg-[#0d0d12] border border-white/20 rounded-lg p-4 text-sm text-[#d4d4d8] overflow-x-auto font-mono leading-relaxed">
          {cmd}
        </pre>
        <button
          onClick={copy}
          className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          title="Copiar"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#1a1b26] text-[#e4e4e7]" style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="text-sm text-[#A78BFA] hover:text-[#C4B5FD] mb-6 inline-block">
          ← Voltar ao Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">API — cURL</h1>
        <p className="text-[#a1a1aa] mb-10">
          Use os comandos abaixo. A autenticação é via cookie de sessão (faça login no navegador antes).
        </p>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4 border-b border-white/15 pb-2">Tarefas</h2>

          <CurlBlock
            title="Listar todas as tasks de um projeto"
            cmd={`curl -X GET '${BASE}/api/tasks?projectId=ID_DO_PROJETO' \\
  -H 'Cookie: session=SEU_TOKEN'`}
          />

          <CurlBlock
            title="Listar tasks de um projeto numa coluna específica"
            cmd={`curl -X GET '${BASE}/api/tasks?projectId=ID_DO_PROJETO&columnId=ID_DA_COLUNA' \\
  -H 'Cookie: session=SEU_TOKEN'`}
          />

          <CurlBlock
            title="Listar tasks de um pipeline"
            cmd={`curl -X GET '${BASE}/api/tasks?pipelineId=ID_DO_PIPELINE' \\
  -H 'Cookie: session=SEU_TOKEN'`}
          />

          <CurlBlock
            title="Listar todas as tasks (sistema inteiro)"
            cmd={`curl -X GET '${BASE}/api/tasks' \\
  -H 'Cookie: session=SEU_TOKEN'`}
          />

          <CurlBlock
            title="Criar task"
            cmd={`curl -X POST '${BASE}/api/tasks' \\
  -H 'Content-Type: application/json' \\
  -H 'Cookie: session=SEU_TOKEN' \\
  -d '{"columnId":"ID_DA_COLUNA","titulo":"Minha tarefa"}'`}
          />

          <CurlBlock
            title="Obter task por ID"
            cmd={`curl -X GET '${BASE}/api/tasks/ID_DA_TASK' \\
  -H 'Cookie: session=SEU_TOKEN'`}
          />

          <CurlBlock
            title="Atualizar task"
            cmd={`curl -X PUT '${BASE}/api/tasks/ID_DA_TASK' \\
  -H 'Content-Type: application/json' \\
  -H 'Cookie: session=SEU_TOKEN' \\
  -d '{"titulo":"Novo título","columnId":"ID_DA_COLUNA_DESTINO"}'`}
          />

          <CurlBlock
            title="Excluir task"
            cmd={`curl -X DELETE '${BASE}/api/tasks/ID_DA_TASK' \\
  -H 'Cookie: session=SEU_TOKEN'`}
          />
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4 border-b border-white/15 pb-2">Projetos</h2>

          <CurlBlock
            title="Listar projetos (leve, sem pipelines)"
            cmd={`curl -X GET '${BASE}/api/projects?include=minimal' \\
  -H 'Cookie: session=SEU_TOKEN'`}
          />

          <CurlBlock
            title="Listar projetos + pipelines + colunas (sem tasks)"
            cmd={`curl -X GET '${BASE}/api/projects?include=pipelines' \\
  -H 'Cookie: session=SEU_TOKEN'`}
          />

          <CurlBlock
            title="Listar projetos + pipelines + colunas + tasks (tudo)"
            cmd={`curl -X GET '${BASE}/api/projects?include=full' \\
  -H 'Cookie: session=SEU_TOKEN'`}
          />

          <CurlBlock
            title="Obter projeto por ID"
            cmd={`curl -X GET '${BASE}/api/projects/ID_DO_PROJETO' \\
  -H 'Cookie: session=SEU_TOKEN'`}
          />
        </section>

        <p className="text-sm text-[#71717a]">
          Dica: copie o cookie <code className="bg-white/10 px-1 rounded">session</code> nas DevTools (Application → Cookies) após fazer login.
        </p>
      </div>
    </div>
  );
}
