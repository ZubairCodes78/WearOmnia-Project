import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';

export async function GET() {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const collections = await prisma.collection.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return NextResponse.json({ collections });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch collections' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, description, bannerUrl } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const collection = await prisma.collection.create({
      data: {
        name,
        slug,
        description,
        bannerUrl,
      },
    });

    return NextResponse.json({ success: true, collection });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create collection' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, name, description, bannerUrl, displayOrder } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Collection ID is required' }, { status: 400 });
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: {
        ...(name ? { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(bannerUrl !== undefined ? { bannerUrl } : {}),
        ...(displayOrder !== undefined ? { displayOrder: parseInt(displayOrder) } : {}),
      },
    });

    return NextResponse.json({ success: true, collection });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update collection' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let id: string | null = null;
    try {
      const body = await req.json();
      id = body.id;
    } catch {
      const { searchParams } = new URL(req.url);
      id = searchParams.get('id');
    }

    if (!id) {
      return NextResponse.json({ error: 'Collection ID is required' }, { status: 400 });
    }

    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Unlink any products currently in this collection
    await prisma.product.updateMany({
      where: { collectionId: id },
      data: { collectionId: null },
    });

    await prisma.collection.delete({ where: { id } });

    return NextResponse.json({ success: true, message: `Collection "${collection.name}" deleted successfully.` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete collection' }, { status: 500 });
  }
}
