import React from 'react';
import { prisma } from '@/lib/prisma';
import { ReviewsClient } from './ReviewsClient';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    include: {
      product: {
        select: {
          id: true,
          title: true,
          sku: true,
          images: { take: 1, orderBy: { displayOrder: 'asc' } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return <ReviewsClient initialReviews={reviews as any} />;
}
