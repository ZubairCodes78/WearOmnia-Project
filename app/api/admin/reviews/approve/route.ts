import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { revalidateCatalogCaches } from '@/lib/storefront-cache';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: Request) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, isApproved, action, rejectionReason } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { id },
      include: { product: { select: { slug: true } } },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (action === 'delete') {
      await prisma.review.delete({ where: { id } });
      await recordAuditLog('DELETE_REVIEW', 'Review', id, `Deleted review from ${review.customerName}`);
    } else if (action === 'reject' || isApproved === false) {
      await prisma.review.update({
        where: { id },
        data: {
          isApproved: false,
          status: 'REJECTED',
          rejectionReason: rejectionReason || 'Declined by moderator',
        },
      });
      await recordAuditLog('REJECT_REVIEW', 'Review', id, `Rejected review from ${review.customerName}`);
    } else {
      await prisma.review.update({
        where: { id },
        data: {
          isApproved: true,
          status: 'APPROVED',
          rejectionReason: null,
        },
      });
      await recordAuditLog('APPROVE_REVIEW', 'Review', id, `Approved review from ${review.customerName}`);
    }

    revalidateCatalogCaches(review.product?.slug || undefined);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Review moderation error:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}
