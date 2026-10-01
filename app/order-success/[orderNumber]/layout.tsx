import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Confirmed | WearOMNIA',
  description: 'Thank you for your WearOMNIA order. Your parcel will be dispatched promptly via Cash On Delivery.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function OrderSuccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
