'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Boxes,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  FileText,
  TrendingDown,
  Sparkles,
  CheckCircle2,
  X,
  Loader2,
  Edit3,
} from 'lucide-react';

interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock: number;
  reserved?: number;
  sku?: string;
}

interface Product {
  id: string;
  title: string;
  sku: string;
  basePrice: number;
  stockQuantity: number;
  reservedStock?: number;
  inStock: boolean;
  category?: { name: string } | null;
  images: Array<{ url: string }>;
  variants: ProductVariant[];
}

interface InventoryClientProps {
  initialProducts: Product[];
  totalLogsCount: number;
}

export function InventoryClient({ initialProducts, totalLogsCount }: InventoryClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'IN_STOCK'>('ALL');

  // Adjust Modal State
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [changeAmount, setChangeAmount] = useState<string>('5');
  const [reason, setReason] = useState<string>('RESTOCK');
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const totalStockUnits = products.reduce((sum, p) => sum + p.stockQuantity, 0);
  const totalValuation = products.reduce((sum, p) => sum + p.stockQuantity * p.basePrice, 0);
  const lowStockCount = products.filter((p) => p.stockQuantity <= 5 && p.stockQuantity > 0).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity <= 0).length;

  const filteredProducts = products.filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch =
      p.title.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      (p.category?.name && p.category.name.toLowerCase().includes(term));

    let matchesTab = true;
    if (filterTab === 'LOW_STOCK') matchesTab = p.stockQuantity <= 5 && p.stockQuantity > 0;
    else if (filterTab === 'OUT_OF_STOCK') matchesTab = p.stockQuantity <= 0;
    else if (filterTab === 'IN_STOCK') matchesTab = p.stockQuantity > 5;

    return matchesSearch && matchesTab;
  });

  const handleOpenAdjustModal = (product: Product, variantId?: string) => {
    setAdjustingProduct(product);
    setSelectedVariantId(variantId || (product.variants.length > 0 ? product.variants[0].id : ''));
    setChangeAmount('5');
    setReason('RESTOCK');
    setNote('');
    setMessage(null);
  };

  const handleSaveStockAdjustment = async () => {
    if (!adjustingProduct) return;
    const qty = parseInt(changeAmount, 10);
    if (isNaN(qty) || qty === 0) {
      setMessage({ text: 'Please enter a valid non-zero quantity change.', isError: true });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: adjustingProduct.id,
          variantId: selectedVariantId || undefined,
          changeQuantity: qty,
          reason,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error || 'Failed to adjust stock.', isError: true });
      } else {
        setMessage({ text: `✓ ${data.message || 'Stock updated successfully.'}` });
        // Update local product state
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === adjustingProduct.id) {
              const updatedVariants = p.variants.map((v) =>
                v.id === selectedVariantId ? { ...v, stock: Math.max(0, v.stock + qty) } : v
              );
              return {
                ...p,
                stockQuantity: data.product.stockQuantity,
                inStock: data.product.inStock,
                variants: updatedVariants,
              };
            }
            return p;
          })
        );
        setTimeout(() => {
          setAdjustingProduct(null);
          router.refresh();
        }, 1200);
      }
    } catch {
      setMessage({ text: 'Network error updating stock.', isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 text-[#FAF8F5]">
      {/* Header */}
      <div className="bg-[#0A2528]/85 backdrop-blur-2xl p-8 rounded-3xl border border-[#D4AF37]/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] font-bold text-[#D4AF37] bg-teal-950/80 px-3.5 py-1 rounded-full border border-[#D4AF37]/30">
              <Boxes className="w-3 h-3 text-[#D4AF37]" /> Inventory Control Console
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#FAF8F5] mt-2">
            Live Stock Intelligence & Alerts
          </h1>
          <p className="text-xs text-[#FAF8F5]/70 mt-1 font-sans">
            Real-time physical inventory valuation, low stock warnings, and automated movement auditing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/inventory/logs"
            className="bg-[#0D3337] hover:bg-[#103A3E] text-[#D4AF37] border border-[#D4AF37]/40 px-5 py-3 rounded-xl text-xs uppercase font-bold tracking-widest transition-all shadow-lg flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Movement Ledger ({totalLogsCount})
          </Link>
          <Link
            href="/admin/products"
            className="bg-[#D4AF37] text-black hover:bg-white px-5 py-3 rounded-xl text-xs uppercase font-extrabold tracking-widest transition-all shadow-lg flex items-center gap-2"
          >
            Manage SKUs
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#0A2528]/70 backdrop-blur-md p-6 rounded-2xl border border-[#D4AF37]/20 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">Total Available Stock</span>
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-[#FAF8F5]">{totalStockUnits.toLocaleString()} Units</p>
          <span className="text-[11px] text-[#FAF8F5]/60 font-semibold">Across {products.length} Catalog Items</span>
        </div>

        <div className="bg-[#0A2528]/70 backdrop-blur-md p-6 rounded-2xl border border-[#D4AF37]/20 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">Catalog Valuation</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-emerald-400">Rs. {totalValuation.toLocaleString()}</p>
          <span className="text-[11px] text-emerald-300/80 font-semibold">Total Retail Inventory Value</span>
        </div>

        <div className="bg-[#0A2528]/70 backdrop-blur-md p-6 rounded-2xl border border-amber-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Low Stock Alerts</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-amber-400">{lowStockCount}</p>
          <span className="text-[11px] text-amber-300 font-semibold">Items with &le; 5 units remaining</span>
        </div>

        <div className="bg-[#0A2528]/70 backdrop-blur-md p-6 rounded-2xl border border-red-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-red-400">Out of Stock</span>
            <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-red-400">{outOfStockCount}</p>
          <span className="text-[11px] text-red-300 font-semibold">Requires immediate restocking</span>
        </div>
      </div>

      {/* Tabs and Search Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0A2528]/80 backdrop-blur-xl p-6 rounded-3xl border border-[#D4AF37]/20 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              filterTab === 'ALL' ? 'bg-[#D4AF37] text-black shadow' : 'bg-[#06191B] text-[#FAF8F5]/80 hover:text-[#D4AF37]'
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            onClick={() => setFilterTab('LOW_STOCK')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              filterTab === 'LOW_STOCK' ? 'bg-amber-500 text-black shadow' : 'bg-[#06191B] text-amber-300 hover:text-white'
            }`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setFilterTab('OUT_OF_STOCK')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              filterTab === 'OUT_OF_STOCK' ? 'bg-red-500 text-white shadow' : 'bg-[#06191B] text-red-300 hover:text-white'
            }`}
          >
            Out of Stock ({outOfStockCount})
          </button>
          <button
            onClick={() => setFilterTab('IN_STOCK')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              filterTab === 'IN_STOCK' ? 'bg-emerald-500 text-black shadow' : 'bg-[#06191B] text-emerald-300 hover:text-white'
            }`}
          >
            In Stock
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search SKU, Product Title, Category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#06191B] rounded-xl text-xs text-[#FAF8F5] border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37] font-sans"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full p-16 text-center bg-[#0A2528]/80 rounded-3xl border border-[#D4AF37]/20">
            <Boxes className="w-12 h-12 text-[#D4AF37]/40 mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold text-[#FAF8F5]">No Inventory Matches</h3>
            <p className="text-xs text-[#FAF8F5]/60 mt-1">No products found matching the selected search query.</p>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isLowStock = p.stockQuantity <= 5 && p.stockQuantity > 0;
            const isOutOfStock = p.stockQuantity <= 0;

            return (
              <div
                key={p.id}
                className={`p-6 rounded-3xl border transition-all shadow-xl space-y-4 ${
                  isOutOfStock
                    ? 'bg-[#150A0A]/90 border-red-500/40'
                    : isLowStock
                    ? 'bg-[#14120A]/90 border-amber-500/40'
                    : 'bg-[#0A2528]/80 border-[#D4AF37]/20'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="relative w-20 h-24 rounded-2xl overflow-hidden bg-[#06191B] border border-[#D4AF37]/20 shrink-0">
                    {p.images[0]?.url ? (
                      <Image src={p.images[0].url} alt={p.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#D4AF37]/40">
                        <Boxes className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-[#D4AF37] font-semibold uppercase tracking-wider block">
                      {p.category?.name || 'Luxury Pret'}
                    </span>
                    <h4 className="font-serif font-bold text-[#FAF8F5] text-sm truncate">{p.title}</h4>
                    <span className="font-mono text-xs text-[#FAF8F5]/60 block">{p.sku}</span>

                    <div className="mt-2.5 flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        isOutOfStock
                          ? 'bg-red-950 text-red-400 border-red-500/40'
                          : isLowStock
                          ? 'bg-amber-950 text-amber-400 border-amber-500/40 animate-pulse'
                          : 'bg-teal-950 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {isOutOfStock ? 'Out of Stock' : isLowStock ? `⚠️ Low Stock (${p.stockQuantity})` : `${p.stockQuantity} Units`}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#D4AF37]">
                        Rs. {p.basePrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Variant Breakdown */}
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#FAF8F5]/60 tracking-wider block">
                    Variant Stock Breakdown:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {p.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => handleOpenAdjustModal(p, v.id)}
                        className="bg-[#06191B] hover:bg-[#103A3E] px-2.5 py-1 rounded-lg text-[10px] font-mono border border-white/10 text-[#FAF8F5] transition-colors flex items-center gap-1"
                        title="Click to adjust this variant stock"
                      >
                        <span>{v.size} ({v.color}):</span>
                        <strong className={v.stock <= 2 ? 'text-red-400' : 'text-[#D4AF37]'}>{v.stock}</strong>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Action Button */}
                <div className="pt-2">
                  <button
                    onClick={() => handleOpenAdjustModal(p)}
                    className="w-full bg-[#0D3337] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-[#D4AF37]/30 flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Adjust Stock & Log Reason
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A2528] text-[#FAF8F5] border border-[#D4AF37]/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#D4AF37]">
                  Adjust Inventory Stock
                </h3>
                <span className="text-xs text-[#FAF8F5]/70 block truncate max-w-xs">{adjustingProduct.title}</span>
              </div>
              <button onClick={() => setAdjustingProduct(null)} className="p-1.5 text-[#D4AF37] hover:bg-teal-900 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {message && (
              <div className={`p-3 rounded-xl text-xs font-medium ${
                message.isError ? 'bg-red-950/50 text-red-300 border border-red-500/40' : 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/40'
              }`}>
                {message.text}
              </div>
            )}

            <div className="space-y-4 text-xs font-sans">
              {/* Select Variant if available */}
              {adjustingProduct.variants.length > 0 && (
                <div>
                  <label className="block text-[10px] text-[#A3A3A3] uppercase mb-1 font-bold">Target Variant</label>
                  <select
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                    className="w-full bg-[#06191B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] focus:outline-none"
                  >
                    <option value="">-- Apply to Base Product Total --</option>
                    {adjustingProduct.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.size} ({v.color}) — Current: {v.stock} units
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantity Change */}
              <div>
                <label className="block text-[10px] text-[#A3A3A3] uppercase mb-1 font-bold">
                  Stock Change Quantity (Positive to Add, Negative to Deduct)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseInt(changeAmount, 10) || 0;
                      setChangeAmount(String(cur - 1));
                    }}
                    className="p-2.5 bg-[#06191B] hover:bg-red-950 text-red-400 rounded-xl border border-red-500/30 font-bold"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={changeAmount}
                    onChange={(e) => setChangeAmount(e.target.value)}
                    className="flex-1 bg-[#06191B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-center text-sm font-mono font-bold text-[#FAF8F5] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseInt(changeAmount, 10) || 0;
                      setChangeAmount(String(cur + 1));
                    }}
                    className="p-2.5 bg-[#06191B] hover:bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-500/30 font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[10px] text-[#A3A3A3] uppercase mb-1 font-bold">Reason for Stock Movement</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#06191B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] focus:outline-none"
                >
                  <option value="RESTOCK">Restock / Inflow (+)</option>
                  <option value="MANUAL_ADJUSTMENT">Manual Inventory Count / Audit Adjustment</option>
                  <option value="RETURN">Customer Return Restock (+)</option>
                  <option value="DAMAGE">Damaged / Defective Outflow (-)</option>
                  <option value="SALE">Manual Store Sale (-)</option>
                </select>
              </div>

              {/* Note */}
              <div>
                <label className="block text-[10px] text-[#A3A3A3] uppercase mb-1 font-bold">Audit Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Received new shipment batch #401"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-[#06191B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-xs text-[#FAF8F5] focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveStockAdjustment}
                  disabled={submitting}
                  className="w-full bg-[#D4AF37] hover:bg-white text-black py-3 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirm Stock Adjustment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
