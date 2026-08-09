'use client';

import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const REVIEWS = [
  {
    id: 1,
    name: 'Ayesha Malik',
    location: 'Lahore',
    suit: 'The Sovereign Velvet Kaftan',
    rating: 5,
    comment: 'The stitching and fabric texture exceed expectations! Truly luxury couture quality. The COD delivery arrived within 2 days in Lahore with pristine box packaging.',
  },
  {
    id: 2,
    name: 'Saima Chaudhry',
    location: 'Islamabad',
    suit: 'Noor-e-Zahra Embroidered Silk Suit',
    rating: 5,
    comment: 'WearOMNIA never fails to impress. The champagne gold embroidery is subtle yet breathtaking. Received so many compliments at my family dinner!',
  },
  {
    id: 3,
    name: 'Zainab Ahmed',
    location: 'Karachi',
    suit: 'Gul-e-Rana Unstitched Luxury Lawn',
    rating: 5,
    comment: 'The Bamber chiffon dupatta is so soft and light! Super fast dispatch to Karachi. Ordering COD without needing an account was effortless.',
  },
];

export const ReviewsCarousel = () => {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((prev) => (prev + 1) % REVIEWS.length);
  const prev = () => setIndex((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);

  return (
    <section className="py-20 bg-teal text-offwhite relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <Quote className="w-12 h-12 text-champagne/40 mx-auto mb-4" />
        <span className="text-xs uppercase tracking-[0.3em] font-semibold text-champagne">
          Client Endorsements
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-offwhite mt-2 mb-10">
          Loved Across Pakistan
        </h2>

        <div className="bg-teal-900/80 p-8 sm:p-12 rounded-3xl border border-champagne/30 shadow-2xl relative">
          <div className="flex justify-center gap-1 mb-4 text-champagne">
            {[...Array(REVIEWS[index].rating)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-current" />
            ))}
          </div>

          <p className="font-serif text-lg sm:text-2xl text-offwhite/90 italic leading-relaxed mb-6 font-normal">
            "{REVIEWS[index].comment}"
          </p>

          <div>
            <h4 className="font-serif text-base font-bold text-champagne">{REVIEWS[index].name}</h4>
            <p className="text-xs text-offwhite/60 font-sans">{REVIEWS[index].location} • Purchased: {REVIEWS[index].suit}</p>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-teal-800">
            <button
              onClick={prev}
              className="p-2 rounded-full border border-champagne/40 text-champagne hover:bg-champagne hover:text-teal transition-all"
              aria-label="Previous review"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              {REVIEWS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    index === i ? 'w-8 bg-champagne' : 'w-2 bg-offwhite/30'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="p-2 rounded-full border border-champagne/40 text-champagne hover:bg-champagne hover:text-teal transition-all"
              aria-label="Next review"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
