import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { COOKIE_NAME, verifyPassword } from '@/lib/auth';
import { generateTotpSecret, generateTotpUri, generateQrCodeDataUrl, generateRecoveryCodes } from '@/lib/totp';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get(COOKIE_NAME)?.value;

    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: 'Current password is required to initialize 2FA setup.' }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin account not found.' }, { status: 404 });
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(password, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 400 });
    }

    // Generate new secret & URI
    const secret = generateTotpSecret();
    const uri = generateTotpUri(admin.email, secret, 'WearOMNIA Admin');
    const qrCodeDataUrl = await generateQrCodeDataUrl(uri);
    const recoveryCodes = generateRecoveryCodes(8);

    return NextResponse.json({
      success: true,
      secret,
      qrCodeDataUrl,
      otpauthUri: uri,
      recoveryCodes,
    });
  } catch (error: any) {
    console.error('[2FA Setup Error]', error);
    return NextResponse.json({ error: 'Failed to initiate 2FA setup.' }, { status: 500 });
  }
}
