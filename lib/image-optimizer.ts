import sharp, { Metadata } from 'sharp';

export interface ImageOptimizationResult {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  width?: number;
  height?: number;
  originalSize: number;
  optimizedSize: number;
}

/**
 * Validates that an uploaded buffer is a valid, readable image and within size bounds.
 */
export async function validateImageBuffer(
  buffer: Buffer,
  declaredMimeType: string,
  maxSizeBytes: number = 15 * 1024 * 1024
): Promise<{ valid: boolean; error?: string; metadata?: Metadata }> {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Empty file provided.' };
  }

  if (buffer.length > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
    return { valid: false, error: `File exceeds maximum allowed size of ${maxMb}MB.` };
  }

  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata || !metadata.width || !metadata.height) {
      return { valid: false, error: 'Invalid or corrupt image file.' };
    }

    if (metadata.width < 10 || metadata.height < 10) {
      return { valid: false, error: 'Image dimensions are too small (minimum 10x10px).' };
    }

    if (metadata.width > 12000 || metadata.height > 12000) {
      return { valid: false, error: 'Image dimensions are abnormally large (maximum 12000x12000px).' };
    }

    return { valid: true, metadata };
  } catch (err: any) {
    return { valid: false, error: `Unable to process image: ${err?.message || 'corrupt file'}` };
  }
}

/**
 * Optimizes public product images for ecommerce:
 * - Auto-rotates via EXIF metadata
 * - Resizes if larger than 2048px on longest side (without upscaling)
 * - Converts to high-quality, modern WebP (quality 84)
 * - Preserves transparent backgrounds where present
 */
export async function optimizeProductImage(
  buffer: Buffer,
  customMaxWidth = 2048,
  customMaxHeight = 2048
): Promise<ImageOptimizationResult> {
  const originalSize = buffer.length;
  const image = sharp(buffer).rotate(); // respect EXIF orientation
  const metadata = await image.metadata();

  let pipeline = image;

  // Resize oversized images only (never upscale)
  if (
    (metadata.width && metadata.width > customMaxWidth) ||
    (metadata.height && metadata.height > customMaxHeight)
  ) {
    pipeline = pipeline.resize({
      width: customMaxWidth,
      height: customMaxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convert to WebP with balanced ecommerce quality
  const optimizedBuffer = await pipeline
    .webp({
      quality: 84,
      effort: 4,
      smartSubsample: true,
    })
    .toBuffer();

  const optimizedMeta = await sharp(optimizedBuffer).metadata();

  return {
    buffer: optimizedBuffer,
    mimeType: 'image/webp',
    extension: '.webp',
    width: optimizedMeta.width,
    height: optimizedMeta.height,
    originalSize,
    optimizedSize: optimizedBuffer.length,
  };
}

/**
 * Optimizes Size Guide images:
 * - Ensures crisp text legibility
 * - Max dimension 2048px, WebP quality 88
 */
export async function optimizeSizeGuideImage(buffer: Buffer): Promise<ImageOptimizationResult> {
  const originalSize = buffer.length;
  const image = sharp(buffer).rotate();
  const metadata = await image.metadata();

  let pipeline = image;

  if (
    (metadata.width && metadata.width > 2048) ||
    (metadata.height && metadata.height > 2048)
  ) {
    pipeline = pipeline.resize({
      width: 2048,
      height: 2048,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const optimizedBuffer = await pipeline
    .webp({
      quality: 88,
      effort: 4,
    })
    .toBuffer();

  const optimizedMeta = await sharp(optimizedBuffer).metadata();

  return {
    buffer: optimizedBuffer,
    mimeType: 'image/webp',
    extension: '.webp',
    width: optimizedMeta.width,
    height: optimizedMeta.height,
    originalSize,
    optimizedSize: optimizedBuffer.length,
  };
}

/**
 * Optimizes payment QR code images for high scanner contrast:
 * - Max dimension 1024px, WebP quality 90
 */
export async function optimizeQrCodeImage(buffer: Buffer): Promise<ImageOptimizationResult> {
  const originalSize = buffer.length;
  const image = sharp(buffer).rotate();
  const metadata = await image.metadata();

  let pipeline = image;

  if (
    (metadata.width && metadata.width > 1024) ||
    (metadata.height && metadata.height > 1024)
  ) {
    pipeline = pipeline.resize({
      width: 1024,
      height: 1024,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const optimizedBuffer = await pipeline
    .webp({
      quality: 90,
      effort: 4,
    })
    .toBuffer();

  const optimizedMeta = await sharp(optimizedBuffer).metadata();

  return {
    buffer: optimizedBuffer,
    mimeType: 'image/webp',
    extension: '.webp',
    width: optimizedMeta.width,
    height: optimizedMeta.height,
    originalSize,
    optimizedSize: optimizedBuffer.length,
  };
}

/**
 * Optimizes private pre-order payment proofs:
 * - Keeps high detail for finance verification
 * - Resizes if abnormally large (> 2560px)
 * - Safe compression without breaking file validation
 */
export async function optimizePaymentProofImage(buffer: Buffer): Promise<{
  buffer: Buffer;
  mimeType: string;
  extension: string;
}> {
  try {
    const image = sharp(buffer).rotate();
    const metadata = await image.metadata();

    let pipeline = image;
    if (
      (metadata.width && metadata.width > 2560) ||
      (metadata.height && metadata.height > 2560)
    ) {
      pipeline = pipeline.resize({
        width: 2560,
        height: 2560,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    const optimizedBuffer = await pipeline.webp({ quality: 86 }).toBuffer();
    return {
      buffer: optimizedBuffer,
      mimeType: 'image/webp',
      extension: '.webp',
    };
  } catch {
    return {
      buffer,
      mimeType: 'image/jpeg',
      extension: '.jpg',
    };
  }
}
