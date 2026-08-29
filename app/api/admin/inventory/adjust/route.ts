import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { productId, variantId, changeQuantity, reason = 'MANUAL_ADJUSTMENT', note } = body;

    if (!productId || typeof changeQuantity !== 'number' || changeQuantity === 0) {
      return NextResponse.json({ error: 'Product ID and non-zero change quantity are required.' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    let newProductStock = Math.max(0, product.stockQuantity + changeQuantity);

    if (variantId) {
      const variant = product.variants.find((v) => v.id === variantId);
      if (!variant) {
        return NextResponse.json({ error: 'Product variant not found.' }, { status: 404 });
      }

      const newVariantStock = Math.max(0, variant.stock + changeQuantity);

      await prisma.productVariant.update({
        where: { id: variantId },
        data: { stock: newVariantStock },
      });

      // Recalculate total product stock from variants
      const allUpdatedVariants = await prisma.productVariant.findMany({
        where: { productId },
      });
      newProductStock = allUpdatedVariants.reduce((sum, v) => sum + v.stock, 0);
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        stockQuantity: newProductStock,
        inStock: newProductStock > 0,
      },
    });

    // Write to InventoryLog
    const log = await prisma.inventoryLog.create({
      data: {
        productId,
        variantId: variantId || null,
        changeQuantity,
        stockAfter: newProductStock,
        reason: `${reason}${note ? ` (${note})` : ''}`,
      },
    });

    await recordAuditLog(
      'STOCK_ADJUSTED',
      'Product',
      productId,
      `Adjusted stock by ${changeQuantity > 0 ? `+${changeQuantity}` : changeQuantity} (Reason: ${reason}). New balance: ${newProductStock} units.`
    );

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      log,
      message: `Stock updated successfully. New balance: ${newProductStock} units.`,
    });
  } catch (error: any) {
    console.error('Inventory adjust error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to adjust inventory.' }, { status: 500 });
  }
}
