import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      include: {
        images: true,
        variants: true,
        category: true,
        collection: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Duplicate Product feature
    if (body.action === 'DUPLICATE' && body.id) {
      const original = await prisma.product.findUnique({
        where: { id: body.id },
        include: { images: true, variants: true },
      });

      if (!original) {
        return NextResponse.json({ error: 'Original product not found' }, { status: 404 });
      }

      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const newSku = `${original.sku}-COPY-${randomSuffix}`;
      const newSlug = `${original.slug}-copy-${randomSuffix}`;

      const duplicated = await prisma.product.create({
        data: {
          title: `${original.title} (Copy)`,
          slug: newSlug,
          description: original.description,
          fabricDetails: original.fabricDetails,
          careInstructions: original.careInstructions,
          basePrice: original.basePrice,
          discountPrice: original.discountPrice,
          sku: newSku,
          barcode: original.barcode ? `${original.barcode}-C` : null,
          status: 'DRAFT', // duplicated products start as DRAFT
          isFeatured: original.isFeatured,
          isNewArrival: original.isNewArrival,
          isBestSeller: original.isBestSeller,
          isSignature: original.isSignature,
          inStock: original.inStock,
          stockQuantity: original.stockQuantity,
          categoryId: original.categoryId,
          collectionId: original.collectionId,
          images: {
            create: original.images.map((img) => ({
              url: img.url,
              altText: img.altText,
              displayOrder: img.displayOrder,
              isPrimary: img.isPrimary,
            })),
          },
          variants: {
            create: original.variants.map((v) => ({
              size: v.size,
              color: v.color,
              colorHex: v.colorHex,
              sku: `${newSku}-${v.size}-${v.color.replace(/\s+/g, '')}`,
              stock: v.stock,
            })),
          },
        },
        include: {
          images: true,
          variants: true,
          category: true,
          collection: true,
        },
      });

      return NextResponse.json({ success: true, product: duplicated });
    }

    // Create New Product
    const {
      title,
      description,
      fabricDetails,
      careInstructions,
      basePrice,
      discountPrice,
      sku,
      barcode,
      stockQuantity,
      categoryId,
      collectionId,
      status,
      isFeatured,
      isNewArrival,
      isBestSeller,
      isSignature,
      images, // array of URLs or { url, isPrimary }
      variants, // array of { size, color, colorHex, stock, sku }
      sizeGuideId,
    } = body;

    if (!title || !basePrice || !sku) {
      return NextResponse.json({ error: 'Title, Base Price, and SKU are required' }, { status: 400 });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 1000);
    const parsedStock = parseInt(stockQuantity || '25');

    const product = await prisma.product.create({
      data: {
        title,
        slug,
        description: description || title,
        fabricDetails,
        careInstructions,
        basePrice: parseFloat(basePrice),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        sku,
        barcode: barcode || null,
        status: status || 'PUBLISHED',
        stockQuantity: parsedStock,
        inStock: parsedStock > 0,
        categoryId: categoryId || null,
        collectionId: collectionId || null,
        sizeGuideId: sizeGuideId || null,
        isFeatured: Boolean(isFeatured),
        isNewArrival: Boolean(isNewArrival),
        isBestSeller: Boolean(isBestSeller),
        isSignature: Boolean(isSignature),
        images: {
          create: (images || []).map((img: any, i: number) => {
            const url = typeof img === 'string' ? img : img.url;
            return {
              url,
              altText: title,
              displayOrder: i,
              isPrimary: i === 0,
            };
          }),
        },
        variants: {
          create: (variants || [
            { size: 'S', color: 'Black', colorHex: '#000000', stock: 10 },
            { size: 'M', color: 'Black', colorHex: '#000000', stock: 10 },
            { size: 'L', color: 'Black', colorHex: '#000000', stock: 5 },
          ]).map((v: any) => ({
            size: v.size || 'M',
            color: v.color || 'Standard',
            colorHex: v.colorHex || null,
            sku: v.sku || `${sku}-${v.size}-${(v.color || 'ST').replace(/\s+/g, '')}`,
            stock: parseInt(v.stock || '10'),
          })),
        },
      },
      include: {
        images: true,
        variants: true,
        category: true,
        collection: true,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Product creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      title,
      description,
      fabricDetails,
      careInstructions,
      basePrice,
      discountPrice,
      sku,
      barcode,
      status,
      stockQuantity,
      categoryId,
      collectionId,
      isFeatured,
      isNewArrival,
      isBestSeller,
      isSignature,
      images,
      variants,
      sizeGuideId,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required for edit' }, { status: 400 });
    }

    const parsedStock = stockQuantity !== undefined ? parseInt(stockQuantity) : undefined;

    // Delete existing images & variants if new lists are provided
    if (images) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
    }
    if (variants) {
      await prisma.productVariant.deleteMany({ where: { productId: id } });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(title ? { title, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + id.substring(0, 4) } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(fabricDetails !== undefined ? { fabricDetails } : {}),
        ...(careInstructions !== undefined ? { careInstructions } : {}),
        ...(basePrice !== undefined ? { basePrice: parseFloat(basePrice) } : {}),
        ...(discountPrice !== undefined ? { discountPrice: discountPrice ? parseFloat(discountPrice) : null } : {}),
        ...(sku !== undefined ? { sku } : {}),
        ...(barcode !== undefined ? { barcode } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(parsedStock !== undefined ? { stockQuantity: parsedStock, inStock: parsedStock > 0 } : {}),
        ...(categoryId !== undefined ? { categoryId: categoryId || null } : {}),
        ...(collectionId !== undefined ? { collectionId: collectionId || null } : {}),
        ...(sizeGuideId !== undefined ? { sizeGuideId: sizeGuideId || null } : {}),
        ...(isFeatured !== undefined ? { isFeatured: Boolean(isFeatured) } : {}),
        ...(isNewArrival !== undefined ? { isNewArrival: Boolean(isNewArrival) } : {}),
        ...(isBestSeller !== undefined ? { isBestSeller: Boolean(isBestSeller) } : {}),
        ...(isSignature !== undefined ? { isSignature: Boolean(isSignature) } : {}),
        ...(images
          ? {
              images: {
                create: images.map((img: any, i: number) => {
                  const url = typeof img === 'string' ? img : img.url;
                  return {
                    url,
                    altText: title || 'Product Image',
                    displayOrder: i,
                    isPrimary: i === 0,
                  };
                }),
              },
            }
          : {}),
        ...(variants
          ? {
              variants: {
                create: variants.map((v: any) => ({
                  size: v.size,
                  color: v.color,
                  colorHex: v.colorHex || null,
                  sku: v.sku || `${sku || 'SKU'}-${v.size}-${(v.color || 'DEF').replace(/\s+/g, '')}`,
                  stock: parseInt(v.stock || '10'),
                })),
              },
            }
          : {}),
      },
      include: {
        images: true,
        variants: true,
        category: true,
        collection: true,
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error('Product update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    let id: string | null = null;
    try {
      const body = await req.json();
      id = body.id;
    } catch {
      const { searchParams } = new URL(req.url);
      id = searchParams.get('id');
    }

    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product delete error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
