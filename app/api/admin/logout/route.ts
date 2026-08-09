import { NextResponse } from 'next/server';
import { destroyAdminSession, verifyAdminSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    
    if (isAuthenticated) {
      await recordAuditLog('ADMIN_LOGOUT', 'AdminAuth', undefined, 'Admin logged out');
    }

    await destroyAdminSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}