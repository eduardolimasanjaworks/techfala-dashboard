#!/bin/sh
set -e

cd /app

# DATABASE_URL deve apontar para o volume persistente (ex: /app/prisma/dev.db)
export DATABASE_URL="${DATABASE_URL:-file:/app/data/dev.db}"

# Migrations
npx prisma db push --skip-generate || true

# Seed (idempotente; ignora erros de duplicação)
node prisma/seed.js 2>/dev/null || true

exec "$@"
