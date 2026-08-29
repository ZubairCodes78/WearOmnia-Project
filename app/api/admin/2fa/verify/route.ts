import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verify2FAChallenge, clear2FAChallenge, createAdminSession, getAdminById } from '@/lib/auth';
import { verifyTotpCode, verifyAndConsumeRecoveryCode } from '@/lib/totp';
import { recordAuditLog } from '@/lib/audit';
import { checkLoginRateLimit, recordSuccessfulLogin } from '@/lib/rate-limit';

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

export async function POST(req: Request) {
  const clientIp = getClientIp(req);

  try {
    // 1. Verify that the temporary 2FA challenge is active and valid (5-minute window)
    const adminId = await verify2FAChallenge();
    if (!adminId) {
      return NextResponse.json({
        error: 'Your 2FA verification session has expired. Please log in with your password again.',
        expired: true,
      }, { status: 401 });
    }

    const { code, isRecoveryCode } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Please enter a valid 2FA verification code.' }, { status: 400 });
    }

    // 2. Fetch admin from database
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin || !admin.twoFactorEnabled) {
      await clear2FAChallenge();
      return NextResponse.json({ error: '2FA is not configured for this account.' }, { status: 400 });
    }

    // 3. Rate limiting check for TOTP verification guesses
    const rateLimitCheck = await checkLoginRateLimit(`2fa:${admin.email}`, clientIp);
    if (!rateLimitCheck.allowed) {
      const lockoutMinutes = rateLimitCheck.lockoutMinutes || 15;
      await recordAuditLog('2FA_RATE_LIMITED', 'AdminAuth', admin.id, `2FA rate limited for ${admin.email}`, clientIp);
      return NextResponse.json({
        error: `Too many failed 2FA verification attempts. Please try again in ${lockoutMinutes} minute${lockoutMinutes > 1 ? 's' : ''}.`,
        lockoutMinutes,
      }, { status: 429 });
    }

    const cleanCode = code.trim();

    // 4a. Handle Recovery Code flow
    if (isRecoveryCode || cleanCode.includes('-')) {
      const recoveryResult = await verifyAndConsumeRecoveryCode(cleanCode, admin.twoFactorRecoveryCodes);

      if (!recoveryResult.valid) {
        await recordAuditLog(
          'FAILED_LOGIN_ATTEMPT',
          'AdminAuth',
          admin.id,
          `Invalid recovery code used for ${admin.email}`,
          clientIp
        );
        return NextResponse.json({ error: 'Invalid recovery code. Please check and try again.' }, { status: 400 });
      }

      // Update database by removing the consumed recovery code
      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          twoFactorRecoveryCodes: JSON.stringify(recoveryResult.remainingHashedCodes),
        },
      });

      await recordAuditLog(
        'RECOVERY_CODE_USED',
        'AdminAuth',
        admin.id,
        `One-time recovery code consumed successfully for ${admin.email}. Remaining codes: ${recoveryResult.remainingHashedCodes.length}`,
        clientIp
      );

      // Create full authenticated session
      await clear2FAChallenge();
      await recordSuccessfulLogin(`2fa:${admin.email}`, admin.id);
      await createAdminSession(admin.id);

      const adminData = await getAdminById(admin.id);
      return NextResponse.json({
        success: true,
        admin: adminData,
        message: 'Authenticated via recovery code.',
        remainingRecoveryCodesCount: recoveryResult.remainingHashedCodes.length,
      });
    }

    // 4b. Handle standard 6-digit TOTP verification
    if (!admin.twoFactorSecret) {
      return NextResponse.json({ error: '2FA secret not found on account.' }, { status: 400 });
    }

    const isTotpValid = verifyTotpCode(cleanCode, admin.twoFactorSecret, 1);

    if (!isTotpValid) {
      await recordAuditLog(
        '2FA_VERIFICATION_FAILED',
        'AdminAuth',
        admin.id,
        `Invalid 6-digit TOTP code for ${admin.email}`,
        clientIp
      );
      return NextResponse.json({ error: 'Invalid 6-digit authentication code. Please check your authenticator app.' }, { status: 400 });
    }

    // 5. Successful 2FA Verification
    await clear2FAChallenge();
    await recordSuccessfulLogin(`2fa:${admin.email}`, admin.id);
    await createAdminSession(admin.id);

    await recordAuditLog(
      '2FA_VERIFICATION_SUCCESS',
      'AdminAuth',
      admin.id,
      `2FA TOTP authentication successful for ${admin.email}`,
      clientIp
    );

    const adminData = await getAdminById(admin.id);

    return NextResponse.json({
      success: true,
      admin: adminData,
    });
  } catch (error: any) {
    console.error('[2FA Verify Error]', error);
    return NextResponse.json({ error: 'Failed to verify 2FA code. Please try again.' }, { status: 500 });
  }
}
