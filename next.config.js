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
  images: {
    remotePatterns,
    qualities: [75, 85, 90],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  devIndicators: false,
};

module.exports = nextConfig;
