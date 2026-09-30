import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { sendAdminPushNotification } from '@/lib/notifications/fcm';

export async function POST(req: Request) {
  try {
    const isAuthed = await verifyAdminSession(req);
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { title, body: msgBody, orderId } = body;

    const result = await sendAdminPushNotification({
      type: 'TEST_NOTIFICATION',
      title: title || '⚡ WearOMNIA Test Push Notification',
      body: msgBody || 'This is a test notification from the WearOMNIA backend to verify FCM connectivity.',
      orderId: orderId || undefined,
      data: {
        timestamp: new Date().toISOString(),
        isTest: 'true',
      },
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('[Test Push Error]', error);
    return NextResponse.json({ error: 'Failed to send test push notification' }, { status: 500 });
  }
}
