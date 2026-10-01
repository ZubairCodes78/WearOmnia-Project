import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Your Order | WearOMNIA',
  description: 'Track real-time courier dispatch and status for your WearOMNIA Cash On Delivery shipment.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
