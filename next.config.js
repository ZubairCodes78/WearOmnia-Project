/** @type {import('next').NextConfig} */
const remotePatterns = [
  {
    protocol: 'https',
    hostname: 'images.unsplash.com',
  },
  {
    protocol: 'https',
    hostname: 'res.cloudinary.com', // Preserved for legacy image compatibility
  },
  {
    protocol: 'https',
    hostname: 'cdn.shopify.com',
  },
  {
    protocol: 'https',
    hostname: '**.r2.dev',
  },
];

// If a custom Cloudflare R2 public domain is configured (e.g., media.wearomnia.com)
if (process.env.R2_PUBLIC_URL) {
  try {
    const parsed = new URL(process.env.R2_PUBLIC_URL);
    if (parsed.hostname && !remotePatterns.some((p) => p.hostname === parsed.hostname)) {
      remotePatterns.push({
        protocol: parsed.protocol.replace(':', '') || 'https',
        hostname: parsed.hostname,
      });
    }
  } catch {
    // Ignore invalid URL in environment
  }
}

const nextConfig = {
  compress: true,
  images: {
    remotePatterns,
    qualities: [75, 85, 90, 95],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [390, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 64, 128, 256],
    minimumCacheTTL: 2592000, // 30 days
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  devIndicators: false,
  // Permanent 301 redirects for legacy routes, canonical aliases, and moved slugs
  async redirects() {
    return [
      {
        source: '/favicon.jpg',
        destination: '/favicon.ico',
        permanent: true,
      },
      {
        source: '/favicon.png',
        destination: '/icon-32x32.png',
        permanent: true,
      },
      // Standard e-commerce & brand path aliases
      {
        source: '/about',
        destination: '/our-story',
        permanent: true,
      },
      {
        source: '/about-us',
        destination: '/our-story',
        permanent: true,
      },
      {
        source: '/collections',
        destination: '/shop',
        permanent: true,
      },
      {
        source: '/collections/:slug',
        destination: '/collection/:slug',
        permanent: true,
      },
      {
        source: '/products',
        destination: '/shop',
        permanent: true,
      },
      {
        source: '/shipping',
        destination: '/policies/shipping',
        permanent: true,
      },
      {
        source: '/shipping-policy',
        destination: '/policies/shipping',
        permanent: true,
      },
      {
        source: '/returns',
        destination: '/policies/returns',
        permanent: true,
      },
      {
        source: '/return-policy',
        destination: '/policies/returns',
        permanent: true,
      },
      {
        source: '/refund-policy',
        destination: '/policies/refund',
        permanent: true,
      },
      {
        source: '/privacy-policy',
        destination: '/policies/privacy',
        permanent: true,
      },
      {
        source: '/terms-of-service',
        destination: '/policies/terms',
        permanent: true,
      },
      // Permanent redirects for original unhashed product slugs
      {
        source: '/product/midnight-bloom-slub-khaddar-angrakha-3-piece-suit',
        destination: '/product/midnight-bloom-slub-khaddar-angrakha-3-piece-suit-588e',
        permanent: true,
      },
      {
        source: '/product/sea-mist-textured-winter-cotton-shirt',
        destination: '/product/sea-mist-textured-winter-cotton-shirt-71a4',
        permanent: true,
      },
    ];
  },
  // Ensure production headers for caching
  async headers() {
    return [
      {
        source: '/images/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, immutable' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
