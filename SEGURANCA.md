# Segurança e Logs – TechFala Dashboard

## O que foi implementado

### 1. Console do navegador (cliente)
- **Nenhum dado sensível** é escrito no console em produção.
- Erros no cliente são tratados por `lib/client-logger.ts`:
  - Não loga objetos de erro (sem stack, sem mensagem interna).
  - Apenas um código genérico (ex.: `E001`) pode aparecer em desenvolvimento.
  - Em produção, o bundle do cliente tem `console.*` removido via `next.config.ts` (compiler.removeConsole).
- Falhas são reportadas ao servidor via `POST /api/log` com **apenas código e timestamp**, para você ter logs detalhados só no servidor.

### 2. Logs no servidor
- **`lib/logger.ts`** (uso apenas em API routes / server):
  - `serverLogger.error(msg, err, context)` – loga em JSON, com sanitização.
  - Campos sensíveis (senha, token, authorization, apiKey, etc.) são substituídos por `[REDACTED]`.
  - Stack de erro só em desenvolvimento; em produção só mensagem genérica.
  - Todos os `console.error` das APIs foram trocados por `serverLogger.error` com rota e método.
- Os logs ficam no stdout do servidor (e em qualquer sistema de log que você conectar), **inacessíveis a quem acessa só o navegador**.

### 3. Respostas da API
- Login e registro **nunca** devolvem o campo `senha` (já estava correto).
- Respostas de erro são mensagens genéricas (“Erro ao fazer login”, “Failed to fetch projects”), sem detalhes técnicos ou stack.

### 4. Autenticação com sessão (JWT + cookie httpOnly)
- **Login/registro**: o servidor emite um **JWT** e grava em um **cookie httpOnly** (`session`), seguro e `sameSite: lax`.
- **Middleware**: em toda requisição (páginas e APIs), o JWT do cookie é **verificado** (assinatura e expiração). Sem cookie válido:
  - Páginas protegidas → redirecionamento para `/login?from=...`.
  - APIs (exceto `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/log`) → resposta **401 Não autorizado**.
- **APIs protegidas**: só respondem com dados se o cookie de sessão for válido; caso contrário retornam 401.
- **Logout**: `POST /api/auth/logout` limpa o cookie. O cliente usa `credentials: 'include'` nas requisições para enviar o cookie.
- **Variável de ambiente**: em **produção** defina `JWT_SECRET` no `.env` (mínimo 32 caracteres). Em desenvolvimento, se não existir, é usado um valor padrão apenas para rodar localmente.

### Boas práticas já em uso
- Senhas hasheadas com bcrypt.
- `.env` no `.gitignore` (nunca commitar segredos).
- Dados sensíveis sanitizados no logger do servidor.

---

## Onde estão os logs

| Onde | O que aparece |
|------|----------------|
| **Console do navegador (prod)** | Nada (console removido do bundle). |
| **Console do navegador (dev)** | Apenas mensagem genérica tipo “Erro E001. Consulte os logs do servidor.” |
| **Servidor (stdout)** | Logs em JSON: erro, rota, método, mensagem sanitizada, stack só em dev. |
| **POST /api/log** | Recebe só código + timestamp do cliente e grava no servidor (warn). |

Assim você tem **muitos logs no servidor** para diagnóstico, sem expor nada útil a quem inspeciona o console ou as respostas da API.
