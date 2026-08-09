import React from 'react';
import { prisma } from '@/lib/prisma';
import { ReviewsClient } from './ReviewsClient';

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    include: { product: true },
    orderBy: { createdAt: 'desc' },
  });

  return <ReviewsClient initialReviews={reviews} />;
}
