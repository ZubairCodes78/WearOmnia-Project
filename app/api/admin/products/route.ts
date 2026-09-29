import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { deleteFile } from '@/lib/storage';

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

    const mappedProducts = products.map((p) => {
      const guideImg = p.images.find((img) => img.altText === 'SIZE_GUIDE');
      return {
        ...p,
        sizeGuideImage: guideImg?.url || null,
        images: p.images.filter((img) => img.altText !== 'SIZE_GUIDE'),
      };
    });

    return NextResponse.json({ products: mappedProducts });
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
      isPreOrder,
      preOrderAdvancePercent,
      preOrderNote,
      preOrderEstimatedAvailability,
      images, // array of URLs or { url, isPrimary }
      variants, // array of { size, color, colorHex, stock, sku }
      sizeGuideId,
      sizeGuideImage,
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
        isPreOrder: Boolean(isPreOrder),
        preOrderAdvancePercent: preOrderAdvancePercent ? parseInt(preOrderAdvancePercent) : null,
        preOrderNote: preOrderNote ? String(preOrderNote).trim() : null,
        preOrderEstimatedAvailability: preOrderEstimatedAvailability ? String(preOrderEstimatedAvailability).trim() : null,
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

    if (sizeGuideImage && typeof sizeGuideImage === 'string') {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: sizeGuideImage,
          altText: 'SIZE_GUIDE',
          displayOrder: 999,
          isPrimary: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        sizeGuideImage: sizeGuideImage || null,
        images: product.images.filter((img) => img.altText !== 'SIZE_GUIDE'),
      },
    });
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
      isPreOrder,
      preOrderAdvancePercent,
      preOrderNote,
      preOrderEstimatedAvailability,
      images,
      variants,
      sizeGuideId,
      sizeGuideImage,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required for edit' }, { status: 400 });
    }

    const parsedStock = stockQuantity !== undefined ? parseInt(stockQuantity) : undefined;

    // Delete existing gallery images & variants if new lists are provided (leave SIZE_GUIDE image untouched)
    let oldImagesToRemove: string[] = [];
    if (images) {
      const existingImages = await prisma.productImage.findMany({
        where: { productId: id, altText: { not: 'SIZE_GUIDE' } },
        select: { url: true },
      });
      const newUrls = (images || []).map((img: any) =>
        typeof img === 'string' ? img : img?.url
      );
      oldImagesToRemove = existingImages
        .map((img) => img.url)
        .filter((url) => url && !newUrls.includes(url));

      await prisma.productImage.deleteMany({
        where: { productId: id, altText: { not: 'SIZE_GUIDE' } },
      });
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
        ...(isPreOrder !== undefined ? { isPreOrder: Boolean(isPreOrder) } : {}),
        ...(preOrderAdvancePercent !== undefined ? { preOrderAdvancePercent: preOrderAdvancePercent ? parseInt(preOrderAdvancePercent) : null } : {}),
        ...(preOrderNote !== undefined ? { preOrderNote: preOrderNote ? String(preOrderNote).trim() : null } : {}),
        ...(preOrderEstimatedAvailability !== undefined ? { preOrderEstimatedAvailability: preOrderEstimatedAvailability ? String(preOrderEstimatedAvailability).trim() : null } : {}),
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

    // Handle dedicated product size guide image (Upload, Replace, Remove)
    if (sizeGuideImage !== undefined) {
      const existingGuideImg = await prisma.productImage.findFirst({
        where: { productId: id, altText: 'SIZE_GUIDE' },
      });

      if (existingGuideImg && existingGuideImg.url !== sizeGuideImage) {
        await prisma.productImage.delete({ where: { id: existingGuideImg.id } });
        try {
          const refCount = await prisma.productImage.count({
            where: { url: existingGuideImg.url },
          });
          if (refCount === 0) {
            await deleteFile(existingGuideImg.url);
          }
        } catch (cleanupErr) {
          console.warn('[R2 Cleanup] Failed to delete orphaned size guide image:', cleanupErr);
        }
      }

      if (sizeGuideImage && typeof sizeGuideImage === 'string' && (!existingGuideImg || existingGuideImg.url !== sizeGuideImage)) {
        await prisma.productImage.create({
          data: {
            productId: id,
            url: sizeGuideImage,
            altText: 'SIZE_GUIDE',
            displayOrder: 999,
            isPrimary: false,
          },
        });
      }
    }

    // Safely clean up orphaned R2 images that are no longer referenced anywhere in DB
    if (oldImagesToRemove.length > 0) {
      for (const oldUrl of oldImagesToRemove) {
        try {
          const refCount = await prisma.productImage.count({
            where: { url: oldUrl },
          });
          if (refCount === 0) {
            await deleteFile(oldUrl);
          }
        } catch (cleanupErr) {
          console.warn('[R2 Cleanup] Failed to delete orphaned image:', cleanupErr);
        }
      }
    }

    const currentGuideImg = await prisma.productImage.findFirst({
      where: { productId: id, altText: 'SIZE_GUIDE' },
    });

    return NextResponse.json({
      success: true,
      product: {
        ...updated,
        sizeGuideImage: currentGuideImg?.url || null,
        images: updated.images.filter((img) => img.altText !== 'SIZE_GUIDE'),
      },
    });
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

    const existingImages = await prisma.productImage.findMany({
      where: { productId: id },
      select: { url: true },
    });

    await prisma.product.delete({ where: { id } });

    // Safely delete R2 images if not referenced by any other product
    for (const img of existingImages) {
      if (img.url) {
        try {
          const refCount = await prisma.productImage.count({
            where: { url: img.url },
          });
          if (refCount === 0) {
            await deleteFile(img.url);
          }
        } catch (cleanupErr) {
          console.warn('[R2 Cleanup] Failed to delete product image from R2:', cleanupErr);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product delete error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
