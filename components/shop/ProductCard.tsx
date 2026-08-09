'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, ShoppingBag, Zap, Check, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

export interface ProductCardProps {
  id: string;
  title: string;
  slug: string;
  basePrice: number;
  discountPrice?: number | null;
  sku: string;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  inStock: boolean;
  stockQuantity: number;
  images: { url: string; altText?: string | null }[];
  categoryName?: string;
  variants: { size: string; color: string; stock: number }[];
  onQuickView?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  title,
  slug,
  basePrice,
  discountPrice,
  sku,
  isNewArrival,
  isBestSeller,
  inStock,
  stockQuantity,
  images,
  categoryName,
  variants,
  onQuickView,
}) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [addState, setAddState] = useState<'idle' | 'loading' | 'added'>('idle');
  const [buyLoading, setBuyLoading] = useState(false);

  const primaryImage = images[0]?.url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop';
  const secondaryImage = images[1]?.url || primaryImage;

  const inWishlist = isInWishlist(id);
  const activePrice = discountPrice || basePrice;

  const discountPercent = discountPrice
    ? Math.round(((basePrice - discountPrice) / basePrice) * 100)
    : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (addState !== 'idle') return;

    setAddState('loading');
    const firstVariant = variants[0] || { size: 'Standard', color: 'Default', stock: 10 };

    // Brief loading state for premium feel
    setTimeout(() => {
      addToCart({
        productId: id,
        title,
        slug,
        image: primaryImage,
        price: activePrice,
        basePrice,
        size: firstVariant.size,
        color: firstVariant.color,
        sku,
        quantity: 1,
        maxStock: stockQuantity,
      });
      setAddState('added');
      setTimeout(() => setAddState('idle'), 2000);
    }, 400);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (buyLoading) return;

    setBuyLoading(true);
    const firstVariant = variants[0] || { size: 'Standard', color: 'Default', stock: 10 };
    addToCart({
      productId: id,
      title,
      slug,
      image: primaryImage,
      price: activePrice,
      basePrice,
      size: firstVariant.size,
      color: firstVariant.color,
      sku,
      quantity: 1,
      maxStock: stockQuantity,
    });
    setTimeout(() => {
      window.location.href = '/checkout';
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group relative bg-offwhite flex flex-col justify-between"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div>
        {/* Image Container with Smooth Crossfade Hover */}
        <div className="relative aspect-[3/4] w-full bg-sand/60 overflow-hidden rounded-2xl border border-sand/40 transition-all duration-400 group-hover:border-champagne/50 group-hover:shadow-lg group-hover:shadow-champagne/10">
          <Link href={`/product/${slug}`} className="block w-full h-full">
            {/* Primary Image */}
            <Image
              src={primaryImage}
              alt={title}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              loading="lazy"
              quality={85}
              className={`object-cover object-center transition-all duration-500 ${
                isHovered ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
              }`}
            />
            {/* Secondary Image (crossfade) */}
            <Image
              src={secondaryImage}
              alt={`${title} - alternate`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              loading="lazy"
              quality={85}
              className={`object-cover object-center transition-all duration-500 absolute inset-0 ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
            />
          </Link>

          {/* Minimal Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
            {!inStock || stockQuantity <= 0 ? (
              <span className="bg-charcoal/90 backdrop-blur-md text-offwhite text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full">
                Out of Stock
              </span>
            ) : discountPercent > 0 ? (
              <span className="bg-champagne/90 backdrop-blur-md text-teal-950 text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border border-champagne">
                -{discountPercent}%
              </span>
            ) : isNewArrival ? (
              <span className="bg-teal/90 backdrop-blur-md text-champagne text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border border-champagne/30">
                New
              </span>
            ) : null}
          </div>

          {/* Wishlist Heart with Scale Animation */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist({
                productId: id,
                title,
                slug,
                image: primaryImage,
                price: activePrice,
                basePrice,
                sku,
              });
            }}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-offwhite/80 backdrop-blur-md flex items-center justify-center text-charcoal hover:text-red-600 transition-all duration-300 shadow-sm"
            title="Wishlist"
          >
            <motion.div
              animate={inWishlist ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Heart className={`w-3.5 h-3.5 transition-colors duration-300 ${inWishlist ? 'fill-red-600 text-red-600' : ''}`} />
            </motion.div>
          </motion.button>

          {/* Action Overlay Buttons */}
          <div className="absolute inset-x-2 sm:inset-x-3 bottom-2 sm:bottom-3 z-10 flex gap-1.5 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transform sm:translate-y-2 sm:group-hover:translate-y-0 transition-all duration-400 ease-premium">
            {onQuickView && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickView();
                }}
                className="flex-1 bg-offwhite/90 backdrop-blur-md text-teal py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-[10px] uppercase font-bold tracking-wider sm:tracking-widest hover:bg-champagne hover:text-teal transition-all duration-300 flex items-center justify-center gap-1 shadow-md border border-sand/40"
              >
                <Eye className="w-3 h-3" /> <span className="hidden xs:inline">Quick</span> View
              </motion.button>
            )}
            {inStock && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleQuickAdd}
                disabled={addState !== 'idle'}
                className="flex-1 bg-teal text-champagne py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-[10px] uppercase font-bold tracking-wider sm:tracking-widest hover:bg-teal-900 transition-all duration-300 flex items-center justify-center gap-1 shadow-md disabled:opacity-80"
              >
                <AnimatePresence mode="wait">
                  {addState === 'loading' ? (
                    <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Adding...
                    </motion.span>
                  ) : addState === 'added' ? (
                    <motion.span key="added" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-champagne" /> Added
                    </motion.span>
                  ) : (
                    <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" /> + Bag
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )}
          </div>
        </div>

        {/* Product Information */}
        <div className="pt-2.5 sm:pt-3 pb-1 space-y-0.5 sm:space-y-1">
          {categoryName && (
            <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.15em] sm:tracking-[0.2em] font-semibold text-champagne-700 block">
              {categoryName}
            </span>
          )}
          <Link href={`/product/${slug}`} className="block">
            <h3 className="font-serif text-xs sm:text-base font-bold text-teal group-hover:text-champagne-700 transition-colors duration-300 line-clamp-1">
              {title}
            </h3>
          </Link>

          <div className="flex items-baseline gap-1.5 sm:gap-2 pt-0.5">
            <span className="font-sans font-bold text-xs sm:text-xs text-teal">
              Rs. {activePrice.toLocaleString()}
            </span>
            {discountPrice && (
              <span className="text-[10px] sm:text-[11px] text-charcoal-muted line-through">
                Rs. {basePrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Buy Now Button */}
      {inStock && (
        <div className="pt-1">
          <motion.button
            whileHover={{ translateY: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleBuyNow}
            disabled={buyLoading}
            className="w-full bg-sand/60 hover:bg-champagne text-teal py-1.5 rounded-lg text-[9px] sm:text-[10px] uppercase font-bold tracking-wider sm:tracking-widest transition-all duration-300 flex items-center justify-center gap-1 border border-sand/60 disabled:opacity-70"
          >
            {buyLoading ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> Processing...</>
            ) : (
              <><Zap className="w-3 h-3 text-teal" /> Instant COD Checkout</>
            )}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};
