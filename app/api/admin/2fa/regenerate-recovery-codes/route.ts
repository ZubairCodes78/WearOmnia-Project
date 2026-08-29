import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { COOKIE_NAME, verifyPassword } from '@/lib/auth';
import { verifyTotpCode, generateRecoveryCodes, hashRecoveryCodes } from '@/lib/totp';
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
      return NextResponse.json({ error: 'Current password and 6-digit 2FA code are required.' }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin || !admin.twoFactorEnabled || !admin.twoFactorSecret) {
      return NextResponse.json({ error: '2FA is not enabled on this account.' }, { status: 400 });
    }

    // 1. Verify password
    const isPasswordValid = await verifyPassword(password, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 400 });
    }

    // 2. Verify TOTP code
    const isCodeValid = verifyTotpCode(code, admin.twoFactorSecret, 1);
    if (!isCodeValid) {
      return NextResponse.json({ error: 'Invalid 6-digit verification code.' }, { status: 400 });
    }

    // 3. Generate new recovery codes & hash them
    const newRecoveryCodes = generateRecoveryCodes(8);
    const hashedCodes = await hashRecoveryCodes(newRecoveryCodes);

    await prisma.admin.update({
      where: { id: adminId },
      data: {
        twoFactorRecoveryCodes: JSON.stringify(hashedCodes),
      },
    });

    await recordAuditLog(
      'RECOVERY_CODES_REGENERATED',
      'AdminAuth',
      adminId,
      `New 2FA recovery codes generated for ${admin.email}. Previous codes invalidated.`
    );

    return NextResponse.json({
      success: true,
      recoveryCodes: newRecoveryCodes,
      message: 'New recovery codes generated successfully. Please store them securely.',
    });
  } catch (error: any) {
    console.error('[2FA Regenerate Recovery Codes Error]', error);
    return NextResponse.json({ error: 'Failed to regenerate recovery codes.' }, { status: 500 });
  }
}
