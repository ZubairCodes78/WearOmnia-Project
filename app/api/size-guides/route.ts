import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET size guides (public)
// ?slug=pret — get specific guide
// ?productId=xxx — get guide for a product
// no params — get all guides
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const productId = searchParams.get('productId');

    // Get a specific guide by slug
    if (slug) {
      const guide = await prisma.sizeGuide.findUnique({
        where: { slug },
        include: { entries: { orderBy: { displayOrder: 'asc' } } },
      });
      if (!guide) {
        return NextResponse.json({ error: 'Size guide not found' }, { status: 404 });
      }
      return NextResponse.json(guide);
    }

    // Get guide for a specific product
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { sizeGuideId: true },
      });

      let guide = null;

      // Product has a specific guide assigned
      if (product?.sizeGuideId) {
        guide = await prisma.sizeGuide.findUnique({
          where: { id: product.sizeGuideId },
          include: { entries: { orderBy: { displayOrder: 'asc' } } },
        });
      }

      // Fallback to default guide
      if (!guide) {
        guide = await prisma.sizeGuide.findFirst({
          where: { isDefault: true },
          include: { entries: { orderBy: { displayOrder: 'asc' } } },
        });
      }

      if (!guide) {
        return NextResponse.json({ error: 'No size guide available' }, { status: 404 });
      }
      return NextResponse.json(guide);
    }

    // Get all guides
    const guides = await prisma.sizeGuide.findMany({
      include: { entries: { orderBy: { displayOrder: 'asc' } } },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json(guides);
  } catch (error) {
    console.error('[SizeGuides] GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch size guides' }, { status: 500 });
  }
}
