import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a buffer to a standard RFC 4648 Base32 string.
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string into a Buffer.
 */
export function base32Decode(base32Str: string): Buffer {
  const cleanStr = base32Str.toUpperCase().replace(/=+$/, '').replace(/[\s-]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleanStr.length; i++) {
    const char = cleanStr[i];
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid base32 character: ${char}`);
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a cryptographically secure 20-byte Base32 TOTP secret.
 */
export function generateTotpSecret(): string {
  const randomBytes = crypto.randomBytes(20);
  return base32Encode(randomBytes);
}

/**
 * Computes a 6-digit TOTP code for a secret at a given counter step.
 * Implements standard RFC 6238 / RFC 4226 TOTP specification.
 */
export function generateTotpCode(secret: string, timeStepOffset: number = 0): string {
  const key = base32Decode(secret);
  const epochSeconds = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epochSeconds / 30) + timeStepOffset;

  // 8-byte big-endian counter buffer
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(timeStep), 0);

  // HMAC-SHA1 calculation
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  // Dynamic truncation
  const offset = digest[digest.length - 1] & 0x0f;
  const binaryCode =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binaryCode % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifies a 6-digit TOTP code against a secret with +/- window tolerance (30-second window).
 */
export function verifyTotpCode(code: string, secret: string, windowSteps: number = 1): boolean {
  if (!code || !secret) return false;
  const normalizedCode = code.trim().replace(/\s+/g, '');
  if (!/^\d{6}$/.test(normalizedCode)) return false;

  for (let offset = -windowSteps; offset <= windowSteps; offset++) {
    const expectedCode = generateTotpCode(secret, offset);
    if (crypto.timingSafeEqual(Buffer.from(normalizedCode), Buffer.from(expectedCode))) {
      return true;
    }
  }

  return false;
}

/**
 * Generates standard `otpauth://` URI for authenticator applications.
 */
export function generateTotpUri(
  email: string,
  secret: string,
  issuer: string = 'WearOMNIA Admin'
): string {
  const cleanEmail = encodeURIComponent(email.trim());
  const cleanIssuer = encodeURIComponent(issuer.trim());
  return `otpauth://totp/${cleanIssuer}:${cleanEmail}?secret=${secret}&issuer=${cleanIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generates high-resolution Data URL QR Code image for the setup modal.
 */
export async function generateQrCodeDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 280,
    color: {
      dark: '#0A2528',
      light: '#FAF8F5',
    },
  });
}

/**
 * Generates formatted, cryptographically random single-use recovery codes (e.g. `XXXX-XXXX`).
 */
export function generateRecoveryCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

/**
 * Bcrypt-hashes an array of recovery codes before persisting to the database.
 */
export async function hashRecoveryCodes(codes: string[]): Promise<string[]> {
  const hashed: string[] = [];
  for (const code of codes) {
    const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const hash = await bcrypt.hash(clean, 10);
    hashed.push(hash);
  }
  return hashed;
}

/**
 * Verifies if an input recovery code matches any stored hash, and consumes it.
 */
export async function verifyAndConsumeRecoveryCode(
  inputCode: string,
  hashedCodesJson: string | null
): Promise<{ valid: boolean; remainingHashedCodes: string[] }> {
  if (!inputCode || !hashedCodesJson) {
    return { valid: false, remainingHashedCodes: [] };
  }

  let hashedList: string[] = [];
  try {
    hashedList = JSON.parse(hashedCodesJson);
  } catch {
    return { valid: false, remainingHashedCodes: [] };
  }

  const cleanInput = inputCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleanInput) {
    return { valid: false, remainingHashedCodes: hashedList };
  }

  for (let i = 0; i < hashedList.length; i++) {
    const match = await bcrypt.compare(cleanInput, hashedList[i]);
    if (match) {
      // Consume the code by removing it from the list
      const remaining = [...hashedList.slice(0, i), ...hashedList.slice(i + 1)];
      return { valid: true, remainingHashedCodes: remaining };
    }
  }

  return { valid: false, remainingHashedCodes: hashedList };
}
