#!/bin/bash
# Inicia o TechFala Dashboard (build + up)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

# Carregar .env
[ -f .env ] && export $(grep -v '^#' .env | xargs)

docker compose up -d --build

echo ""
echo "TechFala Dashboard em execução: http://localhost:3847"
echo "Login: admin@techfala.com | Senha: admin123"
echo "Logs: docker compose logs -f app"
