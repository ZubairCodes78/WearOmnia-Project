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

export const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.VERCEL_ENV
);

/**
 * Shared helper to upload an image buffer to Cloudinary using their REST API.
 */
async function uploadToCloudinary(
  buffer: Buffer,
  mimeType: string,
  folder: string,
  extension: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    return {
      success: false,
      error: 'Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing.',
    };
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const signaturePayload = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

    const formData = new FormData();
    formData.append('file', `data:${mimeType};base64,${buffer.toString('base64')}`);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('folder', folder);

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const responseText = await uploadRes.text();
    let data: any = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      // Ignore parse error
    }

    if (!uploadRes.ok) {
      const errorMsg = data?.error?.message || responseText || `Status ${uploadRes.status}`;
      return { success: false, error: `Cloudinary error: ${errorMsg}` };
    }

    if (data.secure_url) {
      return { success: true, url: data.secure_url };
    }

    return { success: false, error: 'Cloudinary response did not contain secure_url.' };
  } catch (err: any) {
    return { success: false, error: `Cloudinary upload error: ${err?.message || 'Connection failed'}` };
  }
}

/**
 * Validates and saves an uploaded payment proof image.
 * Returns the unique stored filename or remote URL to associate with order.
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

  const hasCloudinary = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  if (hasCloudinary) {
    const cloudRes = await uploadToCloudinary(buffer, mimeType, 'wearomnia/payment-proofs', extension);
    if (cloudRes.success && cloudRes.url) {
      return { success: true, filename: cloudRes.url };
    }
    if (isServerless) {
      return { success: false, error: cloudRes.error || 'Failed to upload payment proof to Cloudinary' };
    }
    console.warn('[Cloudinary Warning] Payment proof upload failed locally, falling back to disk:', cloudRes.error);
  } else if (isServerless) {
    return {
      success: false,
      error: 'Cloud storage is required in production/Vercel. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your Vercel Project Settings.',
    };
  }

  try {
    await ensureDir(PROOF_STORAGE_DIR);
    const uuid = crypto.randomUUID();
    const filename = `proof_${uuid}${extension}`;
    const filePath = path.join(PROOF_STORAGE_DIR, filename);

    await fs.writeFile(filePath, buffer);
    return { success: true, filename };
  } catch (err: any) {
    return { success: false, error: `Failed to save payment proof: ${err?.message}` };
  }
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
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return true;
  }
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

  const hasCloudinary = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  if (hasCloudinary) {
    const cloudRes = await uploadToCloudinary(buffer, mimeType, 'wearomnia/qr-codes', extension);
    if (cloudRes.success && cloudRes.url) {
      return { success: true, filename: cloudRes.url };
    }
    if (isServerless) {
      return { success: false, error: cloudRes.error || 'Failed to upload QR code to Cloudinary' };
    }
  } else if (isServerless) {
    return {
      success: false,
      error: 'Cloud storage is required in production/Vercel. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your Vercel Project Settings.',
    };
  }

  try {
    await ensureDir(QR_STORAGE_DIR);
    const uuid = crypto.randomUUID();
    const filename = `qr_${uuid}${extension}`;
    const filePath = path.join(QR_STORAGE_DIR, filename);

    await fs.writeFile(filePath, buffer);
    return { success: true, filename };
  } catch (err: any) {
    return { success: false, error: `Failed to save QR code: ${err?.message}` };
  }
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
 * Supports Cloudinary for production/serverless, with local storage for development.
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
  const hasCloudinary = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  if (hasCloudinary) {
    const cloudRes = await uploadToCloudinary(buffer, mimeType, 'wearomnia/products', extension);
    if (cloudRes.success && cloudRes.url) {
      return { success: true, url: cloudRes.url };
    }
    
    // In serverless, do NOT fall back to local disk because filesystem is read-only
    if (isServerless) {
      return {
        success: false,
        error: `Cloudinary upload failed: ${cloudRes.error}`,
      };
    }
    console.warn('[Cloudinary Warning] Upload failed in development, falling back to local disk:', cloudRes.error);
  } else if (isServerless) {
    // Running on Vercel/serverless without Cloudinary credentials configured
    return {
      success: false,
      error: 'Serverless deployment (Vercel) detected: Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your Vercel Project Settings > Environment Variables.',
    };
  }

  // 2. Local development storage in public/uploads/products/
  try {
    await ensureDir(PRODUCT_IMAGES_DIR);

    const uuid = crypto.randomUUID();
    const filename = `prod_${uuid}${extension}`;
    const filePath = path.join(PRODUCT_IMAGES_DIR, filename);

    await fs.writeFile(filePath, buffer);
    return { success: true, url: `/uploads/products/${filename}` };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to save product image locally: ${err?.message || 'Filesystem error'}`,
    };
  }
}
