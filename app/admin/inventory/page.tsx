import React from 'react';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import { AlertTriangle, Boxes } from 'lucide-react';

export default async function AdminInventoryPage() {
  const products = await prisma.product.findMany({
    include: { variants: true, images: true },
    orderBy: { stockQuantity: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-offwhite p-6 rounded-3xl border border-sand shadow-sm">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-champagne-700">Stock Control</span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-teal mt-1">Live Stock & Inventory Alert Console</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <div
            key={p.id}
            className={`p-6 rounded-2xl border transition-all ${
              p.stockQuantity <= 5
                ? 'bg-red-50/70 border-red-300 shadow-md'
                : 'bg-offwhite border-sand shadow-sm'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-sand shrink-0">
                {p.images[0]?.url && <Image src={p.images[0].url} alt={p.title} fill className="object-cover" />}
              </div>
              <div className="flex-1">
                <h4 className="font-serif font-bold text-teal text-sm line-clamp-1">{p.title}</h4>
                <span className="font-mono text-xs text-charcoal-muted block">{p.sku}</span>

                <div className="mt-2 flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold ${
                    p.stockQuantity <= 5 ? 'bg-red-700 text-white animate-pulse' : 'bg-teal text-champagne'
                  }`}>
                    {p.stockQuantity <= 5 ? `⚠️ Low Stock (${p.stockQuantity})` : `${p.stockQuantity} Units`}
                  </span>
                  <span className="text-xs font-bold text-teal">Rs. {p.basePrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Variant Stock Pill Breakdown */}
            <div className="mt-4 pt-3 border-t border-sand/60 flex flex-wrap gap-1.5 text-[10px]">
              {p.variants.map((v) => (
                <span key={v.id} className="bg-sand px-2 py-0.5 rounded font-mono text-charcoal">
                  {v.size} ({v.color}): <strong>{v.stock}</strong>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
