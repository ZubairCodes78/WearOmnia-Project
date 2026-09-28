import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

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
const PRODUCT_IMAGES_DIR = path.join(process.cwd(), 'public', 'uploads', 'products');

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

// Cached S3Client instance for Cloudflare R2
let cachedR2Client: S3Client | null = null;

/**
 * Checks whether all required Cloudflare R2 environment variables are defined.
 */
export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL
  );
}

/**
 * Returns an instantiated S3Client configured for Cloudflare R2's S3-compatible API.
 */
export function getR2Client(): S3Client {
  if (cachedR2Client) {
    return cachedR2Client;
  }

  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Cloudflare R2 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) are missing.'
    );
  }

  cachedR2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return cachedR2Client;
}

/**
 * Generates the public accessible URL for a given R2 object key.
 */
export function getFileUrl(key: string): string {
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }

  const cleanKey = key.replace(/^\/+/, '');
  const publicBaseUrl = process.env.R2_PUBLIC_URL?.trim();

  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/+$/, '')}/${cleanKey}`;
  }

  // Fallback to relative URL if no public custom domain is provided
  return `/${cleanKey}`;
}

export interface UploadFileOptions {
  buffer: Buffer;
  key: string;
  mimeType: string;
  cacheControl?: string;
}

/**
 * Uploads a file buffer directly to Cloudflare R2 using the S3-compatible API.
 */
export async function uploadFile({
  buffer,
  key,
  mimeType,
  cacheControl = 'public, max-age=31536000, immutable',
}: UploadFileOptions): Promise<{ success: boolean; url?: string; key?: string; error?: string }> {
  const bucket = process.env.R2_BUCKET_NAME?.trim();

  if (!bucket || !isR2Configured()) {
    return {
      success: false,
      error:
        'Cloudflare R2 is not configured. Please add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME to environment variables.',
    };
  }

  try {
    const s3 = getR2Client();
    const cleanKey = key.replace(/^\/+/, '');

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: cleanKey,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: cacheControl,
      })
    );

    const publicUrl = getFileUrl(cleanKey);

    return {
      success: true,
      key: cleanKey,
      url: publicUrl,
    };
  } catch (err: any) {
    console.error('[R2 Upload Error]', err);
    return {
      success: false,
      error: `Cloudflare R2 upload error: ${err?.message || 'Upload failed'}`,
    };
  }
}

/**
 * Safely deletes an object from Cloudflare R2 or local disk storage.
 */
export async function deleteFile(keyOrUrl: string): Promise<{ success: boolean; error?: string }> {
  if (!keyOrUrl) return { success: true };

  // 1. If local disk relative path
  if (!keyOrUrl.startsWith('http://') && !keyOrUrl.startsWith('https://')) {
    // If it's an R2 key without domain
    if (
      isR2Configured() &&
      (keyOrUrl.startsWith('products/') ||
        keyOrUrl.startsWith('payment-proofs/') ||
        keyOrUrl.startsWith('qr-codes/'))
    ) {
      try {
        const s3 = getR2Client();
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!.trim(),
            Key: keyOrUrl,
          })
        );
        return { success: true };
      } catch (err: any) {
        console.warn(`[R2 Warning] Failed to delete object key ${keyOrUrl}:`, err?.message);
        return { success: false, error: err?.message };
      }
    }

    // Try deleting local file
    try {
      const fullPath = path.isAbsolute(keyOrUrl)
        ? keyOrUrl
        : path.join(process.cwd(), keyOrUrl.replace(/^\/+/, ''));
      await fs.unlink(fullPath);
      return { success: true };
    } catch {
      return { success: true };
    }
  }

  // 2. If remote HTTP/HTTPS URL
  if (isR2Configured()) {
    try {
      const publicBase = process.env.R2_PUBLIC_URL?.trim();
      let key = '';

      if (publicBase && keyOrUrl.startsWith(publicBase)) {
        key = keyOrUrl.slice(publicBase.length).replace(/^\/+/, '');
      } else {
        const urlObj = new URL(keyOrUrl);
        // Only delete if matches r2.dev domain or configured public custom domain
        if (
          urlObj.hostname.includes('r2.dev') ||
          (publicBase && urlObj.hostname === new URL(publicBase).hostname)
        ) {
          key = urlObj.pathname.replace(/^\/+/, '');
        }
      }

      if (key) {
        const s3 = getR2Client();
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!.trim(),
            Key: key,
          })
        );
        return { success: true };
      }
    } catch (err: any) {
      console.warn(`[R2 Warning] Failed to delete remote object ${keyOrUrl}:`, err?.message);
      return { success: false, error: err?.message };
    }
  }

  return { success: true };
}

/**
 * Validates and saves a product image.
 * Uses Cloudflare R2 for production/serverless, with local disk storage for development.
 */
export async function saveProductImage(
  buffer: Buffer,
  mimeType: string,
  customFolder?: string
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

  // 1. Cloudflare R2 upload if configured
  if (isR2Configured()) {
    const uuid = crypto.randomUUID();
    const folderPrefix = customFolder
      ? `products/${customFolder.replace(/^\/+|\/+$/g, '')}`
      : 'products';
    const key = `${folderPrefix}/prod_${uuid}${extension}`;

    const r2Res = await uploadFile({
      buffer,
      key,
      mimeType,
      cacheControl: 'public, max-age=31536000, immutable',
    });

    if (r2Res.success && r2Res.url) {
      return { success: true, url: r2Res.url };
    }

    if (isServerless) {
      return {
        success: false,
        error: `Cloudflare R2 upload failed: ${r2Res.error}`,
      };
    }
    console.warn('[R2 Warning] Upload failed in development, falling back to local disk:', r2Res.error);
  } else if (isServerless) {
    return {
      success: false,
      error:
        'Serverless deployment (Vercel) detected: Cloudflare R2 is not configured. Please add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL to your Vercel Project Settings > Environment Variables.',
    };
  }

  // 2. Local development fallback in public/uploads/products/
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

/**
 * Validates and saves an uploaded payment proof image.
 * Uses Cloudflare R2 under `payment-proofs/` prefix.
 */
export async function savePaymentProof(
  buffer: Buffer,
  mimeType: string,
  orderRef?: string
): Promise<{ success: boolean; filename?: string; error?: string }> {
  if (buffer.length > MAX_PROOF_SIZE) {
    return { success: false, error: 'File size exceeds maximum allowed limit of 5MB.' };
  }

  const extension = ALLOWED_MIME_TYPES[mimeType.toLowerCase()];
  if (!extension) {
    return { success: false, error: 'Invalid file format. Only JPEG, PNG, and WebP images are allowed.' };
  }

  if (isR2Configured()) {
    const uuid = crypto.randomUUID();
    const folderPrefix = orderRef
      ? `payment-proofs/${orderRef.replace(/^\/+|\/+$/g, '')}`
      : 'payment-proofs';
    const key = `${folderPrefix}/proof_${uuid}${extension}`;

    const r2Res = await uploadFile({
      buffer,
      key,
      mimeType,
      cacheControl: 'private, max-age=31536000',
    });

    if (r2Res.success && r2Res.url) {
      return { success: true, filename: r2Res.url };
    }

    if (isServerless) {
      return { success: false, error: r2Res.error || 'Failed to upload payment proof to Cloudflare R2' };
    }
    console.warn('[R2 Warning] Payment proof upload failed locally, falling back to disk:', r2Res.error);
  } else if (isServerless) {
    return {
      success: false,
      error:
        'Cloud storage is required in production/Vercel. Please configure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL in your Vercel Project Settings.',
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
 * Safely resolves the absolute path to a local payment proof file.
 * Prevents directory traversal attacks.
 */
export function getPaymentProofPath(filename: string): string {
  const safeFilename = path.basename(filename);
  return path.join(PROOF_STORAGE_DIR, safeFilename);
}

/**
 * Checks if a payment proof exists (on Cloudflare R2, remote URL, or local disk).
 */
export async function paymentProofExists(filename: string): Promise<boolean> {
  if (!filename) return false;

  // Remote URL
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    if (isR2Configured()) {
      try {
        const publicBase = process.env.R2_PUBLIC_URL?.trim();
        let key = '';
        if (publicBase && filename.startsWith(publicBase)) {
          key = filename.slice(publicBase.length).replace(/^\/+/, '');
        } else {
          const urlObj = new URL(filename);
          key = urlObj.pathname.replace(/^\/+/, '');
        }

        if (key) {
          const s3 = getR2Client();
          await s3.send(
            new HeadObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME!.trim(),
              Key: key,
            })
          );
          return true;
        }
      } catch (err: any) {
        if (err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404) {
          return false;
        }
        // In case of transient network issue, return true for valid URL
        return true;
      }
    }
    return true;
  }

  // R2 key without protocol
  if (filename.startsWith('payment-proofs/') && isR2Configured()) {
    try {
      const s3 = getR2Client();
      await s3.send(
        new HeadObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!.trim(),
          Key: filename,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  // Local disk check
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
 * Uses Cloudflare R2 under `qr-codes/` prefix.
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

  if (isR2Configured()) {
    const uuid = crypto.randomUUID();
    const key = `qr-codes/qr_${uuid}${extension}`;

    const r2Res = await uploadFile({
      buffer,
      key,
      mimeType,
      cacheControl: 'public, max-age=31536000',
    });

    if (r2Res.success && r2Res.url) {
      return { success: true, filename: r2Res.url };
    }

    if (isServerless) {
      return { success: false, error: r2Res.error || 'Failed to upload QR code to Cloudflare R2' };
    }
  } else if (isServerless) {
    return {
      success: false,
      error:
        'Cloud storage is required in production/Vercel. Please configure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL in your Vercel Project Settings.',
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
 * Safely resolves the absolute path to a local QR code file.
 */
export function getQrCodePath(filename: string): string {
  const safeFilename = path.basename(filename);
  return path.join(QR_STORAGE_DIR, safeFilename);
}
