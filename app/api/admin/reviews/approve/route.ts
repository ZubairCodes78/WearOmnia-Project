import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';

export async function POST(req: Request) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, isApproved, action } = await req.json();

    if (action === 'delete') {
      await prisma.review.delete({ where: { id } });
    } else {
      await prisma.review.update({
        where: { id },
        data: { isApproved },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Review approval error:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}
