import { prisma } from './prisma';

const MAX_ACCOUNT_ATTEMPTS = 5;
const MAX_IP_ATTEMPTS = 20; // IP-level brute-force threshold
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  lockoutTime?: number;
  lockoutMinutes?: number;
}

/**
 * Check login rate limits for both IP and Email identifier.
 * Works seamlessly in serverless/Vercel environments using Postgres/Prisma persistence.
 */
export async function checkLoginRateLimit(
  email: string,
  ipAddress: string = '127.0.0.1'
): Promise<RateLimitResult> {
  try {
    const identifier = email.toLowerCase().trim();
    const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MS);

    // 1. IP-level brute force protection (prevents bot spray)
    if (ipAddress && ipAddress !== '127.0.0.1' && ipAddress !== '::1') {
      const ipFailures = await prisma.auditLog.count({
        where: {
          entity: 'AdminAuth',
          action: 'FAILED_LOGIN_ATTEMPT',
          ipAddress: ipAddress,
          createdAt: { gte: windowStart },
        },
      });

      if (ipFailures >= MAX_IP_ATTEMPTS) {
        return {
          allowed: false,
          remainingAttempts: 0,
          lockoutTime: Date.now() + LOCKOUT_WINDOW_MS,
          lockoutMinutes: 15,
        };
      }
    }

    // 2. Account-level protection
    // Check if the admin exists and determine the valid reference timestamp
    const admin = await prisma.admin.findUnique({
      where: { email: identifier },
      select: { id: true, updatedAt: true },
    });

    let latestValidTime = windowStart;

    if (admin) {
      // If admin was updated (e.g. password reset script or change-password), ignore failures before update
      if (admin.updatedAt && admin.updatedAt > latestValidTime) {
        latestValidTime = admin.updatedAt;
      }

      // Check last successful login to avoid counting attempts before previous successful session
      const lastSuccess = await prisma.auditLog.findFirst({
        where: {
          entity: 'AdminAuth',
          action: 'SUCCESSFUL_LOGIN',
          entityId: admin.id,
          createdAt: { gte: latestValidTime },
        },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });

      if (lastSuccess && lastSuccess.createdAt > latestValidTime) {
        latestValidTime = lastSuccess.createdAt;
      }
    }

    // Query recent failed attempts for this identifier since latestValidTime
    const failures = await prisma.auditLog.findMany({
      where: {
        entity: 'AdminAuth',
        action: 'FAILED_LOGIN_ATTEMPT',
        createdAt: { gte: latestValidTime },
        OR: [
          admin ? { entityId: admin.id } : { details: { contains: identifier } },
          { details: { contains: identifier } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    const failedCount = failures.length;

    if (failedCount >= MAX_ACCOUNT_ATTEMPTS) {
      const oldestRelevantFailure = failures[failures.length - 1];
      const expiryTime = oldestRelevantFailure.createdAt.getTime() + LOCKOUT_WINDOW_MS;
      const remainingMs = Math.max(0, expiryTime - Date.now());
      const lockoutMinutes = Math.max(1, Math.ceil(remainingMs / 60000));

      if (remainingMs > 0) {
        return {
          allowed: false,
          remainingAttempts: 0,
          lockoutTime: expiryTime,
          lockoutMinutes,
        };
      }
    }

    return {
      allowed: true,
      remainingAttempts: Math.max(0, MAX_ACCOUNT_ATTEMPTS - failedCount),
    };
  } catch (error) {
    // Fail-open gracefully on unexpected DB read errors so legit admins are never hard-blocked
    console.warn('[RateLimit] Database rate-limit check failed, allowing request:', error);
    return { allowed: true, remainingAttempts: MAX_ACCOUNT_ATTEMPTS };
  }
}

/**
 * Clears failed login attempts for a specific account or IP.
 */
export async function clearFailedLoginAttempts(
  email: string,
  adminId?: string
): Promise<void> {
  try {
    const identifier = email.toLowerCase().trim();
    await prisma.auditLog.deleteMany({
      where: {
        entity: 'AdminAuth',
        action: 'FAILED_LOGIN_ATTEMPT',
        OR: [
          adminId ? { entityId: adminId } : { details: { contains: identifier } },
          { details: { contains: identifier } },
        ],
      },
    });
  } catch (e) {
    // Non-critical, ignore if fails
  }
}

export async function recordSuccessfulLogin(
  email: string,
  adminId?: string
): Promise<void> {
  await clearFailedLoginAttempts(email, adminId);
}

export async function recordFailedLoginAttempt(
  identifier: string,
  adminId?: string
): Promise<void> {
  // Handled directly via recordAuditLog in login route
}