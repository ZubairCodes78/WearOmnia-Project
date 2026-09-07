'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Zap, Check, ShieldCheck, Truck, Ruler } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { SizeGuideModal } from './SizeGuideModal';
import { useFlyToCart } from '@/components/cart/FlyToCartProvider';

interface QuickViewModalProps {
  product: {
    id: string;
    title: string;
    slug: string;
    description: string;
    basePrice: number;
    discountPrice?: number | null;
    sku: string;
    inStock: boolean;
    stockQuantity: number;
    images: { url: string }[];
    variants: { size: string; color: string; stock: number }[];
  } | null;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const { triggerFlyToCart } = useFlyToCart();
  const modalImageRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  if (!product) return null;

  const sizes = Array.from(new Set(product.variants.map((v) => v.size)));
  const colors = Array.from(new Set(product.variants.map((v) => v.color)));

  const currentSize = selectedSize || sizes[0] || 'Standard';
  const currentColor = selectedColor || colors[0] || 'Default';

  const activePrice = product.discountPrice || product.basePrice;

  const handleAddToCart = () => {
    const currentImgSrc = product.images[selectedImage]?.url || product.images[0]?.url || '';
    const imgEl = modalImageRef.current?.querySelector('img') || modalImageRef.current;

    triggerFlyToCart(imgEl, currentImgSrc, () => {
      addToCart({
        productId: product.id,
        title: product.title,
        slug: product.slug,
        image: currentImgSrc,
        price: activePrice,
        basePrice: product.basePrice,
        size: currentSize,
        color: currentColor,
        sku: product.sku,
        quantity,
        maxStock: product.stockQuantity,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 800);
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    window.location.href = '/checkout';
  };

  return (
    <>
      <AnimatePresence>
        {product && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/70 flex items-center justify-center p-3 sm:p-6"
              onClick={onClose}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="bg-offwhite w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative border border-champagne"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-sand hover:bg-champagne flex items-center justify-center text-charcoal transition-colors shadow"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Gallery Side */}
                  <div className="p-4 sm:p-6 bg-sand/50 flex flex-col justify-between">
                    <div ref={modalImageRef} className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md border border-sand">
                      <Image
                        src={product.images[selectedImage]?.url || product.images[0]?.url}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {product.images.length > 1 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                        {product.images.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedImage(i)}
                            className={`relative w-14 h-18 sm:w-16 sm:h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${selectedImage === i ? 'border-teal shadow-md scale-105' : 'border-transparent opacity-70'
                              }`}
                          >
                            <Image src={img.url} alt="thumbnail" fill className="object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Details & Variant Picker */}
                  <div className="p-5 sm:p-8 flex flex-col justify-between space-y-4 sm:space-y-6">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-champagne-700">
                        SKU: {product.sku}
                      </span>
                      <h2 className="font-serif text-2xl font-bold text-teal mt-1">{product.title}</h2>

                      <div className="flex items-baseline gap-3 mt-2">
                        <span className="font-serif text-2xl font-bold text-teal">
                          Rs. {activePrice.toLocaleString()}
                        </span>
                        {product.discountPrice && (
                          <span className="text-sm text-charcoal-muted line-through">
                            Rs. {product.basePrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-charcoal-muted mt-3 line-clamp-3 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {/* Sizes */}
                    {sizes.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs uppercase font-semibold text-charcoal">
                            Select Size:
                          </label>
                          <button
                            onClick={() => setSizeGuideOpen(true)}
                            className="text-[11px] text-teal underline font-normal cursor-pointer hover:text-champagne-700 transition-colors flex items-center gap-1"
                          >
                            <Ruler className="w-3 h-3" /> Size Guide
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {sizes.map((sz) => (
                            <button
                              key={sz}
                              onClick={() => setSelectedSize(sz)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase border transition-all ${currentSize === sz
                                ? 'bg-teal text-champagne border-teal shadow-sm'
                                : 'bg-sand text-charcoal border-sand hover:border-champagne'
                                }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Colors */}
                    {colors.length > 0 && (
                      <div>
                        <label className="text-xs uppercase font-semibold text-charcoal block mb-2">
                          Select Color:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {colors.map((c) => (
                            <button
                              key={c}
                              onClick={() => setSelectedColor(c)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase border transition-all ${currentColor === c
                                ? 'bg-teal text-champagne border-teal shadow-sm'
                                : 'bg-sand text-charcoal border-sand hover:border-champagne'
                                }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quantity and Actions */}
                    <div className="space-y-3 pt-4 border-t border-sand">
                      <div className="flex gap-3">
                        <button
                          onClick={handleAddToCart}
                          className="flex-1 bg-teal text-champagne py-3.5 rounded-xl text-xs uppercase font-bold tracking-widest hover:bg-teal-900 transition-all flex items-center justify-center gap-2 shadow-md"
                        >
                          {added ? (
                            <>
                              <Check className="w-4 h-4 text-champagne" /> Added To Bag
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-4 h-4" /> Add To Bag
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleBuyNow}
                          className="flex-1 bg-champagne text-teal-950 py-3.5 rounded-xl text-xs uppercase font-bold tracking-widest hover:bg-sand transition-all flex items-center justify-center gap-2 shadow-md"
                        >
                          <Zap className="w-4 h-4 text-teal" /> Buy Now
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-charcoal-muted pt-2">
                        <span className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-teal" /> Nationwide COD Delivery
                        </span>
                        <Link
                          href={`/product/${product.slug}`}
                          onClick={onClose}
                          className="text-teal font-semibold hover:underline"
                        >
                          View Full Product Details →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        productId={product.id}
      />
    </>
  );
};