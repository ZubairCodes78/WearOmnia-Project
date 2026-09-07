'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ProductCard } from './ProductCard';
import { QuickViewModal } from './QuickViewModal';
import { ChevronLeft, ChevronRight, Grid2X2, Grid3X3, Heart, LayoutGrid, X, Search } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';

interface ProductItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  basePrice: number;
  discountPrice?: number | null;
  sku: string;
  isNewArrival: boolean;
  isBestSeller: boolean;
  inStock: boolean;
  stockQuantity: number;
  categoryId?: string | null;
  category?: { name: string; slug: string } | null;
  images: { url: string; altText?: string | null }[];
  variants: { size: string; color: string; stock: number }[];
}

interface CatalogClientProps {
  products: ProductItem[];
  categories: { id: string; name: string; slug: string }[];
  initialCategory?: string;
  initialSearch?: string;
  initialWishlist?: boolean;
}

export const CatalogClient: React.FC<CatalogClientProps> = ({
  products,
  categories,
  initialCategory = '',
  initialSearch = '',
  initialWishlist = false,
}) => {
  const { wishlist } = useWishlist();
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [gridCols, setGridCols] = useState<'2' | '3' | '4'>('3');
  const [quickViewProduct, setQuickViewProduct] = useState<ProductItem | null>(null);
  const [showWishlistOnly, setShowWishlistOnly] = useState(initialWishlist);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Available Sizes & Colors Extracted from Data
  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.variants.forEach((v) => set.add(v.size)));
    return Array.from(set);
  }, [products]);

  const availableColors = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.variants.forEach((v) => set.add(v.color)));
    return Array.from(set);
  }, [products]);

  // Filter & Sort Pipeline
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Wishlist filter mode
        if (showWishlistOnly) {
          const inWish = wishlist.some((w) => w.productId === p.id);
          if (!inWish) return false;
        }

        // Search query
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchesTitle = p.title.toLowerCase().includes(q);
          const matchesSku = p.sku.toLowerCase().includes(q);
          const matchesDesc = p.description.toLowerCase().includes(q);
          if (!matchesTitle && !matchesSku && !matchesDesc) return false;
        }

        // Category filter
        if (selectedCategory) {
          if (p.category?.slug !== selectedCategory) return false;
        }

        // Size filter
        if (selectedSize) {
          const hasSize = p.variants.some((v) => v.size === selectedSize);
          if (!hasSize) return false;
        }

        // Color filter
        if (selectedColor) {
          const hasColor = p.variants.some((v) => v.color === selectedColor);
          if (!hasColor) return false;
        }

        // Stock availability
        if (inStockOnly && (!p.inStock || p.stockQuantity <= 0)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.discountPrice || a.basePrice;
        const priceB = b.discountPrice || b.basePrice;
        if (sortBy === 'price-low') return priceA - priceB;
        if (sortBy === 'price-high') return priceB - priceA;
        if (sortBy === 'bestseller') return b.isBestSeller ? 1 : -1;
        return 0; // default newest
      });
  }, [products, search, selectedCategory, selectedSize, selectedColor, inStockOnly, sortBy, showWishlistOnly, wishlist]);

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedSize('');
    setSelectedColor('');
    setInStockOnly(false);
    setShowWishlistOnly(false);
    setSortBy('newest');
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedSize, selectedColor, inStockOnly, sortBy, showWishlistOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage,
  );
  const pageNumbers = Array.from(
    new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages]),
  )
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const gridClass =
    gridCols === '2'
      ? 'grid-cols-2 sm:grid-cols-2'
      : gridCols === '4'
        ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4'
        : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header Title Section with Clean Modern Kicker */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 space-y-2">
        <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.2em]">
          {showWishlistOnly ? 'Saved Favorites' : 'Everyday Ready-to-Wear'}
        </span>
        <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-black text-teal tracking-tight uppercase">
          {showWishlistOnly ? 'Your Saved Favorites' : 'The Wardrobe Upgrade'}
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-muted max-w-md mx-auto leading-relaxed">
          {showWishlistOnly
            ? 'The outfits you have your eye on. Ready whenever you are.'
            : 'For uni mornings, chai breaks, last-minute plans and those “I have nothing to wear” emergencies.'}
        </p>
        <p className="text-xs text-charcoal-muted font-medium pt-1">
          Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'curated outfit' : 'curated outfits'}
        </p>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-sand/40 p-3 sm:p-4 rounded-2xl border border-sand mb-6 sm:mb-8 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Category Pills */}
        <div className="flex overflow-x-auto no-scrollbar pb-1 sm:pb-0 gap-2 w-full lg:w-auto shrink-0 flex-nowrap sm:flex-wrap">
          <button
            onClick={() => {
              setSelectedCategory('');
              setShowWishlistOnly(false);
            }}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs uppercase font-semibold transition-all shrink-0 ${!selectedCategory && !showWishlistOnly
              ? 'bg-teal text-champagne shadow-md'
              : 'bg-offwhite text-charcoal hover:bg-sand'
              }`}
          >
            All Products
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCategory(c.slug);
                setShowWishlistOnly(false);
              }}
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs uppercase font-semibold transition-all shrink-0 ${selectedCategory === c.slug && !showWishlistOnly
                ? 'bg-teal text-champagne shadow-md'
                : 'bg-offwhite text-charcoal hover:bg-sand'
                }`}
            >
              {c.name}
            </button>
          ))}
          <button
            onClick={() => setShowWishlistOnly(!showWishlistOnly)}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs uppercase font-semibold flex items-center gap-1.5 transition-all shrink-0 ${showWishlistOnly
              ? 'bg-red-700 text-offwhite shadow-md'
              : 'bg-offwhite text-charcoal hover:bg-sand'
              }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" /> Wishlist ({wishlist.length})
          </button>
        </div>

        {/* Sort & Grid Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full lg:w-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-offwhite text-charcoal px-3 py-2 rounded-xl border border-sand text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal w-full sm:w-auto"
          >
            <option value="newest">Sort by: Newest Arrivals</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="bestseller">Best Selling</option>
          </select>

          {/* Grid Layout Switcher */}
          <div className="hidden sm:flex items-center gap-1 bg-offwhite p-1 rounded-xl border border-sand">
            <button
              onClick={() => setGridCols('2')}
              className={`p-1.5 rounded-lg transition-colors ${gridCols === '2' ? 'bg-teal text-champagne' : 'text-charcoal-muted'
                }`}
              title="2 Column Grid"
            >
              <Grid2X2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGridCols('3')}
              className={`p-1.5 rounded-lg transition-colors ${gridCols === '3' ? 'bg-teal text-champagne' : 'text-charcoal-muted'
                }`}
              title="3 Column Grid"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGridCols('4')}
              className={`p-1.5 rounded-lg transition-colors ${gridCols === '4' ? 'bg-teal text-champagne' : 'text-charcoal-muted'
                }`}
              title="4 Column Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Filter Badges */}
      <div className="flex flex-wrap items-center gap-3 mb-8 text-xs">
        {/* Size Picker Filter */}
        <div className="flex items-center gap-1.5 bg-offwhite px-3 py-1.5 rounded-xl border border-sand">
          <span className="text-charcoal-muted font-medium">Size:</span>
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="bg-transparent text-teal font-semibold focus:outline-none"
          >
            <option value="">All Sizes</option>
            {availableSizes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Color Picker Filter */}
        <div className="flex items-center gap-1.5 bg-offwhite px-3 py-1.5 rounded-xl border border-sand">
          <span className="text-charcoal-muted font-medium">Color:</span>
          <select
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="bg-transparent text-teal font-semibold focus:outline-none"
          >
            <option value="">All Colors</option>
            {availableColors.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* In Stock Checkbox */}
        <label className="flex items-center gap-2 bg-offwhite px-3 py-1.5 rounded-xl border border-sand cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="accent-teal rounded"
          />
          <span className="text-charcoal font-medium">In Stock Only</span>
        </label>

        {(selectedCategory || selectedSize || selectedColor || inStockOnly || search || showWishlistOnly) && (
          <button
            onClick={resetFilters}
            className="text-red-700 hover:underline font-semibold flex items-center gap-1 ml-auto"
          >
            <X className="w-3.5 h-3.5" /> Clear Filters
          </button>
        )}
      </div>

      {/* Product Grid Listing */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-sand/40 rounded-3xl border border-sand space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-sand-dark/25 text-teal flex items-center justify-center mb-1">
            <Search className="w-6 h-6 text-teal" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-teal">Nothing Here Just Yet</h3>
          <p className="text-xs text-charcoal-muted max-w-sm mx-auto leading-relaxed">
            Your search might be more specific than your assignment deadline. Try clearing your filters or exploring our full collection.
          </p>
          <button
            onClick={resetFilters}
            className="mt-3 bg-teal text-champagne px-7 py-3.5 rounded-xl text-xs uppercase font-bold tracking-widest hover:bg-teal-900 transition-all shadow"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className={`grid ${gridClass} gap-6 sm:gap-8`}>
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              title={product.title}
              slug={product.slug}
              basePrice={product.basePrice}
              discountPrice={product.discountPrice}
              sku={product.sku}
              isNewArrival={product.isNewArrival}
              isBestSeller={product.isBestSeller}
              inStock={product.inStock}
              stockQuantity={product.stockQuantity}
              images={product.images}
              categoryName={product.category?.name}
              variants={product.variants}
              onQuickView={() => setQuickViewProduct(product)}
            />
          ))}
        </div>
      )}

      {filteredProducts.length > productsPerPage && (
        <nav
          aria-label="Product catalog pagination"
          className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-sand pt-6"
        >
          <p className="text-xs text-charcoal-muted">
            Showing {(currentPage - 1) * productsPerPage + 1}-{Math.min(currentPage * productsPerPage, filteredProducts.length)} of {filteredProducts.length} products
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-sand text-teal transition-colors hover:border-champagne disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {pageNumbers.map((page, index) => (
              <React.Fragment key={page}>
                {index > 0 && pageNumbers[index - 1] !== page - 1 && (
                  <span className="px-1 text-xs text-charcoal-muted" aria-hidden="true">...</span>
                )}
                <button
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  aria-current={page === currentPage ? 'page' : undefined}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors ${page === currentPage
                    ? 'bg-teal text-champagne'
                    : 'border border-sand text-charcoal hover:border-champagne'
                    }`}
                >
                  {page}
                </button>
              </React.Fragment>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-sand text-teal transition-colors hover:border-champagne disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </nav>
      )}

      {/* Quick View Modal Handler */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};
