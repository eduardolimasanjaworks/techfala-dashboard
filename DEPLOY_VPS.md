# Deploy em VPS Linux

## Requisitos

- Docker e Docker Compose instalados
- Porta 3847 disponível (ou altere no `docker-compose.yml`)

## Configuração

1. Clone o repositório na VPS:
   ```bash
   git clone https://github.com/eduardolimasanjaworks/techfala-dashboard.git
   cd techfala-dashboard
   ```

2. Crie o arquivo `.env` com as variáveis de produção:
   ```bash
   echo "JWT_SECRET=sua-chave-secreta-minimo-32-caracteres-aqui" > .env
   ```
   **Importante:** Gere uma chave forte para `JWT_SECRET` (mín. 32 caracteres).

3. Execute o deploy:
   ```bash
   chmod +x scripts/*.sh
   ./scripts/deploy.sh
   ```

   Ou manualmente:
   ```bash
   docker compose build
   docker compose up -d
   ```

## Scripts disponíveis

| Script        | Descrição                    |
|---------------|------------------------------|
| `scripts/start.sh` | Build e inicia em background |
| `scripts/stop.sh`  | Para os containers           |
| `scripts/deploy.sh`| Build completo e reinicia    |

## Acesso

- **URL:** http://SEU_IP:3847
- **Login:** admin@techfala.com
- **Senha:** admin123

**Recomendação:** Altere a senha do admin após o primeiro acesso.

## Dados persistentes

O banco SQLite fica em um volume Docker (`prisma_data`). Para backup:
```bash
docker compose exec app cat /app/data/dev.db > backup.db
```

## Logs

```bash
docker compose logs -f app
```
