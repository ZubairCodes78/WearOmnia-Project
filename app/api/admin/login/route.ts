import { NextResponse } from 'next/server';
import { verifyPassword, createAdminSession, getAdminById } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';
import { checkLoginRateLimit, recordFailedLoginAttempt, recordSuccessfulLogin } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      await recordAuditLog('FAILED_LOGIN_ATTEMPT', 'AdminAuth', undefined, 'Missing credentials');
      return NextResponse.json({ error: 'Invalid login details' }, { status: 401 });
    }

    // Rate limiting check
    const identifier = email.toLowerCase();
    const rateLimitCheck = checkLoginRateLimit(identifier);
    
    if (!rateLimitCheck.allowed) {
      const lockoutMinutes = Math.ceil((rateLimitCheck.lockoutTime! - Date.now()) / 60000);
      await recordAuditLog('LOGIN_RATE_LIMITED', 'AdminAuth', undefined, `Too many attempts for ${identifier}`);
      return NextResponse.json({ 
        error: 'Too many login attempts. Please try again later.',
        lockoutMinutes 
      }, { status: 429 });
    }

    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email: identifier }
    });

    if (!admin) {
      recordFailedLoginAttempt(identifier);
      await recordAuditLog('FAILED_LOGIN_ATTEMPT', 'AdminAuth', undefined, 'Admin not found');
      return NextResponse.json({ error: 'Invalid login details' }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, admin.password);
    if (!isValidPassword) {
      recordFailedLoginAttempt(identifier);
      await recordAuditLog('FAILED_LOGIN_ATTEMPT', 'AdminAuth', admin.id, 'Invalid password');
      return NextResponse.json({ error: 'Invalid login details' }, { status: 401 });
    }

    // Successful login - clear rate limit
    recordSuccessfulLogin(identifier);
    await recordAuditLog('SUCCESSFUL_LOGIN', 'AdminAuth', admin.id, 'Admin logged in successfully');

    // Create session
    await createAdminSession(admin.id);

    const adminData = await getAdminById(admin.id);

    return NextResponse.json({ 
      success: true, 
      admin: adminData 
    });
  } catch (error) {
    console.error('Login error:', error);
    await recordAuditLog('LOGIN_ERROR', 'AdminAuth', undefined, 'Login system error');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
