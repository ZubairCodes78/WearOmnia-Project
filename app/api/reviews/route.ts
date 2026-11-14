import { NextResponse } from 'next/server';
import { submitVerifiedReview } from '@/lib/reviews';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, productId, rating, comment, customerName, displayName } = body;

    // Strict security: require valid verified order token to prevent unverified fake reviews
    if (!token) {
      return NextResponse.json(
        {
          error:
            'A verified order review token is required. Please use the personalized review invitation link sent to your WhatsApp after your order was delivered.',
        },
        { status: 403 }
      );
    }

    if (!productId || !rating || !comment) {
      return NextResponse.json({ error: 'Please provide rating, review comment, and product ID.' }, { status: 400 });
    }

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const result = await submitVerifiedReview({
      token,
      productId,
      rating: Number(rating),
      comment: String(comment).trim(),
      displayName: displayName || customerName,
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
  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
