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
