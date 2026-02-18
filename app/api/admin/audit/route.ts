import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';
import { serverLogger } from '@/lib/logger';
import { getClientErrorMessage } from '@/lib/api-error';

/** Lista registros de auditoria (admin). */
export async function GET(request: NextRequest) {
  const [session, err] = await requireAdmin(request);
  if (err) return err;

  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/56aa2456-555e-4a18-938a-fda027b38124',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/admin/audit/route.ts:GET',message:'before prisma.auditLog.findMany',data:{hasSession:!!session,userId:session?.userId},timestamp:Date.now(),hypothesisId:'H1,H2'})}).catch(()=>{});
    // #endregion
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);
    const offset = Number(searchParams.get('offset')) || 0;

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
    const total = await prisma.auditLog.count();
    return NextResponse.json({ logs, total });
  } catch (error) {
    // #region agent log
    const errObj = error instanceof Error ? { name: error.name, message: error.message, stack: (error.stack||'').slice(0,500) } : { raw: String(error) };
    fetch('http://127.0.0.1:7242/ingest/56aa2456-555e-4a18-938a-fda027b38124',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/admin/audit/route.ts:GET:catch',message:'Error listing audit logs',data:{error:errObj,userId:session?.userId},timestamp:Date.now(),hypothesisId:'H1,H2,H3'})}).catch(()=>{});
    // #endregion
    serverLogger.error('Error listing audit logs', error, { route: '/api/admin/audit', method: 'GET', userId: session!.userId });
    return NextResponse.json(getClientErrorMessage('Erro ao listar auditoria', error), { status: 500 });
  }
}
