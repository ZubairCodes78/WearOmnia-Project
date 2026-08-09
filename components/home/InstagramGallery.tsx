import React from 'react';
import Image from 'next/image';
import { Instagram } from 'lucide-react';

const INSTA_PHOTOS = [
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=600&auto=format&fit=crop',
];

export const InstagramGallery = () => {
  return (
    <section className="py-20 bg-offwhite">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10">
        <span className="text-xs uppercase tracking-[0.3em] font-semibold text-champagne-700">
          Social Editorial
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-teal mt-1">
          Follow @WearOMNIA On Instagram
        </h2>
        <p className="text-xs text-charcoal-muted mt-2">
          Tag #WearOMNIA to be featured in our luxury client spotlight gallery.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {INSTA_PHOTOS.map((src, i) => (
          <a
            key={i}
            href="https://www.instagram.com/wearomnia_/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden bg-sand block"
          >
            <Image
              src={src}
              alt={`Instagram post ${i + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
              loading="lazy"
              quality={85}
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-teal-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-champagne">
              <Instagram className="w-8 h-8" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};
