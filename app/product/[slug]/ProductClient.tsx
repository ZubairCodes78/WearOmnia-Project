'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { ProductCard } from '@/components/shop/ProductCard';
import { SizeGuideModal } from '@/components/shop/SizeGuideModal';

interface ProductClientProps {
  product: any;
  relatedProducts: any[];
}

export const ProductClient: React.FC<ProductClientProps> = ({ product, relatedProducts }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

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

  const sizes = Array.from(new Set(product.variants.map((v: any) => v.size))) as string[];
  const colors = Array.from(new Set(product.variants.map((v: any) => v.color))) as string[];

  // Selected Variant Stock Check
  const currentVariant = product.variants.find(
    (v: any) => v.size === selectedSize && v.color === selectedColor
  ) || product.variants[0];

  const currentStock = currentVariant ? currentVariant.stock : product.stockQuantity;

  const handleAddToCart = () => {
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
      maxStock: currentStock,
    });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
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
      maxStock: currentStock,
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
    <div className="bg-offwhite min-h-screen py-8 pb-24 sm:pb-8">
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
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto shrink-0 max-h-[600px]">
                {images.map((img: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImageIndex === i
                        ? 'border-teal shadow-md scale-105'
                        : 'border-sand opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={img.url} alt="thumb" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image with Zoom & Lightbox Trigger */}
            <div className="relative flex-1 aspect-[3/4] rounded-3xl overflow-hidden bg-sand border border-sand shadow-lg group">
              <Image
                src={images[selectedImageIndex]?.url}
                alt={product.title}
                fill
                priority
                className="object-cover transition-transform duration-700 group-hover:scale-105 cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
              />
              <button
                onClick={() => setLightboxOpen(true)}
                className="absolute top-4 right-4 bg-offwhite/80 backdrop-blur-md p-2.5 rounded-full text-teal hover:bg-champagne transition-all shadow"
                title="Fullscreen Lightbox View"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right: Product Purchase Details */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] font-semibold text-champagne-700">
                SKU: {product.sku} • {product.category?.name || 'Luxury Fashion'}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-teal mt-1">
                {product.title}
              </h1>

              {/* Price & Rating */}
              <div className="flex items-center justify-between mt-4 pb-4 border-b border-sand">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-3xl font-bold text-teal">
                    Rs. {activePrice.toLocaleString()}
                  </span>
                  {product.discountPrice && (
                    <span className="text-sm text-charcoal-muted line-through">
                      Rs. {product.basePrice.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-champagne text-xs font-semibold">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current text-champagne" />
                    ))}
                  </div>
                  <span className="text-charcoal font-sans">({product.reviews.length} Reviews)</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-charcoal-muted leading-relaxed font-sans">
              {product.description}
            </p>

            {/* Variants Selector */}
            {sizes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="uppercase text-charcoal">Select Size:</span>
                  <span
                    onClick={() => setSizeGuideOpen(true)}
                    className="text-teal underline font-normal cursor-pointer hover:text-champagne-700 transition-colors"
                  >
                    Size Guide
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
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

            {colors.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs uppercase font-semibold text-charcoal block">Select Color:</span>
                <div className="flex flex-wrap gap-2.5">
                  {colors.map((col) => (
                    <button
                      key={col}
                      onClick={() => setSelectedColor(col)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
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

            {/* Quantity Picker & Stock Badge */}
            <div className="flex items-center gap-4 pt-2">
              <span className="text-xs uppercase font-semibold text-charcoal">Quantity:</span>
              <div className="flex items-center border border-sand rounded-xl bg-sand">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 text-charcoal hover:bg-sand-dark rounded-l-xl"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 text-xs font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                  className="p-2 text-charcoal hover:bg-sand-dark rounded-r-xl"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-charcoal-muted">
                {currentStock > 0 ? `${currentStock} units in stock` : 'Out of stock'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-sand">
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={currentStock <= 0}
                  className="flex-1 bg-teal text-champagne py-4 rounded-xl text-xs uppercase font-bold tracking-widest hover:bg-teal-900 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {addedToast ? (
                    <>
                      <Check className="w-4 h-4 text-champagne" /> Added To Bag
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" /> Add To Shopping Bag
                    </>
                  )}
                </button>

                <button
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
                  className={`p-4 rounded-xl border transition-all ${
                    isWish
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-sand text-charcoal border-sand hover:border-champagne'
                  }`}
                  title="Wishlist"
                >
                  <Heart className={`w-5 h-5 ${isWish ? 'fill-current' : ''}`} />
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                disabled={currentStock <= 0}
                className="w-full bg-champagne text-teal-950 py-4 rounded-xl text-xs uppercase font-bold tracking-widest hover:bg-sand transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-teal" /> Buy Now With Cash On Delivery
              </button>
            </div>

            {/* Guarantee Pills */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-sand text-[11px] text-center text-charcoal-muted">
              <div className="bg-sand/60 p-2.5 rounded-xl flex flex-col items-center gap-1">
                <Truck className="w-4 h-4 text-teal" />
                <span>Express COD</span>
              </div>
              <div className="bg-sand/60 p-2.5 rounded-xl flex flex-col items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-teal" />
                <span>100% Authentic</span>
              </div>
              <div className="bg-sand/60 p-2.5 rounded-xl flex flex-col items-center gap-1">
                <RotateCcw className="w-4 h-4 text-teal" />
                <span>7-Day Exchange</span>
              </div>
            </div>

            {/* Accordion Specification Tabs */}
            <div className="pt-4 border-t border-sand">
              <div className="flex border-b border-sand">
                <button
                  onClick={() => setActiveTab('fabric')}
                  className={`pb-2 px-3 text-xs uppercase font-semibold border-b-2 transition-all ${
                    activeTab === 'fabric' ? 'border-teal text-teal' : 'border-transparent text-charcoal-muted'
                  }`}
                >
                  Fabric & Craft
                </button>
                <button
                  onClick={() => setActiveTab('care')}
                  className={`pb-2 px-3 text-xs uppercase font-semibold border-b-2 transition-all ${
                    activeTab === 'care' ? 'border-teal text-teal' : 'border-transparent text-charcoal-muted'
                  }`}
                >
                  Care Details
                </button>
                <button
                  onClick={() => setActiveTab('shipping')}
                  className={`pb-2 px-3 text-xs uppercase font-semibold border-b-2 transition-all ${
                    activeTab === 'shipping' ? 'border-teal text-teal' : 'border-transparent text-charcoal-muted'
                  }`}
                >
                  Shipping Terms
                </button>
              </div>

              <div className="py-4 text-xs text-charcoal-muted leading-relaxed font-sans">
                {activeTab === 'fabric' && (
                  <p>{product.fabricDetails || 'High grade luxury fabric crafted with precision embroideries.'}</p>
                )}
                {activeTab === 'care' && (
                  <p>{product.careInstructions || 'Dry Clean Recommended. Iron on reverse side.'}</p>
                )}
                {activeTab === 'shipping' && (
                  <p>Nationwide Cash On Delivery available across Pakistan. Dispatched in 24 hours. Delivery within 2-4 business days.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="mt-20 pt-12 border-t border-sand">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs uppercase tracking-[0.3em] font-semibold text-champagne-700">
              Verified Feedback
            </span>
            <h2 className="font-serif text-3xl font-bold text-teal mt-1">Client Product Reviews</h2>
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

      {/* Size Guide Modal */}
      {sizeGuideOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-offwhite text-teal w-full max-w-xl p-6 sm:p-8 rounded-3xl border border-sand shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-sand pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-champagne-700 block">Fit & Measurements</span>
                <h3 className="font-serif text-2xl font-bold">WearOMNIA Size Guide</h3>
              </div>
              <button onClick={() => setSizeGuideOpen(false)} className="p-2 text-teal hover:text-champagne-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead className="bg-teal text-champagne uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-3">Size</th>
                    <th className="p-3">Bust (Inches)</th>
                    <th className="p-3">Waist (Inches)</th>
                    <th className="p-3">Hips (Inches)</th>
                    <th className="p-3">Length (Inches)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand">
                  <tr>
                    <td className="p-3 font-bold">S</td>
                    <td className="p-3">36"</td>
                    <td className="p-3">30"</td>
                    <td className="p-3">39"</td>
                    <td className="p-3">48"</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">M</td>
                    <td className="p-3">39"</td>
                    <td className="p-3">33"</td>
                    <td className="p-3">42"</td>
                    <td className="p-3">49"</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">L</td>
                    <td className="p-3">42"</td>
                    <td className="p-3">36"</td>
                    <td className="p-3">45"</td>
                    <td className="p-3">50"</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">XL</td>
                    <td className="p-3">45"</td>
                    <td className="p-3">39"</td>
                    <td className="p-3">48"</td>
                    <td className="p-3">50"</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-charcoal-muted text-center font-sans">
              All luxury garments feature generous couture margins. For custom tailormade sizing, contact our atelier concierge via WhatsApp.
            </p>
          </div>
        </div>
      )}

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
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-offwhite/95 backdrop-blur-xl border-t border-sand p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center justify-between gap-3 shadow-2xl">
        <div>
          <span className="font-serif text-sm font-bold text-teal block truncate max-w-[140px]">{product.title}</span>
          <span className="font-serif text-xs font-bold text-champagne-700">Rs. {activePrice.toLocaleString()}</span>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={currentStock <= 0}
          className="bg-teal text-champagne px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow"
        >
          <ShoppingBag className="w-4 h-4" /> Add to Bag
        </button>
      </div>
      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        productId={product.id}
      />
    </div>
  );
};
