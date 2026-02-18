import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, nome, cargo, avatar } = body;

    if (!projectId || !nome || !cargo) {
      return NextResponse.json(
        { error: 'projectId, nome e cargo são obrigatórios' },
        { status: 400 }
      );
    }

    const teamMember = await prisma.teamMember.create({
      data: {
        projectId,
        nome,
        cargo,
        avatar,
      },
    });

    return NextResponse.json(teamMember);
  } catch (error) {
    serverLogger.error('Error creating team member', error, { route: '/api/team-members', method: 'POST' });
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nome, cargo, avatar } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const teamMember = await prisma.teamMember.update({
      where: { id },
      data: {
        nome,
        cargo,
        avatar,
      },
    });

    return NextResponse.json(teamMember);
  } catch (error) {
    serverLogger.error('Error updating team member', error, { route: '/api/team-members', method: 'PUT' });
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    await prisma.teamMember.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    serverLogger.error('Error deleting team member', error, { route: '/api/team-members', method: 'DELETE' });
    return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 });
  }
}
