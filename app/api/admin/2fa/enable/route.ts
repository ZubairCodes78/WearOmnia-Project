import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { COOKIE_NAME } from '@/lib/auth';
import { verifyTotpCode, hashRecoveryCodes } from '@/lib/totp';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get(COOKIE_NAME)?.value;

    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const { secret, code, recoveryCodes } = await req.json();

    if (!secret || !code || !recoveryCodes || !Array.isArray(recoveryCodes)) {
      return NextResponse.json({ error: 'Missing 2FA verification parameters.' }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin account not found.' }, { status: 404 });
    }

    // Verify 6-digit TOTP code against the secret
    const isCodeValid = verifyTotpCode(code, secret, 1);
    if (!isCodeValid) {
      return NextResponse.json({ error: 'Invalid 6-digit verification code. Please check your authenticator app.' }, { status: 400 });
    }

    // Hash the recovery codes before database storage
    const hashedCodes = await hashRecoveryCodes(recoveryCodes);

    // Enable 2FA on the admin account
    const updated = await prisma.admin.update({
      where: { id: adminId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorRecoveryCodes: JSON.stringify(hashedCodes),
        twoFactorEnabledAt: new Date(),
      },
    });

    await recordAuditLog(
      '2FA_ENABLED',
      'AdminAuth',
      adminId,
      `Two-Factor Authentication (TOTP) successfully enabled for ${admin.email}.`
    );

    return NextResponse.json({
      success: true,
      message: 'Two-Factor Authentication enabled successfully!',
      twoFactorEnabled: updated.twoFactorEnabled,
      twoFactorEnabledAt: updated.twoFactorEnabledAt,
    });
  } catch (error: any) {
    console.error('[2FA Enable Error]', error);
    return NextResponse.json({ error: 'Failed to enable Two-Factor Authentication.' }, { status: 500 });
  }
}
