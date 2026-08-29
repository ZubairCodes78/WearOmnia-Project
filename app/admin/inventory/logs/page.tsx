import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Boxes, ArrowDownRight, ArrowUpRight, ShieldCheck, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InventoryLogsPage() {
  const logs = await prisma.inventoryLog.findMany({
    include: { product: true, variant: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-6 text-[#FAF8F5]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0A2528]/85 backdrop-blur-2xl p-6 rounded-3xl border border-[#D4AF37]/30 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#D4AF37] bg-teal-950/80 px-3 py-0.5 rounded-full border border-[#D4AF37]/30">
              Audit Trail
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF8F5] mt-1">
            Inventory Movement Ledger ({logs.length})
          </h1>
          <p className="text-xs text-[#FAF8F5]/70 mt-0.5">
            Immutable audit record of all inflows, outflows, order reservations, and manual stock counts.
          </p>
        </div>

        <Link
          href="/admin/inventory"
          className="bg-[#0D3337] hover:bg-[#103A3E] text-[#D4AF37] border border-[#D4AF37]/40 px-4 py-2.5 rounded-xl text-xs uppercase font-bold tracking-wider transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Inventory
        </Link>
      </div>

      {/* Movement Table */}
      <div className="bg-[#0A2528]/80 backdrop-blur-2xl rounded-3xl border border-[#D4AF37]/20 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#06191B] text-[#D4AF37] uppercase tracking-wider font-semibold border-b border-[#D4AF37]/15">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Product / SKU</th>
                <th className="p-4">Variant Info</th>
                <th className="p-4">Reason / Note</th>
                <th className="p-4">Quantity Change</th>
                <th className="p-4">Stock After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#FAF8F5]/50 italic">
                    No inventory movement logs recorded yet. Stock adjustments will appear here.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#103A3E]/40 font-mono transition-colors">
                    <td className="p-4 text-[#FAF8F5]/60 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="font-serif font-bold text-[#FAF8F5] font-sans text-sm block">
                        {log.product?.title || 'Product'}
                      </span>
                      <span className="text-[11px] text-[#D4AF37]">{log.product?.sku}</span>
                    </td>
                    <td className="p-4 text-[#FAF8F5]/80 font-sans text-xs">
                      {log.variant ? `${log.variant.size} (${log.variant.color})` : 'All Variants / Base'}
                    </td>
                    <td className="p-4 font-semibold text-[#FAF8F5] font-sans text-xs">{log.reason}</td>
                    <td className="p-4 font-bold text-sm">
                      <span className={`inline-flex items-center gap-1 ${
                        log.changeQuantity > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {log.changeQuantity > 0 ? (
                          <>
                            <ArrowUpRight className="w-4 h-4" /> +{log.changeQuantity}
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="w-4 h-4" /> {log.changeQuantity}
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-[#D4AF37] text-sm">{log.stockAfter} Units</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
