import React from 'react';
import { prisma } from '@/lib/prisma';
import { Users, Phone, MapPin, ShoppingBag } from 'lucide-react';

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    include: { orders: true },
    orderBy: { totalSpent: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-offwhite p-6 rounded-3xl border border-sand shadow-sm">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-champagne-700">Clientele DB</span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-teal mt-1">Consolidated Customer Profiles ({customers.length})</h1>
        </div>
      </div>

      <div className="bg-offwhite rounded-3xl border border-sand shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-sand text-charcoal uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Contact Phone</th>
                <th className="p-4">Location</th>
                <th className="p-4">Total Orders</th>
                <th className="p-4">Lifetime Spend (COD)</th>
                <th className="p-4">Client Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-sand/40">
                  <td className="p-4 font-semibold text-teal text-sm">{c.fullName}</td>
                  <td className="p-4 font-mono font-bold text-charcoal flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-teal" /> {c.phone}
                  </td>
                  <td className="p-4 text-charcoal-muted">
                    {c.city}, {c.province}
                  </td>
                  <td className="p-4 font-bold text-teal">{c.ordersCount} Orders</td>
                  <td className="p-4 font-bold text-teal text-sm">Rs. {c.totalSpent.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold ${
                      c.totalSpent > 40000
                        ? 'bg-champagne text-teal-950 border border-teal'
                        : 'bg-sand text-teal'
                    }`}>
                      {c.totalSpent > 40000 ? '⭐ VIP Privé' : 'Repeat Client'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
