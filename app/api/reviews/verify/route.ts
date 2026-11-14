import { NextResponse } from 'next/server';
import { validateReviewToken } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Review token is required.' }, { status: 400 });
    }

    const result = await validateReviewToken(token);

    if (!result.valid) {
      return NextResponse.json({ error: result.error || 'Invalid or expired review link.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      orderNumber: result.orderNumber,
      defaultDisplayName: result.defaultDisplayName,
      eligibleItems: result.eligibleItems,
    });
  } catch (error: any) {
    console.error('Review verification error:', error);
    return NextResponse.json({ error: 'Failed to verify review invitation.' }, { status: 500 });
  }
}
