import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const CATEGORIES = [
  {
    title: 'Unstitched Luxury Lawn',
    subtitle: 'Printed & Schiffli 3-Piece',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
    link: '/shop?category=unstitched-lawn',
    span: 'col-span-1 md:col-span-2 row-span-1',
  },
  {
    title: 'Velvet Royale',
    subtitle: 'Micro-Velvet & Gold Zari',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
    link: '/shop?category=velvet-couture',
    span: 'col-span-1 row-span-1',
  },
  {
    title: 'Silk & Chiffon',
    subtitle: '100% Pure Silk Dupattas',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800&auto=format&fit=crop',
    link: '/shop?category=silk-edition',
    span: 'col-span-1 row-span-1',
  },
  {
    title: 'Festive Pret',
    subtitle: 'Ready To Wear Silhouettes',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop',
    link: '/shop?category=festive-pret',
    span: 'col-span-1 md:col-span-2 row-span-1',
  },
];

export const CategoryGrid = () => {
  return (
    <section className="py-20 bg-offwhite">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-champagne-700">
              Curated Selection
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-teal mt-1">
              Explore Our Categories
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs uppercase tracking-widest font-semibold text-teal hover:text-champagne-700 flex items-center gap-1 mt-4 md:mt-0 transition-colors"
          >
            View All Collections <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {CATEGORIES.map((cat, idx) => (
            <Link
              key={cat.title}
              href={cat.link}
              className={`group relative h-96 rounded-2xl overflow-hidden shadow-lg ${cat.span}`}
            >
              <Image
                src={cat.image}
                alt={cat.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-teal-950/90 via-teal-950/30 to-transparent group-hover:via-teal-950/50 transition-all" />

              <div className="absolute inset-0 p-8 flex flex-col justify-end text-offwhite">
                <span className="text-xs uppercase tracking-widest text-champagne font-medium">
                  {cat.subtitle}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-offwhite mt-1 group-hover:text-champagne transition-colors">
                  {cat.title}
                </h3>
                <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-champagne opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                  <span>Discover Now</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
