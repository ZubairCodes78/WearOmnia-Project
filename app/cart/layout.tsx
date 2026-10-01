import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Bag | WearOMNIA',
  description: 'Your selected modest fashion items at WearOMNIA.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
