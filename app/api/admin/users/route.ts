import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/require-admin';
import { serverLogger } from '@/lib/logger';
import { getClientErrorMessage } from '@/lib/api-error';

/** Lista usuários (admin). Retorna todos com dados de quem criou. */
export async function GET(request: NextRequest) {
  const [session, err] = await requireAdmin(request);
  if (err) return err;

  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/56aa2456-555e-4a18-938a-fda027b38124',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/admin/users/route.ts:GET',message:'before prisma.user.findMany',data:{hasSession:!!session,userId:session?.userId},timestamp:Date.now(),hypothesisId:'H1,H2'})}).catch(()=>{});
    // #endregion
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        nome: true,
        cargo: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
        criadoPorId: true,
        criadoPor: {
          select: { id: true, nome: true, email: true },
        },
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    // #region agent log
    const errObj = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { raw: String(error) };
    fetch('http://127.0.0.1:7242/ingest/56aa2456-555e-4a18-938a-fda027b38124',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/admin/users/route.ts:GET:catch',message:'Error listing users',data:{error:errObj,userId:session?.userId},timestamp:Date.now(),hypothesisId:'H1,H2,H3'})}).catch(()=>{});
    // #endregion
    serverLogger.error('Error listing users', error, { route: '/api/admin/users', method: 'GET', userId: session!.userId });
    return NextResponse.json(getClientErrorMessage('Erro ao listar usuários', error), { status: 500 });
  }
}

/** Cria usuário (admin). Registra criadoPorId e grava em AuditLog. */
export async function POST(request: NextRequest) {
  const [session, err] = await requireAdmin(request);
  if (err) return err;

  try {
    const body = await request.json();
    const { email, senha, nome, cargo } = body;

    if (!email || !senha || !nome) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      );
    }

    const cargoValido = ['admin', 'gerente', 'usuario'].includes(cargo);
    if (!cargoValido) {
      return NextResponse.json(
        { error: 'Cargo deve ser admin, gerente ou usuario' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Já existe um usuário com este e-mail' }, { status: 400 });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/56aa2456-555e-4a18-938a-fda027b38124',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/admin/users/route.ts:POST',message:'before prisma.user.create',data:{email,nome,cargo,hasSession:!!session},timestamp:Date.now(),hypothesisId:'H1,H2'})}).catch(()=>{});
    // #endregion
    const user = await prisma.user.create({
      data: {
        email,
        nome,
        senha: senhaHash,
        cargo: cargo || 'usuario',
        criadoPorId: session.userId,
      },
      select: {
        id: true,
        email: true,
        nome: true,
        cargo: true,
        ativo: true,
        createdAt: true,
        criadoPorId: true,
        criadoPor: { select: { id: true, nome: true, email: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        userNome: session.nome,
        acao: 'criar_usuario',
        alvoTipo: 'usuario',
        alvoId: user.id,
        detalhes: JSON.stringify({ email: user.email, cargo: user.cargo }),
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    // #region agent log
    const errObj = error instanceof Error ? { name: error.name, message: error.message, stack: (error.stack||'').slice(0,500) } : { raw: String(error) };
    fetch('http://127.0.0.1:7242/ingest/56aa2456-555e-4a18-938a-fda027b38124',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/admin/users/route.ts:POST:catch',message:'Error creating user',data:{error:errObj,userId:session?.userId},timestamp:Date.now(),hypothesisId:'H1,H2,H3'})}).catch(()=>{});
    // #endregion
    serverLogger.error('Error creating user', error, { route: '/api/admin/users', method: 'POST', userId: session!.userId });
    return NextResponse.json(getClientErrorMessage('Erro ao criar usuário', error), { status: 500 });
  }
}
