import React from 'react';
import { prisma } from '@/lib/prisma';
import { CategoriesClient } from './CategoriesClient';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const [categories, collections] = await Promise.all([
    prisma.category.findMany({
      include: { products: { select: { id: true } } },
      orderBy: { displayOrder: 'asc' },
    }),
    prisma.collection.findMany({
      include: { products: { select: { id: true } } },
      orderBy: { displayOrder: 'asc' },
    }),
  ]);

  return <CategoriesClient initialCategories={categories} initialCollections={collections} />;
}
