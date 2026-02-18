import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/require-admin';
import { serverLogger } from '@/lib/logger';

/** Atualiza usuário (admin). Não altera criadoPorId; grava auditoria. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, err] = await requireAdmin(request);
  if (err) return err;

  const { id } = await params;
  try {
    const body = await request.json();
    const { nome, email, cargo, senha, ativo } = body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const updateData: { nome?: string; email?: string; cargo?: string; senha?: string; ativo?: boolean } = {};
    if (nome !== undefined) updateData.nome = nome;
    if (email !== undefined) updateData.email = email;
    if (cargo !== undefined) {
      if (!['admin', 'gerente', 'usuario'].includes(cargo)) {
        return NextResponse.json({ error: 'Cargo inválido' }, { status: 400 });
      }
      updateData.cargo = cargo;
    }
    if (ativo !== undefined) updateData.ativo = !!ativo;
    if (senha !== undefined && senha !== '') {
      updateData.senha = await bcrypt.hash(senha, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nome: true,
        cargo: true,
        ativo: true,
        updatedAt: true,
        criadoPorId: true,
        criadoPor: { select: { id: true, nome: true, email: true } },
      },
    });

    const camposAlterados = Object.keys(updateData);
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        userNome: session.nome,
        acao: 'editar_usuario',
        alvoTipo: 'usuario',
        alvoId: id,
        detalhes: JSON.stringify({ email: user.email, campos: camposAlterados }),
      },
    });

    if (updateData.senha) {
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          userNome: session.nome,
          acao: 'alterar_senha',
          alvoTipo: 'usuario',
          alvoId: id,
          detalhes: JSON.stringify({
            emailAlvo: user.email,
            nomeAlvo: user.nome,
            alteradoPor: session.nome,
            alteradoPorEmail: session.email,
            quando: new Date().toISOString(),
          }),
        },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    serverLogger.error('Error updating user', error, { route: '/api/admin/users/[id]', method: 'PUT', userId: session.userId });
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}

/** Desativa ou reativa usuário (admin). Auditoria. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, err] = await requireAdmin(request);
  if (err) return err;

  const { id } = await params;
  try {
    const body = await request.json();
    const { ativo } = body;

    if (typeof ativo !== 'boolean') {
      return NextResponse.json({ error: 'Campo ativo (boolean) obrigatório' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { ativo },
      select: {
        id: true,
        email: true,
        nome: true,
        ativo: true,
        criadoPor: { select: { nome: true, email: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        userNome: session.nome,
        acao: ativo ? 'reativar_usuario' : 'desativar_usuario',
        alvoTipo: 'usuario',
        alvoId: id,
        detalhes: JSON.stringify({ email: user.email }),
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    serverLogger.error('Error toggling user active', error, { route: '/api/admin/users/[id]', method: 'PATCH', userId: session.userId });
    return NextResponse.json({ error: 'Erro ao alterar status' }, { status: 500 });
  }
}
