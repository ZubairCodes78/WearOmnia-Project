import type { Metadata } from 'next';
import './globals.css';
import { Plus_Jakarta_Sans, Instrument_Serif, Jost } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat';
import { LazySupportAssistant } from '@/components/layout/LazySupportAssistant';
import { ToastProvider } from '@/components/layout/ToastProvider';
import { FlyToCartProvider } from '@/components/cart/FlyToCartProvider';
import { getPublicSiteSettings } from '@/lib/settings';
import { getCampaignPhase } from '@/lib/preorder';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';

// ─── Fonts via next/font (self-hosted, no render-blocking external requests) ──
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-jakarta',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument',
  display: 'swap',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-jost',
  display: 'swap',
});

const fontVars = `${plusJakartaSans.variable} ${instrumentSerif.variable} ${jost.variable}`;

function isComingSoonMode(): boolean {
  const envComingSoon =
    process.env.NEXT_PUBLIC_COMING_SOON === 'true' ||
    process.env.COMING_SOON === 'true';

  const phase = getCampaignPhase();
  return envComingSoon && phase === 'BEFORE_LAUNCH';
}

// ─── Metadata ────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: isComingSoonMode()
      ? 'WearOMNIA — Coming Soon'
      : 'WearOMNIA | Simple, Modest & Stylish Clothing',
    template: '%s | WearOMNIA',
  },
  description: isComingSoonMode()
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
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    url: '/',
    siteName: 'WearOMNIA',
    title: isComingSoonMode()
      ? 'WearOMNIA — Coming Soon'
      : 'WearOMNIA | Simple, Modest & Stylish Clothing',
    description: isComingSoonMode()
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
    title: isComingSoonMode()
      ? 'WearOMNIA — Coming Soon'
      : 'WearOMNIA | Simple, Modest & Stylish Clothing',
    description: isComingSoonMode()
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
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialSettings = await getPublicSiteSettings();

  // ── Coming Soon: stripped layout — no Header / Footer / Cart ──────────────
  if (isComingSoonMode()) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
          />
        </head>
        <body className={`bg-offwhite text-charcoal antialiased ${fontVars}`} suppressHydrationWarning>
          <GoogleAnalytics />
          <SettingsProvider initialSettings={initialSettings}>
            <CartProvider>
              <WishlistProvider>
                <ToastProvider>
                  <FlyToCartProvider>
                    {children}
                  </FlyToCartProvider>
                </ToastProvider>
              </WishlistProvider>
            </CartProvider>
          </SettingsProvider>
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
        className={`bg-offwhite text-charcoal flex flex-col min-h-screen antialiased ${fontVars}`}
        suppressHydrationWarning
      >
        <GoogleAnalytics />
        <SettingsProvider initialSettings={initialSettings}>
          <CartProvider>
            <WishlistProvider>
              <ToastProvider>
                <FlyToCartProvider>
                  <Header />
                  <main className="flex-1">{children}</main>
                  <CartDrawer />
                  <WhatsAppFloat />
                  <LazySupportAssistant />
                  <Footer />
                </FlyToCartProvider>
              </ToastProvider>
            </WishlistProvider>
          </CartProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
