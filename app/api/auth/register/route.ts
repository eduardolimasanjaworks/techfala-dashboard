import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { serverLogger } from '@/lib/logger';
import { createToken, getSessionCookieOptions, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const { email, senha, nome, cargo } = body;

    if (!email || !senha || !nome) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      );
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // Validação de senha (mínimo 6 caracteres)
    if (senha.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Usuário já existe' }, { status: 400 });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        senha: senhaHash,
        nome,
        cargo: cargo || 'usuario',
      },
    });

    const { senha: _, ...userWithoutPassword } = user;

    const token = await createToken({
      userId: user.id,
      email: user.email,
      nome: user.nome,
      cargo: user.cargo,
    });

    const response = NextResponse.json({
      user: userWithoutPassword,
      message: 'Usuário criado com sucesso',
    });

    response.cookies.set(COOKIE_NAME, token, getSessionCookieOptions());
    return response;
  } catch (error) {
    serverLogger.error('Error during registration', error, { route: '/api/auth/register', method: 'POST' });
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  }
}
