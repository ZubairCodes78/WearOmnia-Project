import React from 'react';
import { prisma } from '@/lib/prisma';
import { Boxes, ArrowDownRight, ArrowUpRight, ShieldCheck } from 'lucide-react';

export default async function InventoryLogsPage() {
  const logs = await prisma.inventoryLog.findMany({
    include: { product: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-offwhite p-6 rounded-3xl border border-sand shadow-sm">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-champagne-700">Audit Ledger</span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-teal mt-1">Inventory Movement Logs ({logs.length})</h1>
        </div>
      </div>

      <div className="bg-offwhite rounded-3xl border border-sand shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-sand text-charcoal uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Product / SKU</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Quantity Change</th>
                <th className="p-4">Stock Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-sand/40 font-mono">
                  <td className="p-4 text-charcoal-muted text-[11px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className="font-serif font-bold text-teal font-sans text-sm block">
                      {log.product?.title || 'Product'}
                    </span>
                    <span className="text-[11px] text-charcoal-muted">{log.product?.sku}</span>
                  </td>
                  <td className="p-4 font-semibold text-charcoal font-sans">{log.reason}</td>
                  <td className="p-4 font-bold text-sm">
                    <span className={`flex items-center gap-1 ${
                      log.changeQuantity > 0 ? 'text-green-700' : 'text-red-700'
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
                  <td className="p-4 font-bold text-teal text-sm">{log.stockAfter} Units</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
