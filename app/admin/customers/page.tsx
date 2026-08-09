import React from 'react';
import { Users, Phone, MapPin, ShoppingBag } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminCustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-offwhite p-6 rounded-3xl border border-sand shadow-sm">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-champagne-700">Clientele DB</span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-teal mt-1">Consolidated Customer Profiles</h1>
        </div>
      </div>

      <div className="bg-offwhite rounded-3xl border border-sand shadow-sm overflow-hidden">
        <div className="p-12 text-center text-charcoal-muted">
          <p className="text-sm">Customer data is loaded dynamically via the API.</p>
        </div>
      </div>
    </div>
  );
}
