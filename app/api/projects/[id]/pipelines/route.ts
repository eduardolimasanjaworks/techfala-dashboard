import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';
import { logActivity } from '@/lib/activity-log';
import { getClientErrorMessage } from '@/lib/api-error';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const allPipelines = await prisma.pipeline.findMany({
      where: { projectId: id },
      include: {
        colunas: {
          include: {
            tasks: {
              include: {
                subtasks: {
                  orderBy: { id: 'asc' },
                },
              },
              orderBy: { id: 'asc' },
            },
          },
          orderBy: { ordem: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    });

    const pipelines = allPipelines.filter((p: { deletedAt?: Date | null }) => p.deletedAt == null);
    const transformed = pipelines.map((p) => ({
      id: p.id,
      nome: p.nome,
      colunas: p.colunas.map((col) => ({
        id: col.id,
        nome: col.nome,
        ordem: col.ordem,
        tasks: (col.tasks ?? []).filter((t: { deletedAt?: Date | null }) => t.deletedAt == null).map((t) => ({
          id: t.id,
          epicId: t.epicId || undefined,
          titulo: t.titulo,
          descricao: t.descricao || undefined,
          dataVencimento: t.dataVencimento || undefined,
          dataCriacao: t.dataCriacao,
          prioridade: (t.prioridade as 'baixa' | 'media' | 'alta' | 'urgente') || undefined,
          tags: t.tags ? JSON.parse(t.tags) : undefined,
          responsavel: t.responsavelNome
            ? {
                nome: t.responsavelNome,
                avatar: t.responsavelAvatar || undefined,
              }
            : undefined,
          subtasks: t.subtasks.map((s) => ({
            id: s.id,
            titulo: s.titulo,
            concluida: s.concluida,
            dataVencimento: s.dataVencimento || undefined,
            responsavel: s.responsavelNome
              ? {
                  nome: s.responsavelNome,
                  avatar: s.responsavelAvatar || undefined,
                }
              : undefined,
          })),
        })),
      })),
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    serverLogger.error('Error fetching pipelines', error, { route: '/api/projects/[id]/pipelines', method: 'GET' });
    return NextResponse.json(getClientErrorMessage('Failed to fetch pipelines', error), { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nome, colunas } = body;

    const pipeline = await prisma.pipeline.create({
      data: {
        projectId: id,
        nome,
        colunas: colunas
          ? {
              create: colunas.map((col: { nome: string; ordem: number }) => ({
                nome: col.nome,
                ordem: col.ordem,
              })),
            }
          : {
              create: [
                { nome: 'Backlog', ordem: 0 },
                { nome: 'Em Progresso', ordem: 1 },
                { nome: 'Em Revisão', ordem: 2 },
                { nome: 'Concluído', ordem: 3 },
              ],
            },
      },
      include: {
        colunas: {
          orderBy: { ordem: 'asc' },
        },
      },
    });

    await logActivity({
      request,
      projectId: id,
      action: 'pipeline_created',
      details: { nome: pipeline.nome, pipelineId: pipeline.id },
    });

    return NextResponse.json({
      id: pipeline.id,
      nome: pipeline.nome,
      colunas: pipeline.colunas.map((col) => ({
        id: col.id,
        nome: col.nome,
        ordem: col.ordem,
        cor: col.cor ?? undefined,
        corFonte: col.corFonte ?? undefined,
        responsavelNome: col.responsavelNome ?? undefined,
        tasks: [],
      })),
    });
  } catch (error) {
    serverLogger.error('Error creating pipeline', error, { route: '/api/projects/[id]/pipelines', method: 'POST' });
    return NextResponse.json({ error: 'Failed to create pipeline' }, { status: 500 });
  }
}
