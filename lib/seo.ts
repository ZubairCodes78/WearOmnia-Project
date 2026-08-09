import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wearomnia.com';

export function generateProductMetadata(product: any): Metadata {
  const image = product.images[0]?.url || `${BASE_URL}/og-default.jpg`;
  const price = product.discountPrice || product.basePrice;

  return {
    title: `${product.title} | WearOMNIA Luxury Fashion`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: `${product.title} - WearOMNIA`,
      description: product.description.slice(0, 160),
      url: `${BASE_URL}/product/${product.slug}`,
      siteName: 'WearOMNIA',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: product.title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: product.description.slice(0, 160),
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
  const image = product.images[0]?.url || '';
  const price = product.discountPrice || product.basePrice;

  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.title,
    image: [image],
    description: product.description,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: 'WearOMNIA',
    },
    offers: {
      '@type': 'Offer',
      url: `${BASE_URL}/product/${product.slug}`,
      priceCurrency: 'PKR',
      price: price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };
}
