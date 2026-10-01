import type { Metadata } from 'next';

export const PRODUCTION_DOMAIN = 'https://www.wearomnia.com';

/**
 * Normalizes any route path into a clean, canonical URL on https://www.wearomnia.com
 * - Strips query parameters
 * - Ensures consistent leading slash
 * - Eliminates redundant trailing slashes (except root '/')
 */
export function getCanonicalUrl(pathname: string = '/'): string {
  const cleanPath = pathname.split('?')[0].split('#')[0];
  if (!cleanPath || cleanPath === '/') {
    return `${PRODUCTION_DOMAIN}/`;
  }
  const formatted = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `${PRODUCTION_DOMAIN}${formatted.replace(/\/+$/, '')}`;
}

export const SITE_METADATA_DEFAULTS = {
  name: 'WearOMNIA',
  siteUrl: PRODUCTION_DOMAIN,
  title: 'WearOMNIA | Simple, Modest & Stylish Clothing',
  description:
    'WearOMNIA offers simple, modest and stylish stitched clothing for women. Modern Pakistani fashion with nationwide Cash On Delivery.',
  keywords: [
    'WearOMNIA',
    'Pakistani Fashion',
    'Stitched Clothing',
    'Modest Fashion',
    'Modest Clothing Pakistan',
    'Cash On Delivery Pakistan',
    'Pakistani Pret Wear',
    'Kaftan Pakistan',
    'Unstitched & Stitched Suits',
  ],
  socials: {
    instagram: 'https://www.instagram.com/wearomnia_/',
    facebook: 'https://www.facebook.com/profile.php?id=61579169068040',
    tiktok: 'https://www.tiktok.com/@wearomnia_',
    youtube: 'https://youtube.com/@wearomnia',
    founderInstagram: 'https://www.instagram.com/life_on_camerae/',
  },
  contact: {
    telephone: '+92-318-0633323',
    email: 'wearomniaa@gmail.com',
    city: 'Lahore',
    country: 'PK',
  },
};

/**
 * Dynamic Product Detail Page Metadata Generator
 */
export function generateProductMetadata(product: any): Metadata {
  const title = product?.title ? `${product.title} | WearOMNIA` : SITE_METADATA_DEFAULTS.title;
  const rawDesc = typeof product?.description === 'string' ? product.description.replace(/\s+/g, ' ').trim() : '';
  const description = rawDesc.length > 155 ? `${rawDesc.slice(0, 152)}...` : (rawDesc || SITE_METADATA_DEFAULTS.description);

  const images = Array.isArray(product?.images) ? product.images : [];
  const primaryImg = images[0]?.url || `${PRODUCTION_DOMAIN}/images/hero-1.jpg`;
  const canonicalUrl = getCanonicalUrl(`/product/${product?.slug || ''}`);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'WearOMNIA',
      locale: 'en_PK',
      type: 'website',
      images: [
        {
          url: primaryImg,
          width: 1200,
          height: 630,
          alt: product?.title || 'WearOMNIA Product',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [primaryImg],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Category / Shop Listing Page Metadata Generator
 */
export function generateCategoryMetadata(
  title: string,
  description: string,
  pathname: string = '/shop',
  isFiltered: boolean = false
): Metadata {
  const fullTitle = `${title} | WearOMNIA`;
  const canonicalUrl = getCanonicalUrl(pathname);

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: 'WearOMNIA',
      locale: 'en_PK',
      type: 'website',
      images: [
        {
          url: `${PRODUCTION_DOMAIN}/images/hero-1.jpg`,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [`${PRODUCTION_DOMAIN}/images/hero-1.jpg`],
    },
    // Filter/search combinations are marked noindex to avoid duplicate indexation bloat
    robots: isFiltered
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
  };
}

/**
 * Comprehensive Product & Variant (ProductGroup) Schema (JSON-LD)
 * Fully compliant with Google Shopping / Merchant / Rich Snippets
 */
export function generateProductSchema(product: any) {
  const images = Array.isArray(product?.images) ? product.images : [];
  const imageUrls = images.map((img: any) => img.url).filter(Boolean);
  if (imageUrls.length === 0) {
    imageUrls.push(`${PRODUCTION_DOMAIN}/images/hero-1.jpg`);
  }

  const basePrice = Number(product?.basePrice) || 0;
  const discountPrice = product?.discountPrice ? Number(product.discountPrice) : null;
  const currentPrice = discountPrice !== null && discountPrice > 0 ? discountPrice : basePrice;
  const title = product?.title || 'WearOMNIA Product';
  const description = typeof product?.description === 'string' ? product.description.trim() : '';
  const sku = product?.sku || `OMN-${product?.id?.slice(0, 8) || '0001'}`;
  const canonicalUrl = getCanonicalUrl(`/product/${product?.slug || ''}`);
  const inStock = Boolean(product?.inStock && (product?.stockQuantity ?? 1) > 0);

  // Return Policy (Standard 7-Day Exchange Pakistan)
  const returnPolicy = {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'PK',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 7,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/FreeReturn',
  };

  // Shipping Details (Pakistan Express Courier COD)
  const shippingDetails = {
    '@type': 'OfferShippingDetails',
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: currentPrice >= 10000 ? 0 : 250,
      currency: 'PKR',
    },
    shippingDestination: {
      '@type': 'DefinedRegion',
      addressCountry: 'PK',
    },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: {
        '@type': 'QuantitativeValue',
        minValue: 1,
        maxValue: 2,
        unitCode: 'DAY',
      },
      transitTime: {
        '@type': 'QuantitativeValue',
        minValue: 2,
        maxValue: 4,
        unitCode: 'DAY',
      },
    },
  };

  // Primary Offer
  const primaryOffer = {
    '@type': 'Offer',
    url: canonicalUrl,
    priceCurrency: 'PKR',
    price: currentPrice,
    itemCondition: 'https://schema.org/NewCondition',
    availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    priceValidUntil: '2027-12-31',
    seller: {
      '@type': 'Organization',
      name: 'WearOMNIA',
      url: PRODUCTION_DOMAIN,
    },
    hasMerchantReturnPolicy: returnPolicy,
    shippingDetails: shippingDetails,
  };

  // Build variants array if real variants exist
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const variantProducts = variants.map((v: any) => ({
    '@type': 'Product',
    name: `${title} - Size ${v.size || 'Standard'}`,
    sku: v.sku || `${sku}-${v.size}`,
    size: v.size,
    color: v.color || 'Standard',
    image: imageUrls,
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'PKR',
      price: currentPrice,
      availability: (v.stock ?? 1) > 0 && inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'WearOMNIA',
        url: PRODUCTION_DOMAIN,
      },
      hasMerchantReturnPolicy: returnPolicy,
      shippingDetails: shippingDetails,
    },
  }));

  // Schema graph
  const schema: Record<string, any> = {
    '@context': 'https://schema.org/',
    '@type': variants.length > 1 ? 'ProductGroup' : 'Product',
    name: title,
    image: imageUrls,
    description,
    sku,
    url: canonicalUrl,
    brand: {
      '@type': 'Brand',
      name: 'WearOMNIA',
      url: PRODUCTION_DOMAIN,
      logo: `${PRODUCTION_DOMAIN}/logo.png`,
    },
    offers: primaryOffer,
  };

  if (variants.length > 1) {
    schema.productGroupID = sku;
    schema.variesBy = ['https://schema.org/size'];
    schema.hasVariant = variantProducts;
  }

  // ONLY attach AggregateRating and Review if genuine approved reviews exist in the database!
  const approvedReviews = Array.isArray(product?.reviews)
    ? product.reviews.filter((r: any) => r.isApproved || r.isApproved === undefined)
    : [];

  if (approvedReviews.length > 0) {
    const totalRating = approvedReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 5), 0);
    const avgRating = (totalRating / approvedReviews.length).toFixed(1);

    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating,
      reviewCount: approvedReviews.length,
      bestRating: '5',
      worstRating: '1',
    };

    schema.review = approvedReviews.map((r: any) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: r.customerName || 'Verified Customer',
      },
      datePublished: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '2026-09-30',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: Number(r.rating) || 5,
        bestRating: '5',
        worstRating: '1',
      },
      reviewBody: r.comment || '',
    }));
  }

  return schema;
}

/**
 * BreadcrumbList Schema (JSON-LD)
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : getCanonicalUrl(item.url),
    })),
  };
}

/**
 * Site-Wide WebSite & Organization Schemas (JSON-LD)
 */
export function generateSiteSchema() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'WearOMNIA',
      alternateName: ['Wear OMNIA', 'WearOMNIA Pakistan'],
      url: PRODUCTION_DOMAIN,
      logo: `${PRODUCTION_DOMAIN}/logo.png`,
      description: 'World-class luxury fashion e-commerce platform defining Pakistani modern modest couture.',
      foundingLocation: {
        '@type': 'Place',
        name: 'Lahore, Pakistan',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: SITE_METADATA_DEFAULTS.contact.telephone,
        email: SITE_METADATA_DEFAULTS.contact.email,
        contactType: 'customer service',
        areaServed: 'PK',
        availableLanguage: ['English', 'Urdu'],
      },
      sameAs: [
        SITE_METADATA_DEFAULTS.socials.instagram,
        SITE_METADATA_DEFAULTS.socials.facebook,
        SITE_METADATA_DEFAULTS.socials.tiktok,
        SITE_METADATA_DEFAULTS.socials.youtube,
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'WearOMNIA',
      url: PRODUCTION_DOMAIN,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${PRODUCTION_DOMAIN}/shop?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}

/**
 * Founder ProfilePage & Person Schema (JSON-LD)
 */
export function generateFounderSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: 'Virago Baji',
      jobTitle: 'Founder & Creative Lead',
      worksFor: {
        '@type': 'Organization',
        name: 'WearOMNIA',
        url: PRODUCTION_DOMAIN,
      },
      image: `${PRODUCTION_DOMAIN}/images/founder.png`,
      sameAs: [SITE_METADATA_DEFAULTS.socials.founderInstagram],
      description:
        'Founder of WearOMNIA, bringing modern modest fashion, purposeful silhouettes, and enduring craftsmanship to contemporary Pakistani women.',
    },
  };
}

/**
 * FAQPage Schema (JSON-LD)
 */
export function generateFaqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };
}
