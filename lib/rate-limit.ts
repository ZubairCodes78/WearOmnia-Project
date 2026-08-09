// Simple in-memory rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

export function checkLoginRateLimit(identifier: string): { allowed: boolean; remainingAttempts: number; lockoutTime?: number } {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if lockout period has expired
  if (now > record.resetTime) {
    loginAttempts.delete(identifier);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if currently locked out
  if (record.count >= MAX_ATTEMPTS) {
    return { 
      allowed: false, 
      remainingAttempts: 0, 
      lockoutTime: record.resetTime 
    };
  }

  return { 
    allowed: true, 
    remainingAttempts: MAX_ATTEMPTS - record.count 
  };
}

export function recordFailedLoginAttempt(identifier: string): void {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record) {
    loginAttempts.set(identifier, { count: 1, resetTime: now + LOCKOUT_TIME });
  } else {
    record.count++;
    // Reset time updates with each failed attempt to prevent indefinite lockout
    record.resetTime = now + LOCKOUT_TIME;
  }
}

export function recordSuccessfulLogin(identifier: string): void {
  loginAttempts.delete(identifier);
}

export function getLockoutTime(identifier: string): number | null {
  const record = loginAttempts.get(identifier);
  if (record && record.count >= MAX_ATTEMPTS) {
    return record.resetTime;
  }
  return null;
}