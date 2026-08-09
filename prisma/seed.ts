import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('🌱 Cleaning demo data & seeding WearOMNIA store launch database...');

  // Clean all demo data
  await prisma.adminNotification.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.orderTimeline.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.inventoryLog.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.contactSubmission.deleteMany({});
  await prisma.newsletterSubscriber.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.collection.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.shippingRule.deleteMany({});
  await prisma.siteSettings.deleteMany({});
  await prisma.sizeGuideEntry.deleteMany({});
  await prisma.sizeGuide.deleteMany({});

  // 0. Seed Default Size Guides (placeholder measurements — admin should update with actual values)
  console.log('📏 Seeding size guides...');
  await prisma.sizeGuide.create({
    data: {
      name: 'Pret (Stitched)',
      slug: 'pret-stitched',
      description: 'Standard measurement chart for our ready-to-wear stitched garments. All measurements in inches. These are placeholder values — please update via Admin Panel with actual brand measurements.',
      productType: 'STITCHED',
      measurementUnit: 'inches',
      columns: JSON.stringify(['Bust', 'Waist', 'Hip', 'Length']),
      isDefault: true,
      displayOrder: 0,
      entries: {
        create: [
          { sizeName: 'XS', measurements: JSON.stringify({ Bust: '32', Waist: '26', Hip: '34', Length: '39' }), notes: 'Extra Small', displayOrder: 0 },
          { sizeName: 'S', measurements: JSON.stringify({ Bust: '34', Waist: '28', Hip: '36', Length: '40' }), notes: 'Small', displayOrder: 1 },
          { sizeName: 'M', measurements: JSON.stringify({ Bust: '36', Waist: '30', Hip: '38', Length: '41' }), notes: 'Medium', displayOrder: 2 },
          { sizeName: 'L', measurements: JSON.stringify({ Bust: '38', Waist: '32', Hip: '40', Length: '42' }), notes: 'Large', displayOrder: 3 },
          { sizeName: 'XL', measurements: JSON.stringify({ Bust: '40', Waist: '34', Hip: '42', Length: '43' }), notes: 'Extra Large', displayOrder: 4 },
        ],
      },
    },
  });

  console.log('✅ Size guides seeded');

  // 1. Single Category: New Arrivals
  const categoryNewArrivals = await prisma.category.create({
    data: {
      name: 'New Arrivals',
      slug: 'new-arrivals',
      description: 'Exclusive flagship luxury launch garments from our Lahore Atelier.',
      imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop',
    },
  });

  // 2. Single Collection: New Arrivals
  const collectionNewArrivals = await prisma.collection.create({
    data: {
      name: 'New Arrivals',
      slug: 'new-arrivals',
      description: 'Our inaugural haute couture collection for 2026.',
      bannerUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1600&auto=format&fit=crop',
    },
  });

  // 3. Single Flagship Product: The Sovereign Velvet Kaftan
  const flagshipProduct = await prisma.product.create({
    data: {
      title: 'The Sovereign Velvet Kaftan',
      slug: 'the-sovereign-velvet-kaftan',
      description: 'An ethereal deep teal micro-velvet kaftan featuring hand-sewn metallic gold threadwork, dabka, and pearl accents. Paired with tailored raw silk trousers.',
      fabricDetails: 'Shirt: Micro Velvet 9000 | Trouser: Korean Raw Silk | Dupatta: Organza with Zari Border',
      careInstructions: 'Dry Clean Only. Steam iron on reverse side. Store in tissue garment wrap.',
      basePrice: 28500,
      discountPrice: 24900,
      sku: 'OMNIA-VK-01',
      barcode: '896400010201',
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: true,
      isSignature: true,
      inStock: true,
      stockQuantity: 25,
      weightGram: 850,
      categoryId: categoryNewArrivals.id,
      collectionId: collectionNewArrivals.id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop',
            altText: 'The Sovereign Velvet Kaftan Front',
            displayOrder: 0,
            isPrimary: true,
          },
          {
            url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200&auto=format&fit=crop',
            altText: 'The Sovereign Velvet Kaftan Detail',
            displayOrder: 1,
            isPrimary: false,
          },
        ],
      },
      variants: {
        create: [
          { size: 'S', color: 'Deep Teal', colorHex: '#103D42', sku: 'OMNIA-VK-01-S-TEAL', stock: 8 },
          { size: 'M', color: 'Deep Teal', colorHex: '#103D42', sku: 'OMNIA-VK-01-M-TEAL', stock: 12 },
          { size: 'L', color: 'Deep Teal', colorHex: '#103D42', sku: 'OMNIA-VK-01-L-TEAL', stock: 5 },
        ],
      },
    },
  });

  // 4. Shipping Rules across Pakistan
  const shippingRules = [
    { city: 'Karachi', province: 'Sindh', charge: 250, freeShippingMinAmount: 10000 },
    { city: 'Lahore', province: 'Punjab', charge: 250, freeShippingMinAmount: 10000 },
    { city: 'Islamabad', province: 'Islamabad Capital Territory', charge: 250, freeShippingMinAmount: 10000 },
    { city: 'Rawalpindi', province: 'Punjab', charge: 250, freeShippingMinAmount: 10000 },
    { city: 'Faisalabad', province: 'Punjab', charge: 300, freeShippingMinAmount: 10000 },
    { city: 'Multan', province: 'Punjab', charge: 300, freeShippingMinAmount: 10000 },
    { city: 'Peshawar', province: 'Khyber Pakhtunkhwa', charge: 350, freeShippingMinAmount: 10000 },
    { city: 'Quetta', province: 'Balochistan', charge: 400, freeShippingMinAmount: 12000 },
  ];

  for (const rule of shippingRules) {
    await prisma.shippingRule.create({ data: rule });
  }

  // 5. Initial Coupons
  await prisma.coupon.create({
    data: {
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 5000,
      maxDiscountAmount: 3000,
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
    },
  });

  await prisma.coupon.create({
    data: {
      code: 'OMNIAFREE',
      discountType: 'FIXED',
      discountValue: 1500,
      minOrderAmount: 20000,
      usageLimit: 50,
      usedCount: 0,
      isActive: true,
    },
  });

  // 6. Complete Database Site Settings Configuration
  const initialSiteConfig = {
    announcementText: 'Nationwide Express Cash On Delivery Across Pakistan • Free Delivery On Orders Above Rs. 10,000',
    announcementEnabled: true,
    storePhone: '03180633323',
    storeEmail: 'wearomniaa@gmail.com',
    storeAddress: 'Lahore, Pakistan',
    instagramUrl: 'https://instagram.com',
    facebookUrl: 'https://facebook.com',
    flatShippingFee: 250,
    freeShippingThreshold: 10000,
    shippingPolicyText: 'All WearOMNIA orders are processed and hand-inspected at our Lahore Atelier. Delivery takes 2-3 business days for major cities (Lahore, Karachi, Islamabad) and 3-5 business days nationwide via Express COD.',
    returnsPolicyText: 'WearOMNIA provides a 7-day exchange window across Pakistan. Items must remain unwashed and unworn with original tags intact.',
    refundPolicyText: 'COD refunds are processed via online bank transfer or store credit coupons within 3-5 business days upon receiving returned suits.',
    heroSlides: [
      {
        id: 1,
        title: 'The Sovereign Velvet Kaftan',
        subtitle: 'FLAGSHIP LAUNCH COLLECTION 2026',
        description: 'Immerse in opulent deep teal micro-velvet hand-embellished with antique gold zari wirework.',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1920&auto=format&fit=crop',
        ctaText: 'Shop Launch Kaftan',
        ctaLink: '/product/the-sovereign-velvet-kaftan',
      },
    ],
  };

  await prisma.siteSettings.create({
    data: {
      key: 'site_config',
      value: JSON.stringify(initialSiteConfig),
    },
  });

  console.log('✅ WearOMNIA database initialized with ZERO demo orders and 1 Flagship Launch Product!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
