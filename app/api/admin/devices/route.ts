import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSessionWithDevice } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET: List all devices registered for this admin.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminSessionWithDevice(req);
    if (!auth.authorized || !auth.adminId) {
      if (auth.isRevoked) {
        return NextResponse.json({ error: 'DEVICE_REVOKED', message: 'Device has been revoked.' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const devices = await prisma.adminDevice.findMany({
      where: { adminId: auth.adminId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        deviceName: true,
        deviceType: true,
        deviceId: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ devices });
  } catch (error: any) {
    console.error('Error fetching admin devices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST: Revoke a specific admin device.
 * Payload: { deviceId?: string; id?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminSessionWithDevice(req);
    if (!auth.authorized || !auth.adminId) {
      if (auth.isRevoked) {
        return NextResponse.json({ error: 'DEVICE_REVOKED', message: 'Device has been revoked.' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { deviceId, id } = body;

    if (!deviceId && !id) {
      return NextResponse.json({ error: 'Either deviceId or id is required' }, { status: 400 });
    }

    const updated = await prisma.adminDevice.updateMany({
      where: {
        adminId: auth.adminId,
        ...(id ? { id } : { deviceId }),
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Device revoked successfully',
      revokedCount: updated.count,
    });
  } catch (error: any) {
    console.error('Error revoking admin device:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
