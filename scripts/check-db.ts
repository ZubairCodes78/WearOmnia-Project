import { prisma } from '../lib/prisma';

async function main() {
  try {
    const products = await prisma.product.findMany({
      include: { images: true, variants: true, category: true },
    });
    console.log('Total products:', products.length);
    for (const p of products) {
      console.log(`- [${p.status}] ${p.title} (slug: ${p.slug}, price: ${p.basePrice}, images: ${p.images.length})`);
    }
  } catch (e) {
    console.error('Error fetching products:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
