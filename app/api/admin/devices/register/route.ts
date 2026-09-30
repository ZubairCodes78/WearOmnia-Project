import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession, getAdminSessionId } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const isAuthed = await verifyAdminSession(req);
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = await getAdminSessionId(req);
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { fcmToken, deviceType, deviceName, deviceId } = body;

    if (!fcmToken || typeof fcmToken !== 'string') {
      return NextResponse.json({ error: 'Valid FCM token is required' }, { status: 400 });
    }

    const cleanToken = fcmToken.trim();

    // If deviceId is provided, deactivate any other tokens previously registered to this same device instance
    if (deviceId) {
      await prisma.adminDevice.updateMany({
        where: {
          deviceId,
          fcmToken: { not: cleanToken },
        },
        data: { isActive: false },
      }).catch(() => null);
    }

    // Upsert the device token
    const device = await prisma.adminDevice.upsert({
      where: { fcmToken: cleanToken },
      update: {
        adminId,
        deviceType: deviceType || 'android',
        deviceName: deviceName || 'Admin Mobile Device',
        deviceId: deviceId || null,
        isActive: true,
        lastUsedAt: new Date(),
      },
      create: {
        adminId,
        fcmToken: cleanToken,
        deviceType: deviceType || 'android',
        deviceName: deviceName || 'Admin Mobile Device',
        deviceId: deviceId || null,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      deviceId: device.id,
      message: 'FCM device token registered successfully',
    });
  } catch (error: any) {
    console.error('[Device Register Error]', error);
    return NextResponse.json({ error: 'Failed to register device' }, { status: 500 });
  }
}
