import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';

function parseHexColor(c: string): string | null {
  if (typeof c !== 'string') return null;
  const m = c.trim().match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/);
  if (!m) return null;
  let hex = m[1];
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  return '#' + hex.slice(0, 6);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'ID do projeto é obrigatório' }, { status: 400 });
    try {
      const labels = await prisma.label.findMany({
        where: { projectId: id },
        orderBy: { ordem: 'asc' },
      });
      return NextResponse.json(labels.map((l) => ({ id: l.id, nome: l.nome, cor: l.cor, ordem: l.ordem })));
    } catch {
      const rows = await prisma.$queryRawUnsafe<{ id: string; nome: string; cor: string; ordem: number }[]>(
        'SELECT id, nome, cor, ordem FROM Label WHERE projectId = ? ORDER BY ordem ASC',
        id
      );
      return NextResponse.json(rows.map((l) => ({ id: l.id, nome: l.nome, cor: l.cor, ordem: l.ordem })));
    }
  } catch (error) {
    serverLogger.error('Error fetching labels', error, { route: '/api/projects/[id]/labels', method: 'GET' });
    return NextResponse.json({ error: 'Falha ao listar etiquetas' }, { status: 500 });
  }
}

function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 15);
  return `c${timestamp}${random}`.slice(0, 25);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'ID do projeto é obrigatório' }, { status: 400 });
    const project = await prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    const { nome, cor } = body;
    const name = typeof nome === 'string' && nome.trim() ? nome.trim() : 'Nova etiqueta';
    const color = parseHexColor(cor) ?? '#8B5CF6';

    try {
      const count = await prisma.label.count({ where: { projectId: id } });
      const label = await prisma.label.create({
        data: { projectId: id, nome: name, cor: color, ordem: count },
      });
      return NextResponse.json({ id: label.id, nome: label.nome, cor: label.cor, ordem: label.ordem });
    } catch {
      const countResult = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
        'SELECT COUNT(*) as count FROM Label WHERE projectId = ?',
        id
      );
      const ordem = Number(countResult[0]?.count ?? 0);
      const labelId = generateCuid();
      await prisma.$executeRawUnsafe(
        'INSERT INTO Label (id, projectId, nome, cor, ordem) VALUES (?, ?, ?, ?, ?)',
        labelId,
        id,
        name,
        color,
        ordem
      );
      return NextResponse.json({ id: labelId, nome: name, cor: color, ordem });
    }
  } catch (error) {
    serverLogger.error('Error creating label', error, { route: '/api/projects/[id]/labels', method: 'POST' });
    return NextResponse.json({ error: 'Falha ao criar etiqueta' }, { status: 500 });
  }
}
