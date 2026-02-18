#!/bin/bash
# Deploy do TechFala Dashboard em VPS Linux
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

echo "=== TechFala Dashboard - Deploy ==="

# Verificar variáveis
if [ -z "$JWT_SECRET" ] && [ ! -f .env ]; then
  echo "Aviso: JWT_SECRET não definida. Defina em .env ou export JWT_SECRET=..."
  echo "Exemplo: echo 'JWT_SECRET=sua-chave-secreta-min-32-caracteres' >> .env"
  if [ ! -f .env ]; then
    echo "JWT_SECRET=sua-chave-secreta-min-32-caracteres-aqui" > .env
    echo "Arquivo .env criado. Edite e defina JWT_SECRET antes do próximo deploy."
  fi
fi

# Carregar .env se existir
[ -f .env ] && export $(grep -v '^#' .env | xargs)

echo "Building..."
docker compose build --no-cache

echo "Stopping old containers..."
docker compose down 2>/dev/null || true

echo "Starting..."
docker compose up -d

echo ""
echo "=== Deploy concluído ==="
echo "Aplicação: http://localhost:3847"
echo "Login: admin@techfala.com | Senha: admin123"
echo ""
echo "Logs: docker compose logs -f app"
