import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/**
 * GET: lista notificações do projeto para o usuário logado.
 * Compara targetNome e targetEmail com o nome/email da sessão.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getSession(request);
    const nome = session?.nome?.trim();
    const email = session?.email?.trim();
    if (!nome && !email) {
      return NextResponse.json({ notifications: [] });
    }

    const where: { projectId: string; OR?: any[] } = { projectId };
    const or: any[] = [];
    if (nome) or.push({ targetNome: nome });
    if (email) or.push({ targetEmail: email });
    if (or.length) where.OR = or;

    const list = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      notifications: list.map((n) => ({
        id: n.id,
        mensagem: n.mensagem,
        link: n.link,
        lida: n.lida,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Falha ao carregar notificações' }, { status: 500 });
  }
}
