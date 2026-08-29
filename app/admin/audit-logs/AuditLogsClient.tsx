'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Lock,
  Clock,
  Terminal,
  Activity,
  UserCheck,
  Package,
  Settings,
  Truck,
  RotateCcw,
} from 'lucide-react';

interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface AuditLogsClientProps {
  initialLogs: AuditLogItem[];
}

export function AuditLogsClient({ initialLogs }: AuditLogsClientProps) {
  const [logs] = useState<AuditLogItem[]>(initialLogs);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = logs.filter((l) => {
    const term = search.toLowerCase();
    const matchesSearch =
      l.action.toLowerCase().includes(term) ||
      l.entity.toLowerCase().includes(term) ||
      (l.details && l.details.toLowerCase().includes(term)) ||
      (l.ipAddress && l.ipAddress.includes(term));

    const matchesAction = actionFilter === 'ALL' || l.action.startsWith(actionFilter);

    return matchesSearch && matchesAction;
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('SHIPMENT') || action.includes('DISPATCH')) return 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40';
    if (action.includes('LOGIN') || action.includes('AUTH')) return 'bg-blue-950/70 text-blue-300 border-blue-500/40';
    if (action.includes('STOCK') || action.includes('INVENTORY')) return 'bg-purple-950/70 text-purple-300 border-purple-500/40';
    if (action.includes('DELETE') || action.includes('CANCEL')) return 'bg-red-950/70 text-red-300 border-red-500/40';
    return 'bg-teal-950/70 text-[#D4AF37] border-[#D4AF37]/30';
  };

  return (
    <div className="space-y-8 text-[#FAF8F5]">
      {/* Header */}
      <div className="bg-[#0A2528]/85 backdrop-blur-2xl p-8 rounded-3xl border border-[#D4AF37]/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] font-bold text-[#D4AF37] bg-teal-950/80 px-3.5 py-1 rounded-full border border-[#D4AF37]/30">
              <ShieldCheck className="w-3 h-3 text-[#D4AF37]" /> Security Compliance
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#FAF8F5] mt-2">
            Security Audit Trail & System Logs
          </h1>
          <p className="text-xs text-[#FAF8F5]/70 mt-1 font-sans">
            Immutable system activity ledger tracking admin logins, shipment dispatches, settings modifications, and stock alterations.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0A2528]/80 backdrop-blur-xl p-6 rounded-3xl border border-[#D4AF37]/20 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActionFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              actionFilter === 'ALL' ? 'bg-[#D4AF37] text-black shadow' : 'bg-[#06191B] text-[#FAF8F5]/80 hover:text-[#D4AF37]'
            }`}
          >
            All Logs ({logs.length})
          </button>
          <button
            onClick={() => setActionFilter('SHIPMENT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              actionFilter === 'SHIPMENT' ? 'bg-[#D4AF37] text-black shadow' : 'bg-[#06191B] text-[#FAF8F5]/80 hover:text-[#D4AF37]'
            }`}
          >
            Courier & Shipping
          </button>
          <button
            onClick={() => setActionFilter('STOCK')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              actionFilter === 'STOCK' ? 'bg-[#D4AF37] text-black shadow' : 'bg-[#06191B] text-[#FAF8F5]/80 hover:text-[#D4AF37]'
            }`}
          >
            Stock Adjustments
          </button>
          <button
            onClick={() => setActionFilter('CUSTOMER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              actionFilter === 'CUSTOMER' ? 'bg-[#D4AF37] text-black shadow' : 'bg-[#06191B] text-[#FAF8F5]/80 hover:text-[#D4AF37]'
            }`}
          >
            Clientele Updates
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Action, Entity, IP, Details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#06191B] rounded-xl text-xs text-[#FAF8F5] border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37] font-sans"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-[#0A2528]/80 backdrop-blur-2xl rounded-3xl border border-[#D4AF37]/20 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#06191B] text-[#D4AF37] uppercase tracking-wider font-semibold border-b border-[#D4AF37]/15">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4">Details & Payload</th>
                <th className="p-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#FAF8F5]/50 italic">
                    No security audit logs recorded matching this filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#103A3E]/40 font-mono transition-colors">
                    <td className="p-4 text-[#FAF8F5]/60 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border font-mono ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-[#FAF8F5] font-sans font-semibold">
                      {log.entity}
                      {log.entityId && (
                        <span className="text-[10px] text-[#D4AF37] block font-mono">
                          ID: {log.entityId.slice(0, 8)}...
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-sans text-xs text-[#FAF8F5]/80 max-w-md">
                      {log.details || 'Action completed successfully.'}
                    </td>
                    <td className="p-4 text-[#FAF8F5]/60 text-[11px] font-mono">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
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
