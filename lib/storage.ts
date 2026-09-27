import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'image/heif': '.heif',
};

const MAX_PROOF_SIZE = 5 * 1024 * 1024; // 5MB
const PROOF_STORAGE_DIR = path.join(process.cwd(), 'uploads', 'payment-proofs');
const QR_STORAGE_DIR = path.join(process.cwd(), 'uploads', 'qr-codes');

async function ensureDir(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    // Ignore if already exists
  }
}

/**
 * Validates and saves an uploaded payment proof image.
 * Returns the unique stored filename (uuid.ext) to associate with order.
 */
export async function savePaymentProof(
  buffer: Buffer,
  mimeType: string
): Promise<{ success: boolean; filename?: string; error?: string }> {
  if (buffer.length > MAX_PROOF_SIZE) {
    return { success: false, error: 'File size exceeds maximum allowed limit of 5MB.' };
  }

  const extension = ALLOWED_MIME_TYPES[mimeType.toLowerCase()];
  if (!extension) {
    return { success: false, error: 'Invalid file format. Only JPEG, PNG, and WebP images are allowed.' };
  }

  await ensureDir(PROOF_STORAGE_DIR);

  const uuid = crypto.randomUUID();
  const filename = `proof_${uuid}${extension}`;
  const filePath = path.join(PROOF_STORAGE_DIR, filename);

  await fs.writeFile(filePath, buffer);
  return { success: true, filename };
}

/**
 * Safely resolves the absolute path to a payment proof file.
 * Prevents directory traversal attacks.
 */
export function getPaymentProofPath(filename: string): string {
  const safeFilename = path.basename(filename);
  return path.join(PROOF_STORAGE_DIR, safeFilename);
}

/**
 * Checks if a payment proof exists
 */
export async function paymentProofExists(filename: string): Promise<boolean> {
  try {
    const filePath = getPaymentProofPath(filename);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates and saves a payment method QR code image.
 */
export async function saveQrCode(
  buffer: Buffer,
  mimeType: string
): Promise<{ success: boolean; filename?: string; error?: string }> {
  if (buffer.length > MAX_PROOF_SIZE) {
    return { success: false, error: 'QR Code image exceeds 5MB limit.' };
  }

  const extension = ALLOWED_MIME_TYPES[mimeType.toLowerCase()];
  if (!extension) {
    return { success: false, error: 'Invalid format. Allowed: JPEG, PNG, WebP.' };
  }

  await ensureDir(QR_STORAGE_DIR);

  const uuid = crypto.randomUUID();
  const filename = `qr_${uuid}${extension}`;
  const filePath = path.join(QR_STORAGE_DIR, filename);

  await fs.writeFile(filePath, buffer);
  return { success: true, filename };
}

/**
 * Safely resolves the absolute path to a QR code file.
 */
export function getQrCodePath(filename: string): string {
  const safeFilename = path.basename(filename);
  return path.join(QR_STORAGE_DIR, safeFilename);
}

const PRODUCT_IMAGES_DIR = path.join(process.cwd(), 'public', 'uploads', 'products');

/**
 * Validates and saves a product image uploaded directly from Admin device.
 * Supports Cloudinary if configured in environment, with automatic fallback to public/uploads/products.
 */
export async function saveProductImage(
  buffer: Buffer,
  mimeType: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (buffer.length > 10 * 1024 * 1024) {
    return { success: false, error: 'Product image exceeds maximum allowed limit of 10MB.' };
  }

  const extension = ALLOWED_MIME_TYPES[mimeType.toLowerCase()];
  if (!extension) {
    return {
      success: false,
      error: 'Unsupported image format. Allowed formats: JPEG, JPG, PNG, WebP.',
    };
  }

  // 1. Cloudinary upload if server credentials exist
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    try {
      const timestamp = Math.round(Date.now() / 1000);
      const signaturePayload = `folder=wearomnia/products&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

      const formData = new FormData();
      formData.append('file', `data:${mimeType};base64,${buffer.toString('base64')}`);
      formData.append('api_key', apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);
      formData.append('folder', 'wearomnia/products');

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        if (uploadData.secure_url) {
          return { success: true, url: uploadData.secure_url };
        }
      }
    } catch (e) {
      console.warn('[Cloudinary Product Upload Warning] Falling back to local storage:', e);
    }
  }

  // 2. High-performance local storage in public/uploads/products/
  await ensureDir(PRODUCT_IMAGES_DIR);

  const uuid = crypto.randomUUID();
  const filename = `prod_${uuid}${extension}`;
  const filePath = path.join(PRODUCT_IMAGES_DIR, filename);

  await fs.writeFile(filePath, buffer);
  return { success: true, url: `/uploads/products/${filename}` };
}
