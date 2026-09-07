import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat';
import { SupportAssistant } from '@/components/layout/SupportAssistant';
import { ToastProvider } from '@/components/layout/ToastProvider';
import { FlyToCartProvider } from '@/components/cart/FlyToCartProvider';

// ─── Coming Soon Switch ──────────────────────────────────────────────────────
// Set COMING_SOON="true" in .env to show the Coming Soon page to public visitors.
// All underlying routes (/shop, /admin, /api …) remain fully functional.
// To go live: change to COMING_SOON="false" or remove the line entirely.
const IS_COMING_SOON = process.env.COMING_SOON === 'true';

// ─── Metadata ────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: IS_COMING_SOON
      ? 'WearOMNIA — Coming Soon'
      : 'WearOMNIA | Simple, Modest & Stylish Clothing',
    template: '%s | WearOMNIA',
  },
  description: IS_COMING_SOON
    ? 'WearOMNIA — premium modest fashion for Pakistani women. Coming soon. Follow us for launch updates.'
    : 'WearOMNIA offers simple, modest and stylish stitched clothing for women. Modern Pakistani fashion with nationwide Cash On Delivery.',
  keywords: [
    'WearOMNIA',
    'Pakistani Fashion',
    'Stitched Clothing',
    'Modest Fashion',
    'Cash On Delivery Pakistan',
  ],
  authors: [{ name: 'WearOMNIA' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://wearomnia.com'),
  icons: {
    icon: '/favicon.jpg',
    shortcut: '/favicon.jpg',
    apple: '/favicon.jpg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    url: '/',
    siteName: 'WearOMNIA',
    title: IS_COMING_SOON
      ? 'WearOMNIA — Coming Soon'
      : 'WearOMNIA | Simple, Modest & Stylish Clothing',
    description: IS_COMING_SOON
      ? 'WearOMNIA — premium modest fashion for Pakistani women. Coming soon.'
      : 'WearOMNIA offers simple, modest and stylish stitched clothing for women. Modern Pakistani fashion with nationwide Cash On Delivery.',
    images: [
      {
        url: '/images/hero-1.jpg',
        width: 1200,
        height: 630,
        alt: 'WearOMNIA modest fashion collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: IS_COMING_SOON
      ? 'WearOMNIA — Coming Soon'
      : 'WearOMNIA | Simple, Modest & Stylish Clothing',
    description: IS_COMING_SOON
      ? 'WearOMNIA — premium modest fashion for Pakistani women. Coming soon.'
      : 'WearOMNIA offers simple, modest and stylish stitched clothing for women. Modern Pakistani fashion with nationwide Cash On Delivery.',
    images: ['/images/hero-1.jpg'],
  },
};

// ─── JSON-LD Org Schema ──────────────────────────────────────────────────────
const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'WearOMNIA',
  url: 'https://wearomnia.com',
  logo: 'https://wearomnia.com/logo.png',
  description: 'World-class luxury fashion e-commerce platform defining Pakistani haute couture.',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+92-318-0633323',
    contactType: 'customer service',
    areaServed: 'PK',
    availableLanguage: ['English', 'Urdu'],
  },
};

// ─── Root Layout ─────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Coming Soon: stripped layout — no Header / Footer / Cart ──────────────
  if (IS_COMING_SOON) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
          />
          {/* Instrument Serif — italic luxury headline on Coming Soon page */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Jost:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="bg-offwhite text-charcoal antialiased" suppressHydrationWarning>
          {children}
        </body>
      </html>
    );
  }

  // ── Live Storefront: full store chrome ────────────────────────────────────
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body
        className="bg-offwhite text-charcoal flex flex-col min-h-screen antialiased"
        suppressHydrationWarning
      >
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              <FlyToCartProvider>
                <Header />
                <main className="flex-1">{children}</main>
                <CartDrawer />
                <WhatsAppFloat />
                <SupportAssistant />
                <Footer />
              </FlyToCartProvider>
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
