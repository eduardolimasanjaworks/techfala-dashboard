// Mock data structure based on the reference image
export interface ProjectStatus {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
}

export interface Project {
  id: string;
  empresa: string;
  gerente: string;
  projectStatusId?: string;
  projectStatus?: ProjectStatus;
  diasAtraso: number;
  statusBadge: 'Em Atraso' | 'No Prazo' | 'Em Andamento';
  indiceVelocidade?: number | null;
  velocidadeData: number[];
  // Burndown chart data: work remaining over time (should decrease)
  burndownData: number[];
  totalWork: number; // Total work at project start
  statusVelocidade: 'No Prazo' | 'Atrasado' | null;
  progresso: number;
  proximaConclusao: string;
  tarefasAtivas: number;
  statusGeral: 'Excelente' | 'Atenção' | 'Crítico' | null;
  statusProjeto?: 'Atrasado' | 'No Prazo' | 'Para Começar' | 'Stand By' | 'Aguardando Confirmação';
  statusOnboarding?: 'Esperando Contrato' | 'Esperando Pagamento' | 'Iniciar Onboarding';
  dataInicio: string;
  dataFim?: string;
  metricas: {
    tarefasAtivas: number;
    concluidas: number;
    atrasadas: number;
  };
  // Detailed client information
  email?: string;
  telefone?: string;
  endereco?: string;
  descricao?: string;
  orcamento?: number;
  equipe?: {
    nome: string;
    cargo: string;
    avatar?: string;
  }[];
  timeline?: {
    data: string;
    evento: string;
    tipo: 'inicio' | 'milestone' | 'atraso' | 'conclusao';
  }[];
  checklists?: {
    id: string;
    nome: string;
    items: {
      id: string;
      titulo: string;
      concluido: boolean;
    }[];
  }[];
  comentarios?: {
    id: string;
    autor: string;
    data: string;
    texto: string;
  }[];
  logo?: string;
  // Kanban/Pipelines
  pipelines?: Pipeline[];
}

// Estrutura de Kanban/Pipeline
export interface Pipeline {
  id: string;
  nome: string;
  colunas: Coluna[];
}

export interface Coluna {
  id: string;
  nome: string;
  ordem: number;
  cor?: string;
  corFonte?: string;
  responsavelNome?: string;
  tasks: Task[];
}

export interface TaskComment {
  id: string;
  autor: string;
  texto: string;
  data: string;
  createdAt?: string;
}

export interface SubtaskComment {
  id: string;
  autor: string;
  texto: string;
  data: string;
  createdAt?: string;
}

export interface SubtaskList {
  id: string;
  nome: string;
  ordem: number;
  subtasks?: { id: string }[];
}

export interface SubtaskNested {
  id: string;
  titulo: string;
  concluida: boolean;
  dataInicio?: string;
  dataVencimento?: string;
  ordem?: number;
  responsavel?: { nome: string; avatar?: string };
  /** Comentários da sub-subtarefa (estado local / API quando existir) */
  nestedComments?: SubtaskComment[];
}

export interface Label {
  id: string;
  nome: string;
  cor: string;
  ordem?: number;
}

export interface Task {
  id: string;
  epicId?: string;
  titulo: string;
  descricao?: string;
  dataVencimento?: string;
  dataCriacao: string;
  responsavel?: {
    nome: string;
    avatar?: string;
  };
  subtasks?: Subtask[];
  taskComments?: TaskComment[];
  subtaskLists?: SubtaskList[];
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
  tags?: string[];
  labels?: Label[];
}

export interface Subtask {
  id: string;
  titulo: string;
  concluida: boolean;
  dataInicio?: string;
  dataVencimento?: string;
  ordem?: number;
  subtaskListId?: string;
  responsavel?: {
    nome: string;
    avatar?: string;
  };
  nestedSubtasks?: SubtaskNested[];
  subtaskComments?: SubtaskComment[];
}

export const mockProjects: Project[] = [
  {
    id: '1',
    empresa: 'TechCorp Solutions',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png',
    gerente: 'Ana Silva',
    diasAtraso: 396,
    statusBadge: 'Em Atraso',
    indiceVelocidade: 2,
    velocidadeData: [1, 1.5, 2, 2.5, 2, 2.8, 3, 2.5, 1.5, 1, 1.2],
    // Burndown: Started with 100 tasks, now 25 remaining (75% complete)
    burndownData: [100, 92, 85, 75, 68, 58, 52, 40, 35, 28, 25],
    totalWork: 100,
    statusVelocidade: 'No Prazo',
    progresso: 75,
    proximaConclusao: '1.20',
    tarefasAtivas: 2,
    statusGeral: 'Excelente',
    statusProjeto: 'No Prazo',
    statusOnboarding: 'Iniciar Onboarding',
    dataInicio: '14/01/2024',
    dataFim: '30/06/2024',
    metricas: {
      tarefasAtivas: 2,
      concluidas: 0,
      atrasadas: 2,
    },
    email: 'contato@techcorp.com.br',
    telefone: '+55 11 98765-4321',
    endereco: 'Av. Paulista, 1578 - São Paulo, SP',
    descricao: 'Desenvolvimento de plataforma de gestão empresarial com integração multi-sistemas e dashboard analítico em tempo real.',
    orcamento: 450000,
    equipe: [
      { nome: 'Ana Silva', cargo: 'Gerente de Projetos' },
      { nome: 'Pedro Costa', cargo: 'Tech Lead' },
      { nome: 'Maria Santos', cargo: 'UX Designer' },
      { nome: 'João Oliveira', cargo: 'Backend Developer' },
    ],
    timeline: [
      { data: '14/01/2024', evento: 'Início do Projeto', tipo: 'inicio' },
      { data: '28/01/2024', evento: 'Kickoff Meeting Realizado', tipo: 'milestone' },
      { data: '15/02/2024', evento: 'Aprovação do Design System', tipo: 'milestone' },
      { data: '10/03/2024', evento: 'Atraso na Integração API', tipo: 'atraso' },
      { data: '25/03/2024', evento: 'Sprint 5 Concluída', tipo: 'milestone' },
    ],
    checklists: [
      {
        id: 'checklist-1',
        nome: 'Setup Inicial',
        items: [
          { id: '1', titulo: 'Configurar ambiente de desenvolvimento', concluido: true },
          { id: '2', titulo: 'Criar design system', concluido: true },
          { id: '3', titulo: 'Configurar CI/CD', concluido: true },
        ],
      },
      {
        id: 'checklist-2',
        nome: 'Desenvolvimento',
        items: [
          { id: '4', titulo: 'Implementar autenticação', concluido: true },
          { id: '5', titulo: 'Desenvolver dashboard principal', concluido: false },
          { id: '6', titulo: 'Integrar APIs externas', concluido: false },
        ],
      },
      {
        id: 'checklist-3',
        nome: 'Testes e Deploy',
        items: [
          { id: '7', titulo: 'Realizar testes de segurança', concluido: false },
          { id: '8', titulo: 'Testes de performance', concluido: false },
          { id: '9', titulo: 'Deploy em produção', concluido: false },
        ],
      },
    ],
    comentarios: [
      {
        id: '1',
        autor: 'João Silva',
        data: '20/03/2024',
        texto: 'Reunião com o cliente foi muito produtiva. Definimos as próximas entregas.',
      },
      {
        id: '2',
        autor: 'Maria Santos',
        data: '22/03/2024',
        texto: 'Encontramos alguns problemas na integração da API. Investigando soluções.',
      },
    ],
    pipelines: [
      {
        id: 'pipeline-1',
        nome: 'Pipeline Principal',
        colunas: [
          {
            id: 'coluna-1',
            nome: 'Backlog',
            ordem: 0,
            tasks: [
              {
                id: 'task-1',
                titulo: 'Implementar sistema de autenticação',
                descricao: 'Criar sistema completo de autenticação com JWT',
                dataVencimento: '2024-04-15',
                dataCriacao: '2024-03-20',
                responsavel: { nome: 'João Oliveira' },
                prioridade: 'alta',
                subtasks: [
                  {
                    id: 'subtask-1',
                    titulo: 'Configurar JWT tokens',
                    concluida: false,
                    dataVencimento: '2024-04-10',
                    responsavel: { nome: 'João Oliveira' },
                  },
                  {
                    id: 'subtask-2',
                    titulo: 'Criar middleware de autenticação',
                    concluida: false,
                    dataVencimento: '2024-04-12',
                    responsavel: { nome: 'João Oliveira' },
                  },
                ],
              },
              {
                id: 'task-2',
                titulo: 'Design do dashboard principal',
                descricao: 'Criar wireframes e mockups do dashboard',
                dataVencimento: '2024-04-20',
                dataCriacao: '2024-03-18',
                responsavel: { nome: 'Maria Santos' },
                prioridade: 'media',
              },
            ],
          },
          {
            id: 'coluna-2',
            nome: 'Em Progresso',
            ordem: 1,
            tasks: [
              {
                id: 'task-3',
                titulo: 'Desenvolver API de usuários',
                descricao: 'Criar endpoints para CRUD de usuários',
                dataVencimento: '2024-04-10',
                dataCriacao: '2024-03-15',
                responsavel: { nome: 'Pedro Costa' },
                prioridade: 'alta',
                subtasks: [
                  {
                    id: 'subtask-3',
                    titulo: 'Criar modelo de dados',
                    concluida: true,
                    responsavel: { nome: 'Pedro Costa' },
                  },
                  {
                    id: 'subtask-4',
                    titulo: 'Implementar endpoints GET',
                    concluida: true,
                    responsavel: { nome: 'Pedro Costa' },
                  },
                  {
                    id: 'subtask-5',
                    titulo: 'Implementar endpoints POST/PUT/DELETE',
                    concluida: false,
                    dataVencimento: '2024-04-08',
                    responsavel: { nome: 'Pedro Costa' },
                  },
                ],
              },
            ],
          },
          {
            id: 'coluna-3',
            nome: 'Em Revisão',
            ordem: 2,
            tasks: [
              {
                id: 'task-4',
                titulo: 'Integração com API externa',
                descricao: 'Integrar com API de pagamentos',
                dataVencimento: '2024-04-05',
                dataCriacao: '2024-03-10',
                responsavel: { nome: 'Ana Silva' },
                prioridade: 'urgente',
              },
            ],
          },
          {
            id: 'coluna-4',
            nome: 'Concluído',
            ordem: 3,
            tasks: [
              {
                id: 'task-5',
                titulo: 'Setup inicial do projeto',
                descricao: 'Configurar estrutura base do projeto',
                dataVencimento: '2024-03-25',
                dataCriacao: '2024-03-01',
                responsavel: { nome: 'Ana Silva' },
                prioridade: 'media',
                subtasks: [
                  {
                    id: 'subtask-6',
                    titulo: 'Configurar repositório Git',
                    concluida: true,
                    responsavel: { nome: 'Ana Silva' },
                  },
                  {
                    id: 'subtask-7',
                    titulo: 'Configurar ambiente de desenvolvimento',
                    concluida: true,
                    responsavel: { nome: 'Ana Silva' },
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'pipeline-2',
        nome: 'Pipeline de Testes',
        colunas: [
          {
            id: 'coluna-5',
            nome: 'Para Testar',
            ordem: 0,
            tasks: [
              {
                id: 'task-6',
                titulo: 'Testes de integração',
                dataVencimento: '2024-04-25',
                dataCriacao: '2024-03-22',
                responsavel: { nome: 'Juliana Ramos' },
                prioridade: 'alta',
              },
            ],
          },
          {
            id: 'coluna-6',
            nome: 'Testando',
            ordem: 1,
            tasks: [],
          },
          {
            id: 'coluna-7',
            nome: 'Aprovado',
            ordem: 2,
            tasks: [],
          },
        ],
      },
    ],
  },
  {
    id: '2',
    empresa: 'Innovate Digital',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Tailwind_CSS_Logo.svg/2560px-Tailwind_CSS_Logo.svg.png',
    gerente: 'Carlos Mendoza',
    diasAtraso: 427,
    statusBadge: 'Em Atraso',
    indiceVelocidade: 2,
    velocidadeData: [1, 2, 2.5, 1.8, 1, 0.8, 1.2, 1.5, 1, 0.9, 0.7],
    // Burndown: Started with 80 tasks, should be at 44, but still at 55 (behind schedule)
    burndownData: [80, 75, 70, 68, 66, 63, 62, 60, 58, 56, 55],
    totalWork: 80,
    statusVelocidade: 'Atrasado',
    progresso: 45,
    proximaConclusao: '0.70',
    tarefasAtivas: 2,
    statusGeral: 'Atenção',
    statusProjeto: 'Atrasado',
    statusOnboarding: 'Esperando Pagamento',
    dataInicio: '31/01/2024',
    dataFim: '31/08/2024',
    metricas: {
      tarefasAtivas: 2,
      concluidas: 0,
      atrasadas: 2,
    },
    email: 'contato@innovatedigital.com',
    telefone: '+55 21 97654-3210',
    endereco: 'Rua da Inovação, 500 - Rio de Janeiro, RJ',
    descricao: 'Desenvolvimento de aplicativo mobile para e-commerce com funcionalidades de AR e checkout simplificado.',
    orcamento: 320000,
    equipe: [
      { nome: 'Carlos Mendoza', cargo: 'Gerente de Projetos' },
      { nome: 'Fernanda Lima', cargo: 'Product Owner' },
      { nome: 'Rafael Torres', cargo: 'Mobile Developer' },
      { nome: 'Juliana Ramos', cargo: 'QA Engineer' },
    ],
    timeline: [
      { data: '31/01/2024', evento: 'Início do Projeto', tipo: 'inicio' },
      { data: '14/02/2024', evento: 'Definição de Requisitos', tipo: 'milestone' },
      { data: '28/02/2024', evento: 'Atraso na Contratação', tipo: 'atraso' },
      { data: '15/03/2024', evento: 'Protótipo Inicial', tipo: 'milestone' },
      { data: '30/03/2024', evento: 'Review com Stakeholders', tipo: 'milestone' },
    ],
    checklists: [
      {
        id: 'checklist-1',
        nome: 'Planejamento',
        items: [
          { id: '1', titulo: 'Pesquisa de mercado', concluido: true },
          { id: '2', titulo: 'Wireframes do app', concluido: true },
          { id: '3', titulo: 'Definir stack tecnológico', concluido: true },
        ],
      },
      {
        id: 'checklist-2',
        nome: 'Features Principais',
        items: [
          { id: '4', titulo: 'Implementar funcionalidade AR', concluido: false },
          { id: '5', titulo: 'Desenvolver sistema de checkout', concluido: false },
          { id: '6', titulo: 'Integração com gateways de pagamento', concluido: false },
        ],
      },
    ],
    pipelines: [
      {
        id: 'pipeline-3',
        nome: 'Pipeline Mobile',
        colunas: [
          {
            id: 'coluna-8',
            nome: 'Planejamento',
            ordem: 0,
            tasks: [
              {
                id: 'task-7',
                titulo: 'Definir arquitetura do app',
                dataVencimento: '2024-05-01',
                dataCriacao: '2024-03-25',
                responsavel: { nome: 'Rafael Torres' },
                prioridade: 'alta',
              },
            ],
          },
          {
            id: 'coluna-9',
            nome: 'Desenvolvimento',
            ordem: 1,
            tasks: [
              {
                id: 'task-8',
                titulo: 'Implementar funcionalidade AR',
                dataVencimento: '2024-05-15',
                dataCriacao: '2024-03-20',
                responsavel: { nome: 'Rafael Torres' },
                prioridade: 'urgente',
                subtasks: [
                  {
                    id: 'subtask-8',
                    titulo: 'Integrar biblioteca AR',
                    concluida: false,
                    dataVencimento: '2024-05-10',
                    responsavel: { nome: 'Rafael Torres' },
                  },
                  {
                    id: 'subtask-9',
                    titulo: 'Criar interface AR',
                    concluida: false,
                    dataVencimento: '2024-05-12',
                    responsavel: { nome: 'Rafael Torres' },
                  },
                ],
              },
            ],
          },
          {
            id: 'coluna-10',
            nome: 'Testes',
            ordem: 2,
            tasks: [],
          },
          {
            id: 'coluna-11',
            nome: 'Concluído',
            ordem: 3,
            tasks: [],
          },
        ],
      },
    ],
  },
];

export interface DashboardStats {
  totalClientes: number;
  noPrazo: number;
  atrasados: number;
  progressoMedio: number;
}

export const mockStats: DashboardStats = {
  totalClientes: 3,
  noPrazo: 2,
  atrasados: 1,
  progressoMedio: 68,
};
