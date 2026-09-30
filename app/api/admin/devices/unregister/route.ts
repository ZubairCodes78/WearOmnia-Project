import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const isAuthed = await verifyAdminSession(req);
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { fcmToken } = body;

    if (!fcmToken || typeof fcmToken !== 'string') {
      return NextResponse.json({ error: 'Valid FCM token is required' }, { status: 400 });
    }

    await prisma.adminDevice.updateMany({
      where: { fcmToken: fcmToken.trim() },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'FCM device token unregistered successfully',
    });
  } catch (error: any) {
    console.error('[Device Unregister Error]', error);
    return NextResponse.json({ error: 'Failed to unregister device' }, { status: 500 });
  }
}
