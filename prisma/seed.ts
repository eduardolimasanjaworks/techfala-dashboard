import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Status de projeto para o Kanban global (etiquetas)
  const existingStatus = await prisma.projectStatus.findFirst();
  if (!existingStatus) {
    await prisma.projectStatus.createMany({
      data: [
        { nome: 'Lead', cor: '#8B5CF6', ordem: 0 },
        { nome: 'Em Andamento', cor: '#3B82F6', ordem: 1 },
        { nome: 'Concluído', cor: '#00D084', ordem: 2 },
      ],
    });
    console.log('✅ Status de projeto criados');
  }

  // Criar usuário admin padrão
  const adminEmail = 'admin@techfala.com';
  const adminSenha = await bcrypt.hash('admin123', 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        senha: adminSenha,
        nome: 'Administrador',
        cargo: 'admin',
        ativo: true,
      },
    });
    console.log('✅ Usuário admin criado:', admin.email);
  } else {
    console.log('ℹ️  Usuário admin já existe');
  }

  // Criar usuário de teste
  const testEmail = 'teste@techfala.com';
  const testSenha = await bcrypt.hash('teste123', 10);

  const existingTest = await prisma.user.findUnique({
    where: { email: testEmail },
  });

  if (!existingTest) {
    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        senha: testSenha,
        nome: 'Usuário Teste',
        cargo: 'usuario',
        ativo: true,
      },
    });
    console.log('✅ Usuário de teste criado:', testUser.email);
  } else {
    console.log('ℹ️  Usuário de teste já existe');
  }

  // Criar projeto de exemplo
  const existingProject = await prisma.project.findFirst({
    where: { empresa: 'TechCorp Solutions' },
  });

  if (!existingProject) {
    const project = await prisma.project.create({
      data: {
        empresa: 'TechCorp Solutions',
        gerente: 'Ana Silva',
        dataInicio: '14/01/2024',
        dataFim: '30/06/2024',
        descricao: 'Desenvolvimento de plataforma de gestão empresarial com integração multi-sistemas e dashboard analítico em tempo real.',
        email: 'contato@techcorp.com.br',
        telefone: '+55 11 98765-4321',
        endereco: 'Av. Paulista, 1578 - São Paulo, SP',
        orcamento: 450000,
        statusBadge: 'No Prazo',
        statusVelocidade: 'No Prazo',
        progresso: 75,
        proximaConclusao: '1.20',
        tarefasAtivas: 2,
        statusGeral: 'Excelente',
        statusProjeto: 'No Prazo',
        statusOnboarding: 'Iniciar Onboarding',
        equipe: {
          create: [
            { nome: 'Ana Silva', cargo: 'Gerente de Projetos' },
            { nome: 'Pedro Costa', cargo: 'Tech Lead' },
            { nome: 'Maria Santos', cargo: 'UX Designer' },
            { nome: 'João Oliveira', cargo: 'Backend Developer' },
          ],
        },
        velocidadeData: {
          create: [
            { valor: 1, ordem: 0 },
            { valor: 1.5, ordem: 1 },
            { valor: 2, ordem: 2 },
            { valor: 2.5, ordem: 3 },
            { valor: 2, ordem: 4 },
            { valor: 2.8, ordem: 5 },
            { valor: 3, ordem: 6 },
          ],
        },
        burndownData: {
          create: [
            { valor: 100, ordem: 0 },
            { valor: 92, ordem: 1 },
            { valor: 85, ordem: 2 },
            { valor: 75, ordem: 3 },
            { valor: 68, ordem: 4 },
            { valor: 58, ordem: 5 },
            { valor: 52, ordem: 6 },
          ],
        },
        checklists: {
          create: [
            {
              nome: 'Setup Inicial',
              items: {
                create: [
                  { titulo: 'Configurar ambiente de desenvolvimento', concluido: true },
                  { titulo: 'Criar design system', concluido: true },
                  { titulo: 'Configurar CI/CD', concluido: true },
                ],
              },
            },
            {
              nome: 'Desenvolvimento',
              items: {
                create: [
                  { titulo: 'Implementar autenticação', concluido: true },
                  { titulo: 'Desenvolver dashboard principal', concluido: false },
                  { titulo: 'Integrar APIs externas', concluido: false },
                ],
              },
            },
          ],
        },
        comentarios: {
          create: [
            {
              autor: 'João Silva',
              data: '20/03/2024',
              texto: 'Reunião com o cliente foi muito produtiva. Definimos as próximas entregas.',
            },
            {
              autor: 'Maria Santos',
              data: '22/03/2024',
              texto: 'Encontramos alguns problemas na integração da API. Investigando soluções.',
            },
          ],
        },
        timeline: {
          create: [
            { data: '14/01/2024', evento: 'Início do Projeto', tipo: 'inicio' },
            { data: '28/01/2024', evento: 'Kickoff Meeting Realizado', tipo: 'milestone' },
            { data: '15/02/2024', evento: 'Aprovação do Design System', tipo: 'milestone' },
          ],
        },
      },
    });

    // Criar pipeline de exemplo
    const pipeline = await prisma.pipeline.create({
      data: {
        projectId: project.id,
        nome: 'Pipeline Principal',
        colunas: {
          create: [
            {
              nome: 'Backlog',
              ordem: 0,
              tasks: {
                create: [
                  {
                    titulo: 'Implementar sistema de autenticação',
                    descricao: 'Criar sistema completo de autenticação com JWT',
                    dataVencimento: '2024-04-15',
                    dataCriacao: '2024-03-20',
                    prioridade: 'alta',
                    responsavelNome: 'João Oliveira',
                    subtasks: {
                      create: [
                        {
                          titulo: 'Configurar JWT tokens',
                          concluida: false,
                          dataVencimento: '2024-04-10',
                          responsavelNome: 'João Oliveira',
                        },
                        {
                          titulo: 'Criar middleware de autenticação',
                          concluida: false,
                          dataVencimento: '2024-04-12',
                          responsavelNome: 'João Oliveira',
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              nome: 'Em Progresso',
              ordem: 1,
              tasks: {
                create: [
                  {
                    titulo: 'Desenvolver API de usuários',
                    descricao: 'Criar endpoints para CRUD de usuários',
                    dataVencimento: '2024-04-10',
                    dataCriacao: '2024-03-15',
                    prioridade: 'alta',
                    responsavelNome: 'Pedro Costa',
                    subtasks: {
                      create: [
                        {
                          titulo: 'Criar modelo de dados',
                          concluida: true,
                          responsavelNome: 'Pedro Costa',
                        },
                        {
                          titulo: 'Implementar endpoints GET',
                          concluida: true,
                          responsavelNome: 'Pedro Costa',
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              nome: 'Em Revisão',
              ordem: 2,
              tasks: {
                create: [],
              },
            },
            {
              nome: 'Concluído',
              ordem: 3,
              tasks: {
                create: [
                  {
                    titulo: 'Setup inicial do projeto',
                    descricao: 'Configurar estrutura base do projeto',
                    dataVencimento: '2024-03-25',
                    dataCriacao: '2024-03-01',
                    prioridade: 'media',
                    responsavelNome: 'Ana Silva',
                    subtasks: {
                      create: [
                        {
                          titulo: 'Configurar repositório Git',
                          concluida: true,
                          responsavelNome: 'Ana Silva',
                        },
                        {
                          titulo: 'Configurar ambiente de desenvolvimento',
                          concluida: true,
                          responsavelNome: 'Ana Silva',
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });

    console.log('✅ Projeto de exemplo criado:', project.empresa);
    console.log('✅ Pipeline de exemplo criado:', pipeline.nome);
  } else {
    console.log('ℹ️  Projeto de exemplo já existe');
  }

  console.log('✨ Seed concluído com sucesso!');
  console.log('');
  console.log('📧 Credenciais de acesso:');
  console.log('   Admin: admin@techfala.com / admin123');
  console.log('   Teste: teste@techfala.com / teste123');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
