import { NextResponse } from 'next/server';
import { verifyPassword, createAdminSession, getAdminById } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
    const { email, password } = await req.json();

    if (!email || !password) {
      await recordAuditLog('FAILED_LOGIN_ATTEMPT', 'AdminAuth', undefined, 'Missing credentials', clientIp);
      return NextResponse.json({ error: 'Invalid login details' }, { status: 401 });
    }

    const identifier = email.toLowerCase().trim();

    // 1. Rate limiting check (Serverless-safe & database-persisted)
    const rateLimitCheck = await checkLoginRateLimit(identifier, clientIp);
    
    if (!rateLimitCheck.allowed) {
      const lockoutMinutes = rateLimitCheck.lockoutMinutes || 15;
      await recordAuditLog('LOGIN_RATE_LIMITED', 'AdminAuth', undefined, `Too many attempts for ${identifier}`, clientIp);
      return NextResponse.json({ 
        error: `Too many login attempts. Please try again in ${lockoutMinutes} minute${lockoutMinutes > 1 ? 's' : ''}.`,
        lockoutMinutes 
      }, { status: 429 });
    }

    // 2. Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email: identifier }
    });

    if (!admin) {
      await recordAuditLog('FAILED_LOGIN_ATTEMPT', 'AdminAuth', undefined, `Admin not found: ${identifier}`, clientIp);
      return NextResponse.json({ error: 'Invalid login details' }, { status: 401 });
    }

    // 3. Verify password
    const isValidPassword = await verifyPassword(password, admin.password);
    if (!isValidPassword) {
      await recordAuditLog('FAILED_LOGIN_ATTEMPT', 'AdminAuth', admin.id, `Invalid password for ${identifier}`, clientIp);
      return NextResponse.json({ error: 'Invalid login details' }, { status: 401 });
    }

    // 4. Successful login - clear rate limit & log success
    await recordSuccessfulLogin(identifier, admin.id);
    await recordAuditLog('SUCCESSFUL_LOGIN', 'AdminAuth', admin.id, 'Admin logged in successfully', clientIp);

    // 5. Create session
    await createAdminSession(admin.id);

    const adminData = await getAdminById(admin.id);

    return NextResponse.json({ 
      success: true, 
      admin: adminData 
    });
  } catch (error) {
    console.error('Login error:', error);
    await recordAuditLog('LOGIN_ERROR', 'AdminAuth', undefined, 'Login system error', clientIp);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
