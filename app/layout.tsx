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

export const metadata: Metadata = {
  title: 'WearOMNIA | Simple, Modest & Stylish Clothing',
  description:
    'WearOMNIA offers simple, modest and stylish stitched clothing for women. Modern Pakistani fashion with nationwide Cash On Delivery.',
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
};

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body className="bg-offwhite text-charcoal flex flex-col min-h-screen antialiased">
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <CartDrawer />
              <WhatsAppFloat />
              <SupportAssistant />
              <Footer />
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
