import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    // Public endpoint - categories are needed for storefront
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return NextResponse.json({ categories });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, imageUrl } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        imageUrl,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, description, imageUrl, displayOrder } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name ? { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(displayOrder !== undefined ? { displayOrder: parseInt(displayOrder) } : {}),
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete category' }, { status: 500 });
  }
}
