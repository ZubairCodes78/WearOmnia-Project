import { prisma } from '../lib/prisma';

async function updateProductDescriptions() {
  console.log('Updating product descriptions to emphasize Modesty With Functionality and factual pockets...');

  // 1. Midnight Bloom
  const mb = await prisma.product.findFirst({
    where: { slug: { contains: 'midnight-bloom' } },
  });

  if (mb) {
    const updatedMbDesc = mb.description.replace(
      'The matching palazzo trousers feature a comfortable waistband and two functional side pockets, combining style with everyday practicality.',
      'The matching palazzo trousers feature a comfortable waistband and two functional side pockets, combining modesty with everyday functionality without compromising the graceful, flowing silhouette.'
    );

    await prisma.product.update({
      where: { id: mb.id },
      data: { description: updatedMbDesc },
    });
    console.log('✓ Updated Midnight Bloom description.');
  }

  // 2. Sea Mist
  const sm = await prisma.product.findFirst({
    where: { slug: { contains: 'sea-mist' } },
  });

  if (sm) {
    const updatedSmDesc = sm.description.replace(
      'The shirt features a round neckline with delicate button detailing, stylish button accents on the sleeves, and two functional side pockets for added convenience.',
      'The shirt features a round neckline with delicate button detailing, stylish button accents on the sleeves, and two functional side pockets thoughtfully designed for everyday functionality.'
    );

    await prisma.product.update({
      where: { id: sm.id },
      data: { description: updatedSmDesc },
    });
    console.log('✓ Updated Sea Mist description.');
  }

  console.log('All product descriptions updated successfully.');
}

updateProductDescriptions().catch((e) => {
  console.error(e);
  process.exit(1);
});
