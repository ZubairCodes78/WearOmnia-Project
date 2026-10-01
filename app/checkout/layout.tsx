import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Secure Checkout | WearOMNIA',
  description: '1-Click guest checkout with Cash On Delivery nationwide across Pakistan.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
