'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  ShoppingBag,
  Zap,
  Heart,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  ChevronRight,
  Maximize2,
  X,
  Plus,
  Minus,
  CheckCircle2,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useFlyToCart } from '@/components/cart/FlyToCartProvider';
import { ProductCard } from '@/components/shop/ProductCard';
import { SizeGuideModal } from '@/components/shop/SizeGuideModal';
import { ProductImageZoom } from '@/components/shop/ProductImageZoom';
import { useSettings } from '@/context/SettingsContext';

interface ProductClientProps {
  product: any;
  relatedProducts: any[];
  defaultAdvancePercent?: number;
}

export const ProductClient: React.FC<ProductClientProps> = ({
  product,
  relatedProducts,
  defaultAdvancePercent = 50,
}) => {
  const { settings } = useSettings();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { triggerFlyToCart } = useFlyToCart();
  const mainImageRef = useRef<HTMLDivElement>(null);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.variants[0]?.size || 'Standard');
  const [selectedColor, setSelectedColor] = useState(product.variants[0]?.color || 'Default');
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const [activeTab, setActiveTab] = useState<'fabric' | 'care' | 'shipping' | 'returns'>('fabric');

  // Review Form state
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const images = product.images.length > 0 ? product.images : [{ url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop' }];
  const activePrice = product.discountPrice || product.basePrice;
  const isWish = isInWishlist(product.id);

  // Dynamic Pre-Order Advance Calculation from Single Source of Truth
  const advancePercent = product.preOrderAdvancePercent ?? settings.preorder_advance_percent ?? defaultAdvancePercent ?? 50;
  const advanceAmount = Math.round((activePrice * advancePercent) / 100);
  const remainingAmount = Math.max(0, activePrice - advanceAmount);

  const sizes = Array.from(new Set(product.variants.map((v: any) => v.size))) as string[];
  const colors = Array.from(new Set(product.variants.map((v: any) => v.color))) as string[];

  // Selected Variant Stock Check
  const currentVariant = product.variants.find(
    (v: any) => v.size === selectedSize && v.color === selectedColor
  ) || product.variants[0];

  const currentStock = currentVariant ? currentVariant.stock : product.stockQuantity;

  const handleAddToCart = () => {
    const currentImgSrc = images[selectedImageIndex]?.url || images[0]?.url || '';
    const imgEl = mainImageRef.current?.querySelector('img') || mainImageRef.current;

    triggerFlyToCart(imgEl, currentImgSrc, () => {
      addToCart({
        productId: product.id,
        title: product.title,
        slug: product.slug,
        image: currentImgSrc,
        price: activePrice,
        basePrice: product.basePrice,
        size: selectedSize,
        color: selectedColor,
        sku: product.sku,
        quantity,
        maxStock: product.isPreOrder ? 999 : currentStock,
        isPreOrder: Boolean(product.isPreOrder),
      });
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 800);
    });
  };

  const handleBuyNow = () => {
    addToCart({
      productId: product.id,
      title: product.title,
      slug: product.slug,
      image: images[0]?.url,
      price: activePrice,
      basePrice: product.basePrice,
      size: selectedSize,
      color: selectedColor,
      sku: product.sku,
      quantity,
      maxStock: product.isPreOrder ? 999 : currentStock,
      isPreOrder: Boolean(product.isPreOrder),
    });
    window.location.href = '/checkout';
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) return;

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          customerName: reviewName,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      if (res.ok) {
        setReviewSubmitted(true);
        setReviewName('');
        setReviewComment('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  return (
    <div className="editorial-page !py-8 !pb-24 sm:!pb-8">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-center gap-2 text-xs text-charcoal-muted uppercase tracking-wider">
          <Link href="/" className="hover:text-teal">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/shop" className="hover:text-teal">Shop</Link>
          {product.category && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href={`/shop?category=${product.category.slug}`} className="hover:text-teal">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-teal font-semibold truncate max-w-xs">{product.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Gallery Column */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex sm:flex-col gap-2 sm:gap-3 overflow-x-auto sm:overflow-x-hidden sm:overflow-y-auto shrink-0 sm:max-h-[600px] pb-1 sm:pb-0 no-scrollbar">
                {images.map((img: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${selectedImageIndex === i
                      ? 'border-teal shadow-md scale-105'
                      : 'border-sand opacity-70 hover:opacity-100'
                      }`}
                  >
                    <Image
                      src={img.url}
                      alt="thumb"
                      fill
                      sizes="(max-width: 640px) 64px, 80px"
                      loading="lazy"
                      quality={85}
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image with Zoom & Lightbox Trigger */}
            <div ref={mainImageRef} className="flex-1">
              <ProductImageZoom
                src={images[selectedImageIndex]?.url}
                alt={product.title}
                priority
                onOpenLightbox={() => setLightboxOpen(true)}
              />
            </div>
          </div>

          {/* Right: Product Purchase Details */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs uppercase tracking-[0.22em] font-bold text-champagne-700">
                SKU: {product.sku} • {product.category?.name || 'Exclusive Collection'}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-black text-teal mt-1 tracking-tight">
                {product.title}
              </h1>

              {/* Price & Rating */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pb-4 border-b border-sand/80">
                <div className="space-y-1">
                  <div className="flex items-baseline gap-3">
                    <span className="font-sans text-3xl sm:text-4xl font-black text-teal">
                      Rs. {activePrice.toLocaleString()}
                    </span>
                    {product.discountPrice && (
                      <>
                        <span className="text-sm sm:text-base text-charcoal-muted line-through font-medium">
                          Rs. {product.basePrice.toLocaleString()}
                        </span>
                        <span className="badge-3d bg-champagne text-teal-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-champagne/40">
                          SAVE Rs. {(product.basePrice - product.discountPrice).toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>

                  {product.isPreOrder && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md">
                        PRE-ORDER
                      </span>
                      <span className="text-xs font-semibold text-amber-900 font-sans">
                        {advancePercent}% advance required: <strong className="font-mono text-teal">Rs. {advanceAmount.toLocaleString()}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-champagne text-xs font-bold">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current text-champagne" />
                    ))}
                  </div>
                  <span className="text-charcoal-muted font-sans font-medium">({product.reviews.length} Verified Reviews)</span>
                </div>
              </div>
            </div>

            {/* Pre-Order Information Card */}
            {product.isPreOrder && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2.5 font-sans">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                    Pre-Order Garment
                  </span>
                  {product.preOrderEstimatedAvailability && (
                    <span className="text-xs font-semibold text-amber-900 bg-amber-200/60 px-2.5 py-0.5 rounded-md">
                      Est. Arrival: {product.preOrderEstimatedAvailability}
                    </span>
                  )}
                </div>

                {/* Clear Financial Split */}
                <div className="grid grid-cols-2 gap-2 bg-white/70 p-3 rounded-xl border border-amber-200 text-xs">
                  <div>
                    <span className="text-charcoal-muted block text-[10px]">Amount Required Now ({advancePercent}%):</span>
                    <span className="font-serif font-bold text-amber-900 text-sm">
                      Rs. {advanceAmount.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-charcoal-muted block text-[10px]">Remaining on Delivery (COD):</span>
                    <span className="font-serif font-bold text-teal text-sm">
                      Rs. {remainingAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-amber-950/80 leading-relaxed">
                  {product.preOrderNote ||
                    `This artisan garment is handcrafted upon reservation. Submit your ${advancePercent}% advance payment proof at checkout to confirm production.`}
                </p>
              </div>
            )}

            {/* Size Selection */}
            {sizes.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="uppercase text-charcoal tracking-wider">Select Size</span>
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="text-teal underline font-semibold cursor-pointer hover:text-champagne-700 transition-colors"
                  >
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {sizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                        selectedSize === sz
                          ? 'bg-teal text-champagne border-teal shadow-md scale-105'
                          : 'bg-sand text-charcoal border-sand hover:border-champagne'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection if multiple colors */}
            {colors.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-xs uppercase font-semibold text-charcoal tracking-wider block">Select Color</span>
                <div className="flex flex-wrap gap-2.5">
                  {colors.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSelectedColor(col)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                        selectedColor === col
                          ? 'bg-teal text-champagne border-teal shadow-md scale-105'
                          : 'bg-sand text-charcoal border-sand hover:border-champagne'
                      }`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Product Color Disclaimer Note */}
            <p className="text-[11px] text-charcoal-muted leading-relaxed font-sans">
              Please note: The product color may slightly vary from the images due to lighting, photography, and screen settings.
            </p>

            {/* Quantity */}
            <div className="flex items-center gap-4 pt-1">
              <span className="text-xs uppercase font-semibold text-charcoal tracking-wider">Quantity:</span>
              <div className="flex items-center border border-sand rounded-xl bg-sand">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2.5 text-charcoal hover:bg-sand-dark rounded-l-xl transition-colors cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 text-xs font-bold text-teal">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                  className="p-2.5 text-charcoal hover:bg-sand-dark rounded-r-xl transition-colors cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-charcoal-muted">
                {product.isPreOrder ? 'Available for Pre-Order' : currentStock > 0 ? `${currentStock} units in stock` : 'Out of stock'}
              </span>
            </div>

            {/* Main CTA Buttons */}
            <div className="space-y-3 pt-3 border-t border-sand/80">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!product.isPreOrder && currentStock <= 0}
                  className="flex-1 btn-premium btn-primary !py-4 rounded-2xl text-xs uppercase font-extrabold tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 border border-champagne/30 cursor-pointer"
                >
                  {addedToast ? (
                    <>
                      <Check className="w-4 h-4 text-champagne" /> Added To Bag!
                    </>
                  ) : product.isPreOrder ? (
                    <>
                      <ShoppingBag className="w-4 h-4 text-champagne" /> + Pre-Order To Bag
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-champagne" /> + Add To Bag
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    toggleWishlist({
                      productId: product.id,
                      title: product.title,
                      slug: product.slug,
                      image: images[0]?.url,
                      price: activePrice,
                      basePrice: product.basePrice,
                      sku: product.sku,
                    })
                  }
                  className={`p-4 rounded-2xl border transition-all card-3d-subtle cursor-pointer ${
                    isWish
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-sand/60 text-charcoal border-sand hover:border-champagne'
                  }`}
                  title="Save to Wishlist"
                  aria-label="Save to Wishlist"
                >
                  <Heart className={`w-5 h-5 ${isWish ? 'fill-current' : ''}`} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!product.isPreOrder && currentStock <= 0}
                className="w-full btn-premium btn-champagne !py-4 rounded-2xl text-xs uppercase font-black tracking-widest transition-all shadow-xl flex items-center justify-center gap-2.5 disabled:opacity-50 border border-teal/20 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-teal fill-current" />
                {product.isPreOrder
                  ? `Pre-Order Now (${advancePercent}% Advance)`
                  : 'Buy Now (Cash On Delivery)'}
              </button>
            </div>

            {/* Shipping / Delivery Information */}
            <div className="rounded-2xl border border-sand bg-sand/40 p-4 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-teal font-bold font-serif text-sm">
                <Truck className="w-4 h-4 text-teal shrink-0" />
                <span>Shipping &amp; Delivery Information</span>
              </div>
              <div className="space-y-2 text-charcoal-muted font-sans leading-relaxed">
                <p className="font-semibold text-teal">
                  {settings.freeShippingThreshold > 0
                    ? `Free Delivery on orders above Rs. ${settings.freeShippingThreshold.toLocaleString()}. Standard delivery fee: Rs. ${settings.flatShippingFee}.`
                    : 'Free Delivery on all orders!'}
                </p>
                <p>
                  {product.isPreOrder
                    ? 'Pre-order garments are custom crafted upon booking and dispatched upon arrival. Nationwide Cash On Delivery.'
                    : `Dispatched within 24 hours. Estimated delivery: ${settings.estimatedDeliveryTime || '2-4 business days'} across Pakistan.`}
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-charcoal">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal" /> 100% Authentic Quality
                  </span>
                  <span className="flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-teal" /> 7-Day Easy Exchange
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2.5 pt-4 border-t border-sand/80">
              <h3 className="font-serif text-base font-bold text-teal">Description</h3>
              <div className="space-y-2 text-xs text-charcoal-muted leading-relaxed font-sans">
                {product.description
                  ?.split(/\n+/)
                  .filter((p: string) => p.trim().length > 0)
                  .map((paragraph: string, idx: number) => (
                    <p key={idx}>{paragraph.trim()}</p>
                  )) || <p>{product.description}</p>}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2.5 pt-4 border-t border-sand/80">
              <h3 className="font-serif text-base font-bold text-teal">Product Details</h3>
              <div className="divide-y divide-sand/70 rounded-xl border border-sand/70 bg-sand/30 overflow-hidden text-xs">
                {product.fabricDetails && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1">
                    <span className="font-semibold text-charcoal">Fabric</span>
                    <span className="text-charcoal-muted font-sans sm:text-right">{product.fabricDetails}</span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1">
                  <span className="font-semibold text-charcoal">Fit</span>
                  <span className="text-charcoal-muted font-sans sm:text-right">Regular tailored fit</span>
                </div>
                {product.careInstructions && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1">
                    <span className="font-semibold text-charcoal">Care</span>
                    <span className="text-charcoal-muted font-sans sm:text-right">{product.careInstructions}</span>
                  </div>
                )}
                {colors.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1">
                    <span className="font-semibold text-charcoal">Color</span>
                    <span className="text-charcoal-muted font-sans sm:text-right">{colors.join(', ')}</span>
                  </div>
                )}
                {product.category?.name && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1">
                    <span className="font-semibold text-charcoal">Category</span>
                    <span className="text-charcoal-muted font-sans sm:text-right">{product.category.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="mt-20 pt-12 border-t border-sand">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-1">
            <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.2em]">
              Customer Reflections
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-black text-teal">
              Customer Reviews &amp; Ratings
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Reviews List */}
            <div className="lg:col-span-7 space-y-4">
              {product.reviews.length === 0 ? (
                <div className="bg-sand/40 p-8 rounded-2xl text-center text-xs text-charcoal-muted">
                  No approved reviews yet for this product. Be the first to leave your feedback!
                </div>
              ) : (
                product.reviews.map((rev: any) => (
                  <div key={rev.id} className="bg-offwhite p-6 rounded-2xl border border-sand space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-bold text-teal text-sm">{rev.customerName}</h4>
                      <div className="flex text-champagne">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-charcoal-muted font-sans leading-relaxed">"{rev.comment}"</p>
                    <span className="text-[10px] text-charcoal-muted block">
                      {new Date(rev.createdAt).toLocaleDateString()} • Verified Buyer
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Write a Review Form */}
            <div className="lg:col-span-5 bg-sand/60 p-6 rounded-3xl border border-sand space-y-4">
              <h3 className="font-serif text-xl font-bold text-teal">Write a Review</h3>

              {reviewSubmitted ? (
                <div className="bg-teal text-champagne p-4 rounded-xl text-xs font-semibold text-center">
                  Thank you! Your review has been submitted for admin approval.
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase text-charcoal block mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maryam Ali"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-offwhite border border-sand rounded-xl focus:outline-none focus:ring-1 focus:ring-teal"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-charcoal block mb-1">Rating</label>
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-offwhite border border-sand rounded-xl focus:outline-none focus:ring-1 focus:ring-teal"
                    >
                      <option value={5}>5 Stars - Exceptional</option>
                      <option value={4}>4 Stars - Very Good</option>
                      <option value={3}>3 Stars - Average</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-charcoal block mb-1">Your Review</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Tell us about the fabric quality, stitching, and delivery..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-offwhite border border-sand rounded-xl focus:outline-none focus:ring-1 focus:ring-teal"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-teal text-champagne py-3 rounded-xl text-xs uppercase font-bold tracking-widest hover:bg-teal-900 transition-colors shadow"
                  >
                    Submit Review
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Related Products Carousel */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-12 border-t border-sand">
            <h3 className="font-serif text-2xl font-bold text-teal mb-8 text-center">
              You May Also Admire
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p: any) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  slug={p.slug}
                  basePrice={p.basePrice}
                  discountPrice={p.discountPrice}
                  sku={p.sku}
                  isNewArrival={p.isNewArrival}
                  isBestSeller={p.isBestSeller}
                  isPreOrder={p.isPreOrder}
                  inStock={p.inStock}
                  stockQuantity={p.stockQuantity}
                  images={p.images}
                  categoryName={p.category?.name}
                  variants={p.variants}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 text-offwhite hover:text-champagne p-2"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="relative w-full max-w-4xl h-[85vh]">
            <Image
              src={images[selectedImageIndex]?.url}
              alt={product.title}
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}

      {/* Sticky Add to Cart Mobile Bottom Bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-offwhite/95 backdrop-blur-xl border-t border-sand px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="font-serif text-sm font-bold text-teal block truncate">{product.title}</span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-serif text-xs font-bold text-champagne-700">Rs. {activePrice.toLocaleString()}</span>
              {product.discountPrice && (
                <span className="text-[10px] text-charcoal-muted line-through">Rs. {product.basePrice.toLocaleString()}</span>
              )}
              {product.isPreOrder && (
                <span className="bg-amber-600 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">PRE-ORDER</span>
              )}
            </div>
            {product.isPreOrder && (
              <span className="text-[10px] text-amber-900 font-semibold">
                {advancePercent}% Advance: Rs. {advanceAmount.toLocaleString()}
              </span>
            )}
          </div>
          <button
            onClick={handleBuyNow}
            disabled={!product.isPreOrder && currentStock <= 0}
            className="bg-teal text-champagne px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow shrink-0 active:scale-95 transition-transform"
          >
            <ShoppingBag className="w-4 h-4" />
            {product.isPreOrder ? 'Pre-Order' : 'Add to Bag'}
          </button>
        </div>
      </div>
      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        productId={product.id}
        sizeGuideImage={product.sizeGuideImage}
        productTitle={product.title}
      />
    </div>
  );
};
