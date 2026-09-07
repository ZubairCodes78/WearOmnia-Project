'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Check, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useFlyToCart } from '@/components/cart/FlyToCartProvider';

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
  const { triggerFlyToCart } = useFlyToCart();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [addState, setAddState] = useState<'idle' | 'loading' | 'added'>('idle');

  const primaryImage = images[0]?.url || '/images/kaftan-1.jpg';
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

    // Trigger visual luxury fly-to-cart animation, synchronized with arrival in the cart
    const imgEl =
      (e.currentTarget.closest('.group')?.querySelector('img') as HTMLElement) ||
      cardRef.current?.querySelector('img') ||
      null;

    triggerFlyToCart(imgEl, primaryImage, () => {
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
      setTimeout(() => setAddState('idle'), 800);
    });
  };



  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group relative bg-offwhite flex flex-col justify-between card-3d-subtle rounded-2xl p-2 sm:p-2.5 border border-sand/40 hover:border-champagne/40 hover:bg-white transition-all duration-400"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div>
        {/* Image Container with Smooth Crossfade Hover and 3D Depth */}
        <div className="relative aspect-[3/4] w-full bg-sand/40 overflow-hidden rounded-xl border border-sand/60 transition-all duration-500 group-hover:border-champagne/50 group-hover:shadow-lg group-hover:shadow-champagne/10">
          <Link href={`/product/${slug}`} className="block w-full h-full">
            {/* Primary Image */}
            <Image
              src={primaryImage}
              alt={images[0]?.altText || `${title} product image`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              loading="lazy"
              quality={85}
              className={`object-cover object-center transition-all duration-700 ease-premium ${isHovered ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
                }`}
            />
            {/* Secondary Image (crossfade) */}
            <Image
              src={secondaryImage}
              alt={images[1]?.altText || `${title} alternate product view`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              loading="lazy"
              quality={85}
              className={`object-cover object-center transition-all duration-700 ease-premium absolute inset-0 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                }`}
            />
          </Link>

          {/* 3D Minimal Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {!inStock || stockQuantity <= 0 ? (
              <span className="badge-3d bg-charcoal/90 backdrop-blur-md text-offwhite text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border border-white/20">
                Out of Stock
              </span>
            ) : discountPercent > 0 ? (
              <span className="badge-3d bg-champagne text-teal-950 text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full border border-white/40 shadow-sm">
                -{discountPercent}% OFF
              </span>
            ) : isNewArrival ? (
              <span className="badge-3d bg-teal text-champagne text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full border border-champagne/40 shadow-sm">
                New Arrival
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
            className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-offwhite/90 backdrop-blur-md flex items-center justify-center text-charcoal hover:text-red-600 transition-all duration-300 shadow-sm hover:scale-110"
            title="Wishlist"
            aria-label="Save to wishlist"
          >
            <motion.div
              animate={inWishlist ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Heart className={`w-3.5 h-3.5 transition-colors duration-300 ${inWishlist ? 'fill-red-600 text-red-600' : ''}`} />
            </motion.div>
          </motion.button>
        </div>

        {/* Product Information */}
        <div className="pt-2.5 sm:pt-3 pb-1 space-y-1">
          <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-champagne-700 block truncate">
            {categoryName || (isNewArrival ? 'New Arrivals' : 'Ready-to-Wear')}
          </span>
          <Link href={`/product/${slug}`} className="block">
            <h3 className="font-serif text-sm sm:text-base font-bold text-teal group-hover:text-champagne-700 transition-colors duration-300 line-clamp-1">
              {title}
            </h3>
          </Link>

          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="font-sans font-black text-sm sm:text-base text-teal">
              Rs. {activePrice.toLocaleString()}
            </span>
            {discountPrice && (
              <span className="text-xs text-charcoal-muted line-through font-medium">
                Rs. {basePrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Primary Action & Humor Micro-copy */}
      <div className="pt-2.5 mt-1 space-y-1.5 border-t border-sand/30">
        {/* Single Primary Action: + Add to Bag */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleQuickAdd}
          disabled={!inStock || stockQuantity <= 0 || addState !== 'idle'}
          className="w-full min-h-[44px] h-11 bg-teal text-champagne rounded-xl text-xs uppercase font-extrabold tracking-wider hover:bg-teal-900 transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer border border-champagne/20 select-none"
          aria-label={inStock ? `Add ${title} to bag` : `${title} is out of stock`}
        >
          <AnimatePresence mode="wait">
            {addState === 'loading' ? (
              <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding...
              </motion.span>
            ) : addState === 'added' ? (
              <motion.span key="added" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-xs text-champagne font-black">
                <Check className="w-3.5 h-3.5 text-champagne" /> Added to Bag!
              </motion.span>
            ) : !inStock || stockQuantity <= 0 ? (
              <span key="out">Out of Stock</span>
            ) : (
              <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" /> + Add to Bag
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Small Humorous Micro-copy */}
        <p className="text-[10px] text-charcoal-muted/80 text-center font-sans italic line-clamp-1 select-none">
          Good choice. Your wardrobe approves.
        </p>
      </div>
    </motion.div>
  );
};
