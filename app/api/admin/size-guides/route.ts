import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';

// GET all size guides
export async function GET() {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sizeGuides = await prisma.sizeGuide.findMany({
      include: {
        entries: { orderBy: { displayOrder: 'asc' } },
        _count: { select: { products: true } },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json(sizeGuides);
  } catch (error) {
    console.error('[Admin SizeGuides] GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch size guides' }, { status: 500 });
  }
}

// POST create new size guide
export async function POST(req: NextRequest) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, slug, description, productType, measurementUnit, columns, isDefault, displayOrder, entries } = body;

    if (!name || !slug || !columns) {
      return NextResponse.json({ error: 'Name, slug, and columns are required' }, { status: 400 });
    }

    // If isDefault, unset other defaults for the same product type
    if (isDefault) {
      await prisma.sizeGuide.updateMany({
        where: { productType: productType || 'STITCHED', isDefault: true },
        data: { isDefault: false },
      });
    }

    const sizeGuide = await prisma.sizeGuide.create({
      data: {
        name,
        slug,
        description: description || null,
        productType: productType || 'STITCHED',
        measurementUnit: measurementUnit || 'inches',
        columns: typeof columns === 'string' ? columns : JSON.stringify(columns),
        isDefault: isDefault || false,
        displayOrder: displayOrder || 0,
        entries: entries?.length
          ? {
              create: entries.map((entry: any, idx: number) => ({
                sizeName: entry.sizeName,
                measurements: typeof entry.measurements === 'string' ? entry.measurements : JSON.stringify(entry.measurements),
                notes: entry.notes || null,
                displayOrder: idx,
              })),
            }
          : undefined,
      },
      include: {
        entries: { orderBy: { displayOrder: 'asc' } },
      },
    });

    return NextResponse.json(sizeGuide, { status: 201 });
  } catch (error: any) {
    console.error('[Admin SizeGuides] POST Error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A size guide with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create size guide' }, { status: 500 });
  }
}

// PUT update a size guide
export async function PUT(req: NextRequest) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, slug, description, productType, measurementUnit, columns, isDefault, displayOrder, entries } = body;

    if (!id) {
      return NextResponse.json({ error: 'Size guide ID is required' }, { status: 400 });
    }

    // If setting as default, unset others
    if (isDefault) {
      await prisma.sizeGuide.updateMany({
        where: { productType: productType || 'STITCHED', isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    // Delete old entries and recreate
    if (entries) {
      await prisma.sizeGuideEntry.deleteMany({ where: { sizeGuideId: id } });
    }

    const sizeGuide = await prisma.sizeGuide.update({
      where: { id },
      data: {
        name,
        slug,
        description: description || null,
        productType,
        measurementUnit,
        columns: typeof columns === 'string' ? columns : JSON.stringify(columns),
        isDefault: isDefault || false,
        displayOrder: displayOrder || 0,
        entries: entries?.length
          ? {
              create: entries.map((entry: any, idx: number) => ({
                sizeName: entry.sizeName,
                measurements: typeof entry.measurements === 'string' ? entry.measurements : JSON.stringify(entry.measurements),
                notes: entry.notes || null,
                displayOrder: idx,
              })),
            }
          : undefined,
      },
      include: {
        entries: { orderBy: { displayOrder: 'asc' } },
      },
    });

    return NextResponse.json(sizeGuide);
  } catch (error: any) {
    console.error('[Admin SizeGuides] PUT Error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update size guide' }, { status: 500 });
  }
}

// DELETE a size guide
export async function DELETE(req: NextRequest) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Size guide ID is required' }, { status: 400 });
    }

    // Unlink products first
    await prisma.product.updateMany({
      where: { sizeGuideId: id },
      data: { sizeGuideId: null },
    });

    await prisma.sizeGuide.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin SizeGuides] DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete size guide' }, { status: 500 });
  }
}
