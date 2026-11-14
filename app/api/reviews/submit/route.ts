import { NextResponse } from 'next/server';
import { submitVerifiedReview } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, productId, rating, comment, displayName, imageUrl } = body;

    if (!token || !productId) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const result = await submitVerifiedReview({
      token,
      productId,
      rating: Number(rating),
      comment: String(comment || ''),
      displayName: displayName ? String(displayName) : undefined,
      imageUrl: imageUrl ? String(imageUrl) : undefined,
      ipAddress,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      reviewId: result.reviewId,
    });
  } catch (error: any) {
    console.error('Review submit error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

