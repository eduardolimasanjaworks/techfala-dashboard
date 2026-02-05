// Mock data structure based on the reference image
export interface Project {
  id: string;
  empresa: string;
  gerente: string;
  diasAtraso: number;
  statusBadge: 'Em Atraso' | 'No Prazo' | 'Em Andamento';
  indiceVelocidade: number;
  velocidadeData: number[];
  // Burndown chart data: work remaining over time (should decrease)
  burndownData: number[];
  totalWork: number; // Total work at project start
  statusVelocidade: 'No Prazo' | 'Atrasado';
  progresso: number;
  proximaConclusao: string;
  tarefasAtivas: number;
  statusGeral: 'Excelente' | 'Atenção' | 'Crítico';
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
