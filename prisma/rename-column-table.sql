-- Renomeia a tabela "Column" para "columns" (evita conflito com palavra reservada SQL)
-- Execute uma vez: npx prisma db execute --file prisma/rename-column-table.sql
ALTER TABLE "Column" RENAME TO "columns";
