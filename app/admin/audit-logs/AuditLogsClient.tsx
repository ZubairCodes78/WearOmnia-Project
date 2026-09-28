'use client';

import React, { useState, useMemo } from 'react';
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
  FileText,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

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
  const debouncedSearch = useDebounce(search, 300);
  const [actionFilter, setActionFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filteredLogs = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return logs.filter((l) => {
      const matchesSearch =
        !term ||
        l.action.toLowerCase().includes(term) ||
        l.entity.toLowerCase().includes(term) ||
        (l.details && l.details.toLowerCase().includes(term)) ||
        (l.ipAddress && l.ipAddress.includes(term));

      const matchesAction = actionFilter === 'ALL' || l.action.startsWith(actionFilter);

      return matchesSearch && matchesAction;
    });
  }, [logs, debouncedSearch, actionFilter]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, actionFilter]);

  const getActionBadgeColor = (action: string) => {
    if (action.includes('SHIPMENT') || action.includes('DISPATCH')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (action.includes('LOGIN') || action.includes('AUTH')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (action.includes('STOCK') || action.includes('INVENTORY')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (action.includes('DELETE') || action.includes('CANCEL')) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    return 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20';
  };

  return (
    <div className="space-y-6 text-[#FAF8F5]">
      {/* Header */}
      <AdminPageHeader
        title="Security Audit Trail & System Logs"
        description="Immutable system activity ledger tracking admin logins, shipment dispatches, settings modifications, and stock adjustments."
        badge={
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-md border border-[#D4AF37]/20">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" /> Security Compliance
          </span>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-[#0A2528] rounded-xl border border-white/5 p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActionFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors whitespace-nowrap ${
              actionFilter === 'ALL'
                ? 'bg-[#D4AF37] text-black shadow-sm'
                : 'text-[#FAF8F5]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            All Logs ({logs.length})
          </button>
          <button
            onClick={() => setActionFilter('SHIPMENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors whitespace-nowrap ${
              actionFilter === 'SHIPMENT'
                ? 'bg-[#D4AF37] text-black shadow-sm'
                : 'text-[#FAF8F5]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Courier & Shipping
          </button>
          <button
            onClick={() => setActionFilter('STOCK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors whitespace-nowrap ${
              actionFilter === 'STOCK'
                ? 'bg-[#D4AF37] text-black shadow-sm'
                : 'text-[#FAF8F5]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Stock Adjustments
          </button>
          <button
            onClick={() => setActionFilter('CUSTOMER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors whitespace-nowrap ${
              actionFilter === 'CUSTOMER'
                ? 'bg-[#D4AF37] text-black shadow-sm'
                : 'text-[#FAF8F5]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Clientele Updates
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-[#FAF8F5]/40 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action, entity, IP, payload..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#06191B] rounded-lg text-xs text-[#FAF8F5] border border-white/10 focus:outline-none focus:border-[#D4AF37]/50 font-sans placeholder:text-[#FAF8F5]/30 transition-colors"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-[#0A2528] rounded-xl border border-white/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#06191B] text-[#FAF8F5]/60 font-semibold border-b border-white/5">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Details & Payload</th>
                <th className="px-4 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8">
                    <AdminEmptyState
                      icon={FileText}
                      title="No audit logs found"
                      description="No security activity records match your current filter or search criteria."
                      action={
                        search || actionFilter !== 'ALL'
                          ? {
                              label: 'Clear Filters',
                              onClick: () => {
                                setSearch('');
                                setActionFilter('ALL');
                              },
                            }
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] font-mono transition-colors">
                    <td className="px-4 py-3 text-[#FAF8F5]/50 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border font-mono ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#FAF8F5] font-sans font-medium">
                      {log.entity}
                      {log.entityId && (
                        <span className="text-[10px] text-[#D4AF37] block font-mono">
                          ID: {log.entityId.slice(0, 8)}...
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-sans text-xs text-[#FAF8F5]/80 max-w-md">
                      {log.details || 'Action completed successfully.'}
                    </td>
                    <td className="px-4 py-3 text-[#FAF8F5]/50 text-[11px] font-mono">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredLogs.length > 0 && (
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredLogs.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        )}
      </div>
    </div>
  );
}
