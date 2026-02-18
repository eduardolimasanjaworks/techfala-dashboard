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

    const { email, senha } = body;

    if (!email || !senha) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.ativo) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const { senha: _, ...userWithoutPassword } = user;

    const token = await createToken({
      userId: user.id,
      email: user.email,
      nome: user.nome,
      cargo: user.cargo,
    });

    const response = NextResponse.json({
      user: userWithoutPassword,
      message: 'Login realizado com sucesso',
    });

    response.cookies.set(COOKIE_NAME, token, getSessionCookieOptions());
    return response;
  } catch (error) {
    serverLogger.error('Error during login', error, { route: '/api/auth/login', method: 'POST' });
    return NextResponse.json({ error: 'Erro ao fazer login' }, { status: 500 });
  }
}
