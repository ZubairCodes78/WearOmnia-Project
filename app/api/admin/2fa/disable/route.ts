import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { COOKIE_NAME, verifyPassword } from '@/lib/auth';
import { verifyTotpCode } from '@/lib/totp';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get(COOKIE_NAME)?.value;

    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const { password, code } = await req.json();

    if (!password || !code) {
      return NextResponse.json({ error: 'Both current password and 6-digit 2FA code are required to disable 2FA.' }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin account not found.' }, { status: 404 });
    }

    // 1. Verify password
    const isPasswordValid = await verifyPassword(password, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 400 });
    }

    // 2. Verify TOTP code
    if (!admin.twoFactorSecret) {
      return NextResponse.json({ error: '2FA secret not found on account.' }, { status: 400 });
    }

    const isCodeValid = verifyTotpCode(code, admin.twoFactorSecret, 1);
    if (!isCodeValid) {
      return NextResponse.json({ error: 'Invalid 6-digit verification code.' }, { status: 400 });
    }

    // 3. Disable 2FA & purge secrets
    const updated = await prisma.admin.update({
      where: { id: adminId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorRecoveryCodes: null,
        twoFactorEnabledAt: null,
      },
    });

    await recordAuditLog(
      '2FA_DISABLED',
      'AdminAuth',
      adminId,
      `Two-Factor Authentication disabled for ${admin.email}.`
    );

    return NextResponse.json({
      success: true,
      message: 'Two-Factor Authentication has been disabled.',
      twoFactorEnabled: updated.twoFactorEnabled,
    });
  } catch (error: any) {
    console.error('[2FA Disable Error]', error);
    return NextResponse.json({ error: 'Failed to disable Two-Factor Authentication.' }, { status: 500 });
  }
}
