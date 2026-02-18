# 🚀 Início Rápido - TechFala Dashboard

## Como Iniciar

### Opção 1: Automático (Recomendado)
```bash
npm run dev
```

O script `dev` automaticamente:
1. ✅ Configura o arquivo `.env` (se não existir)
2. ✅ Instala dependências (se necessário)
3. ✅ Gera o Prisma Client
4. ✅ Cria/popula o banco de dados SQLite
5. ✅ Executa o seed com dados iniciais
6. ✅ Inicia o servidor Next.js

### Opção 2: Manual
```bash
npm run setup  # Configura tudo
npm run dev    # Inicia o servidor
```

## 🌐 Acessar a Aplicação

Após iniciar, acesse no navegador:
```
http://localhost:3000
```

## 🔐 Credenciais de Acesso

O seed cria automaticamente dois usuários:

### Administrador
- **Email:** `admin@techfala.com`
- **Senha:** `admin123`
- **Cargo:** `admin`

### Usuário de Teste
- **Email:** `teste@techfala.com`
- **Senha:** `teste123`
- **Cargo:** `usuario`

## 📊 Dados Iniciais

O seed também cria:
- ✅ 1 projeto de exemplo ("TechCorp Solutions")
- ✅ 1 pipeline com 4 colunas (Backlog, Em Progresso, Em Revisão, Concluído)
- ✅ Tasks de exemplo com subtasks
- ✅ Checklists de exemplo
- ✅ Equipe de exemplo
- ✅ Timeline de exemplo
- ✅ Comentários de exemplo

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Banco de Dados
npm run db:push      # Aplica mudanças do schema ao banco
npm run db:seed      # Popula banco com dados iniciais
npm run db:studio    # Abre Prisma Studio (interface visual do banco)

# Build
npm run build        # Build para produção
npm run start        # Inicia servidor de produção
```

## 📁 Estrutura Principal

```
app/
  ├── page.tsx              # Dashboard principal (lista de projetos)
  ├── login/                # Tela de login/registro
  ├── projects/[id]/        # Detalhes do projeto
  └── api/                  # APIs REST
      ├── auth/             # Autenticação
      ├── projects/         # CRUD de projetos
      ├── pipelines/        # CRUD de pipelines
      ├── tasks/            # CRUD de tasks
      └── ...

components/
  ├── kanban/               # Componentes do Kanban (modularizados)
  ├── pipeline-manager.tsx  # Gerenciador de pipelines
  └── ...

prisma/
  ├── schema.prisma        # Schema do banco de dados
  ├── seed.js              # Script de seed
  └── dev.db               # Banco SQLite (criado automaticamente)
```

## 🔧 Erro 500 nas APIs (/api/admin/users, /api/admin/audit, /api/projects/...)

Se as rotas da API retornam **500 (Internal Server Error)**, a causa mais comum é o **banco de dados não estar configurado ou acessível**.

### O que está acontecendo
- As rotas `/api/admin/users`, `/api/admin/audit` e `/api/projects/[id]` usam o **Prisma** para ler no SQLite.
- Se `DATABASE_URL` não existir no `.env`, ou o banco não tiver sido criado/populado, o Prisma falha e a API devolve 500.

### Como corrigir

1. **Garantir que o setup foi executado** (cria `.env` e o banco):
   ```bash
   npm run setup
   ```
   Ou, manualmente:
   ```bash
   # Criar .env com DATABASE_URL e JWT_SECRET (veja env.example)
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

2. **Ver o erro real em desenvolvimento**  
   Em modo dev, a resposta JSON da API em erro inclui um campo `debug` com a mensagem do Prisma. Abra **F12 → Aba Network**, clique na requisição que deu 500 e veja o corpo da resposta (ex.: `"Environment variable not found: DATABASE_URL"` ou erro de conexão).

3. **Confirmar que existe `.env` na raiz** com algo como:
   ```
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="um-segredo-com-pelo-menos-32-caracteres"
   ```
   O arquivo `dev.db` é criado pelo Prisma (por padrão na pasta `prisma/` ou na raiz, conforme o caminho em `DATABASE_URL`).

Depois de rodar `npm run setup` (ou os comandos acima), reinicie o servidor (`npm run dev`) e teste de novo.

## 🔄 Projetos somem ao recarregar / Erro 500 ao listar projetos

Os projetos **são salvos no banco**, mas ao recarregar a página a lista fica vazia ou aparece erro 500. Isso acontece quando o **Prisma Client está desatualizado** ou o **banco não está sincronizado** com o schema.

### Como corrigir

1. **Pare o servidor** (Ctrl+C no terminal onde está rodando `npm run dev`).  
   O comando `prisma generate` precisa que o servidor esteja parado (evita erro EPERM de arquivo bloqueado).

2. **Execute na raiz do projeto**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Inicie o servidor de novo**:
   ```bash
   npm run dev
   ```

### Se aparecer "EPERM: operation not permitted"

Significa que o servidor Next.js ainda está em execução e está bloqueando o arquivo do Prisma Client. Feche o terminal do `npm run dev` (ou pare o processo) e rode novamente os passos acima.

### Ver o erro real

Em desenvolvimento, a API retorna a mensagem detalhada do Prisma no corpo da resposta (campo `debug`). Abra **F12 → Network**, clique na requisição que retornou 500 e veja o corpo da resposta para entender a causa exata.

## ✅ Tudo Pronto!

A aplicação está **100% funcional** e pronta para uso:
- ✅ Banco de dados configurado
- ✅ Autenticação funcionando
- ✅ CRUDs implementados
- ✅ Kanban com drag & drop
- ✅ Múltiplos pipelines
- ✅ Tasks com datas e subtasks
- ✅ Sistema modularizado
- ✅ Tratamento de erros
- ✅ Loading states

**Apenas acesse `http://localhost:3000` e comece a usar!** 🎉
