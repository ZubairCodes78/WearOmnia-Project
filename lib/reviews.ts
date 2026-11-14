import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { revalidateCatalogCaches } from '@/lib/storefront-cache';

const REVIEW_TOKEN_EXPIRY_DAYS = 30;

/**
 * Format a privacy-conscious default customer name (e.g. "Fatima Ayesha" -> "Fatima A.")
 */
export function formatPrivacyDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Verified Customer';
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0].toUpperCase();
  return `${firstName} ${lastInitial}.`;
}

/**
 * Generate or retrieve an existing cryptographic review token for a DELIVERED order.
 * Returns the full public review URL.
 */
export async function getOrCreateOrderReviewToken(orderId: string, baseUrl?: string): Promise<{
  token: string;
  reviewUrl: string;
  expiresAt: Date;
}> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      orderNumber: true,
      reviewToken: true,
      reviewTokenExpiresAt: true,
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Token is only valid for delivered orders
  if (order.status !== 'DELIVERED') {
    throw new Error(`Order ${order.orderNumber} is in status ${order.status}. Reviews require DELIVERED status.`);
  }

  const now = new Date();
  const domain = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wearomnia.com';

  // Reuse active token if not expired
  if (order.reviewToken && order.reviewTokenExpiresAt && order.reviewTokenExpiresAt > now) {
    return {
      token: order.reviewToken,
      reviewUrl: `${domain.replace(/\/+$/, '')}/review/${order.reviewToken}`,
      expiresAt: order.reviewTokenExpiresAt,
    };
  }

  // Generate new cryptographically unguessable token (192 bits of entropy)
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(now.getTime() + REVIEW_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.order.update({
    where: { id: orderId },
    data: {
      reviewToken: token,
      reviewTokenExpiresAt: expiresAt,
    },
  });

  return {
    token,
    reviewUrl: `${domain.replace(/\/+$/, '')}/review/${token}`,
    expiresAt,
  };
}

/**
 * Validate a review token and return the sanitized order and item details.
 * STRICT SECURITY: Never leaks phone numbers, payment receipts, or delivery addresses.
 */
export async function validateReviewToken(token: string) {
  if (!token || typeof token !== 'string' || token.length < 32) {
    return { valid: false, error: 'Invalid or missing review token.' };
  }

  const order = await prisma.order.findUnique({
    where: { reviewToken: token },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      customerName: true,
      reviewTokenExpiresAt: true,
      deliveredAt: true,
      items: {
        select: {
          id: true,
          productId: true,
          productTitle: true,
          variantInfo: true,
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              images: {
                where: { altText: { not: 'SIZE_GUIDE' } },
                orderBy: { displayOrder: 'asc' },
                take: 1,
                select: { url: true, altText: true },
              },
            },
          },
        },
      },
      reviews: {
        select: {
          id: true,
          productId: true,
          rating: true,
          comment: true,
          status: true,
          isApproved: true,
          createdAt: true,
        },
      },
    },
  });

  if (!order) {
    return { valid: false, error: 'Review link not found or invalid.' };
  }

  if (order.status !== 'DELIVERED') {
    return { valid: false, error: 'Reviews can only be submitted for delivered orders.' };
  }

  if (order.reviewTokenExpiresAt && order.reviewTokenExpiresAt < new Date()) {
    return { valid: false, error: 'This review invitation has expired.' };
  }

  // Deduplicate products in case an order contained multiple variants of the same product
  const reviewedProductIds = new Set(order.reviews.map((r) => r.productId));
  const uniqueItemsMap = new Map<string, typeof order.items[0]>();

  for (const item of order.items) {
    if (item.productId && !uniqueItemsMap.has(item.productId)) {
      uniqueItemsMap.set(item.productId, item);
    }
  }

  const eligibleItems = Array.from(uniqueItemsMap.values()).map((item) => {
    const existingReview = order.reviews.find((r) => r.productId === item.productId);
    return {
      itemId: item.id,
      productId: item.productId!,
      productTitle: item.product?.title || item.productTitle,
      productSlug: item.product?.slug || null,
      productImage: item.product?.images?.[0]?.url || '/images/og-image.jpg',
      variantInfo: item.variantInfo,
      hasReviewed: Boolean(existingReview),
      reviewStatus: existingReview ? existingReview.status : null,
      submittedRating: existingReview ? existingReview.rating : null,
    };
  });

  return {
    valid: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    defaultDisplayName: formatPrivacyDisplayName(order.customerName),
    eligibleItems,
  };
}

/**
 * Submit a customer review with strict validation, duplicate prevention, and spam controls.
 */
export async function submitVerifiedReview(params: {
  token: string;
  productId: string;
  rating: number;
  comment: string;
  displayName?: string;
  imageUrl?: string;
  ipAddress?: string;
}) {
  const { token, productId, rating, comment, displayName, imageUrl, ipAddress } = params;

  // 1. Validate inputs
  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5 || !Number.isInteger(numRating)) {
    return { success: false, error: 'Rating must be an integer between 1 and 5 stars.' };
  }

  const trimmedComment = (comment || '').trim();
  if (trimmedComment.length < 5) {
    return { success: false, error: 'Please write a review of at least 5 characters.' };
  }
  if (trimmedComment.length > 1500) {
    return { success: false, error: 'Review cannot exceed 1,500 characters.' };
  }

  // 2. Validate token and order ownership
  const tokenValidation = await validateReviewToken(token);
  if (!tokenValidation.valid || !tokenValidation.orderId) {
    return { success: false, error: tokenValidation.error || 'Invalid review token.' };
  }

  // 3. Verify product was purchased in this order
  const eligibleItem = tokenValidation.eligibleItems?.find((it) => it.productId === productId);
  if (!eligibleItem) {
    return { success: false, error: 'This product is not part of your delivered order.' };
  }

  if (eligibleItem.hasReviewed) {
    return { success: false, error: 'You have already submitted a review for this product.' };
  }

  // 4. Double check database duplicate constraint
  const existingReview = await prisma.review.findFirst({
    where: {
      orderId: tokenValidation.orderId,
      productId,
    },
  });

  if (existingReview) {
    return { success: false, error: 'A review for this product in this order already exists.' };
  }

  // 5. Look up customer phone for internal admin audit reference only
  const orderDetails = await prisma.order.findUnique({
    where: { id: tokenValidation.orderId },
    select: { customerPhone: true, customerWhatsapp: true, customerName: true },
  });

  const finalDisplayName = (displayName && displayName.trim().length > 0)
    ? displayName.trim().slice(0, 50)
    : formatPrivacyDisplayName(orderDetails?.customerName || tokenValidation.customerName);

  // 6. Create the review (starts as PENDING for admin moderation)
  const createdReview = await prisma.review.create({
    data: {
      productId,
      orderId: tokenValidation.orderId,
      customerName: finalDisplayName,
      customerPhone: orderDetails?.customerPhone || orderDetails?.customerWhatsapp || null,
      rating: numRating,
      comment: trimmedComment,
      imageUrl: imageUrl || null,
      isApproved: false,
      status: 'PENDING',
      verifiedPurchase: true,
    },
  });

  // Revalidate public catalog cache
  revalidateCatalogCaches(eligibleItem.productSlug || undefined);

  return {
    success: true,
    message: 'Thank you! Your verified review has been submitted and will appear once approved by our moderation team.',
    reviewId: createdReview.id,
  };
}

