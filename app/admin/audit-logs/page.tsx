import React from 'react';
import { ShieldCheck, Clock, Terminal } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminAuditLogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-offwhite p-6 rounded-3xl border border-sand shadow-sm">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-champagne-700">Security Ledger</span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-teal mt-1">Audit Logs & Admin Trail</h1>
        </div>
      </div>

      <div className="bg-offwhite rounded-3xl border border-sand shadow-sm overflow-hidden">
        <div className="p-12 text-center text-charcoal-muted">
          <p className="text-sm">Audit logs are loaded dynamically via the API.</p>
        </div>
      </div>
    </div>
  );
}
