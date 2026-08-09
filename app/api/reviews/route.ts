import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { productId, customerName, rating, comment, imageUrl } = await req.json();

    if (!productId || !customerName || !rating || !comment) {
      return NextResponse.json({ error: 'Please fill in all required review fields' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        productId,
        customerName: customerName.trim(),
        rating: Number(rating),
        comment: comment.trim(),
        imageUrl: imageUrl || null,
        isApproved: false, // Requires admin approval
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your review has been submitted and is pending approval.',
      review,
    });
  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
