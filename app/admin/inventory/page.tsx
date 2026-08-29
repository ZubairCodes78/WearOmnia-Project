import React from 'react';
import { prisma } from '@/lib/prisma';
import { InventoryClient } from './InventoryClient';

export const dynamic = 'force-dynamic';

export default async function AdminInventoryPage() {
  const [products, totalLogsCount] = await Promise.all([
    prisma.product.findMany({
      include: {
        variants: true,
        images: { orderBy: { displayOrder: 'asc' } },
        category: true,
      },
      orderBy: { stockQuantity: 'asc' },
    }),
    prisma.inventoryLog.count(),
  ]);

  return <InventoryClient initialProducts={products as any} totalLogsCount={totalLogsCount} />;
}
