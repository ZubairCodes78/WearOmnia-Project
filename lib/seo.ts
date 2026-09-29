import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wearomnia.com';

export function generateProductMetadata(product: any): Metadata {
  const images = Array.isArray(product?.images) ? product.images : [];
  const image = images[0]?.url || `${BASE_URL}/images/hero-1.jpg`;
  const basePrice = Number(product?.basePrice) || 0;
  const discountPrice = product?.discountPrice ? Number(product.discountPrice) : null;
  const price = (discountPrice !== null && discountPrice > 0) ? discountPrice : basePrice;
  const title = product?.title || 'WearOMNIA Product';
  const description = typeof product?.description === 'string' ? product.description.slice(0, 160) : '';
  const slug = product?.slug || '';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/product/${slug}`,
      siteName: 'WearOMNIA',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export function generateCategoryMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'WearOMNIA',
    },
  };
}

export function generateProductSchema(product: any) {
  const images = Array.isArray(product?.images) ? product.images : [];
  const image = images[0]?.url || '';
  const basePrice = Number(product?.basePrice) || 0;
  const discountPrice = product?.discountPrice ? Number(product.discountPrice) : null;
  const price = (discountPrice !== null && discountPrice > 0) ? discountPrice : basePrice;
  const title = product?.title || 'WearOMNIA Product';
  const description = typeof product?.description === 'string' ? product.description : '';
  const sku = product?.sku || '';
  const slug = product?.slug || '';

  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: title,
    image: image ? [image] : [],
    description,
    sku,
    brand: {
      '@type': 'Brand',
      name: 'WearOMNIA',
    },
    offers: {
      '@type': 'Offer',
      url: `${BASE_URL}/product/${slug}`,
      priceCurrency: 'PKR',
      price: price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product?.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };
}
