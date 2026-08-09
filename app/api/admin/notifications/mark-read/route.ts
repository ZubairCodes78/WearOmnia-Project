import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';

export async function POST(req: Request) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (body.all) {
      await prisma.adminNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
    } else if (body.id) {
      await prisma.adminNotification.update({
        where: { id: body.id },
        data: { isRead: true },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to mark read:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
