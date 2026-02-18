import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getSession, unauthorized } from '@/lib/auth';
import { serverLogger } from '@/lib/logger';

/** Usuário altera a própria senha (senha atual + nova). Sem e-mail. Registro imutável em AuditLog. */
export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return unauthorized();

  try {
    const body = await request.json();
    const { senhaAtual, senhaNova } = body;

    if (!senhaAtual || !senhaNova) {
      return NextResponse.json(
        { error: 'Senha atual e nova senha são obrigatórias' },
        { status: 400 }
      );
    }

    if (senhaNova.length < 6) {
      return NextResponse.json(
        { error: 'A nova senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || !user.ativo) {
      return NextResponse.json({ error: 'Usuário não encontrado ou inativo' }, { status: 404 });
    }

    const senhaValida = await bcrypt.compare(senhaAtual, user.senha);
    if (!senhaValida) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 401 });
    }

    const senhaHash = await bcrypt.hash(senhaNova, 10);
    await prisma.user.update({
      where: { id: session.userId },
      data: { senha: senhaHash },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        userNome: session.nome,
        acao: 'usuario_alterou_propria_senha',
        alvoTipo: 'usuario',
        alvoId: session.userId,
        detalhes: JSON.stringify({
          email: session.email,
          quando: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    serverLogger.error('Error changing password', error, { route: '/api/auth/change-password', method: 'POST' });
    return NextResponse.json({ error: 'Erro ao alterar senha' }, { status: 500 });
  }
}
