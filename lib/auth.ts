import { cookies, headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from './prisma';

const COOKIE_NAME = 'wearomnia_admin_session';
const CHALLENGE_COOKIE_NAME = 'wearomnia_2fa_challenge';
const SALT_ROUNDS = 12;
const CHALLENGE_EXPIRY_SECONDS = 5 * 60; // 5 minutes

function getSigningSecret(): string {
  return process.env.SESSION_SECRET || process.env.DATABASE_URL || 'wearomnia_super_secret_auth_signing_key_2026';
}

export async function getAdminSessionId(req?: Request): Promise<string | null> {
  try {
    let token: string | undefined;

    // 1. Check cookies first
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    } catch {
      // Not in request/cookie context
    }

    // 2. Check req if provided
    if (!token && req) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      } else {
        token = req.headers.get('x-admin-token') || undefined;
      }
    }

    // 3. Check next/headers headerStore
    if (!token) {
      try {
        const headerStore = await headers();
        const authHeader = headerStore.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
          token = authHeader.substring(7).trim();
        } else {
          token = headerStore.get('x-admin-token') || undefined;
        }
      } catch {
        // Ignore
      }
    }

    return token || null;
  } catch {
    return null;
  }
}

export async function verifyAdminSessionWithDevice(req?: Request): Promise<{ authorized: boolean; adminId?: string; isRevoked?: boolean }> {
  try {
    const token = await getAdminSessionId(req);
    if (!token) return { authorized: false };

    // Verify the session token contains a valid admin ID
    const admin = await prisma.admin.findUnique({
      where: { id: token },
    });

    if (!admin) return { authorized: false };

    // Extract device ID if present from request or headerStore
    let deviceId: string | null = null;
    if (req) {
      deviceId = req.headers.get('x-device-id');
    }
    if (!deviceId) {
      try {
        const headerStore = await headers();
        deviceId = headerStore.get('x-device-id');
      } catch {
        // Ignore outside header store
      }
    }

    if (deviceId) {
      const device = await prisma.adminDevice.findFirst({
        where: { deviceId, adminId: admin.id },
      });

      if (device && !device.isActive) {
        return { authorized: false, adminId: admin.id, isRevoked: true };
      }

      if (device && device.isActive) {
        // Asynchronously update lastUsedAt
        prisma.adminDevice.update({
          where: { id: device.id },
          data: { lastUsedAt: new Date() },
        }).catch(() => null);
      }
    }

    return { authorized: true, adminId: admin.id };
  } catch (e) {
    return { authorized: false };
  }
}

export async function verifyAdminSession(req?: Request): Promise<boolean> {
  const result = await verifyAdminSessionWithDevice(req);
  return result.authorized;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createAdminSession(adminId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: adminId,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(CHALLENGE_COOKIE_NAME);
}

/**
 * Creates a signed, short-lived (5-minute) 2FA challenge cookie & token.
 * Does NOT grant access to any admin dashboard or protected endpoints.
 */
export async function create2FAChallenge(adminId: string): Promise<string> {
  const expiresAt = Date.now() + CHALLENGE_EXPIRY_SECONDS * 1000;
  const payload = `${adminId}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', getSigningSecret()).update(payload).digest('hex');
  const challengeValue = `${payload}:${hmac}`;

  try {
    const cookieStore = await cookies();
    cookieStore.set({
      name: CHALLENGE_COOKIE_NAME,
      value: challengeValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: CHALLENGE_EXPIRY_SECONDS,
    });
  } catch {
    // Non-cookie context
  }

  return challengeValue;
}

/**
 * Validates the 2FA challenge cookie or provided token and returns the verified adminId if valid.
 */
export async function verify2FAChallenge(challengeOverride?: string): Promise<string | null> {
  try {
    let challenge = challengeOverride;

    if (!challenge) {
      try {
        const cookieStore = await cookies();
        challenge = cookieStore.get(CHALLENGE_COOKIE_NAME)?.value;
      } catch {
        // Ignore
      }
    }

    if (!challenge) {
      try {
        const headerStore = await headers();
        challenge = headerStore.get('x-2fa-challenge') || undefined;
      } catch {
        // Ignore
      }
    }

    if (!challenge) return null;

    const parts = challenge.split(':');
    if (parts.length !== 3) return null;

    const [adminId, expiresAtStr, hmac] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return null;
    }

    const payload = `${adminId}:${expiresAtStr}`;
    const expectedHmac = crypto.createHmac('sha256', getSigningSecret()).update(payload).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
      return null;
    }

    return adminId;
  } catch {
    return null;
  }
}

/**
 * Clears the 2FA challenge cookie upon completion or failure.
 */
export async function clear2FAChallenge(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CHALLENGE_COOKIE_NAME);
}

/**
 * Retrieves sanitized admin data (never returns secret, password, or recovery codes).
 */
export async function getAdminById(adminId: string) {
  return prisma.admin.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      email: true,
      name: true,
      twoFactorEnabled: true,
      twoFactorEnabledAt: true,
      createdAt: true,
    },
  });
}

export { COOKIE_NAME, CHALLENGE_COOKIE_NAME };
