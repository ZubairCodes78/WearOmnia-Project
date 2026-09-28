'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw, AlertCircle, CheckCircle2, Clock, Send, Eye, ShieldAlert, MessageSquare } from 'lucide-react';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

interface NotificationLogItem {
  id: string;
  orderId?: string | null;
  recipientPhone: string;
  messageType: string;
  provider: string;
  payload?: string | null;
  status: string;
  whatsappMessageId?: string | null;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string | null;
  errorDetails?: string | null;
  createdAt: string;
  order?: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    status: string;
  } | null;
}

export function AutomationLogsClient({ initialLogs }: { initialLogs: NotificationLogItem[] }) {
  const router = useRouter();
  const [logs, setLogs] = useState<NotificationLogItem[]>(initialLogs);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchLogs = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter && statusFilter !== 'ALL') params.set('status', statusFilter);
      if (dateFilter) params.set('date', dateFilter);

      const res = await fetch(`/api/admin/automation-logs?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
        setCurrentPage(1);
      }
    } catch (e) {
      console.error(e);
      setStatusMessage({ text: 'Error fetching logs.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (logId: string) => {
    setRetryingId(logId);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/automation-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RETRY', logId }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage({ text: 'Message retry initiated successfully.' });
        fetchLogs();
      } else {
        setStatusMessage({ text: data.error || 'Retry failed.', isError: true });
      }
    } catch {
      setStatusMessage({ text: 'Network error triggering retry.', isError: true });
    } finally {
      setRetryingId(null);
    }
  };

  const totalPages = Math.ceil(logs.length / pageSize) || 1;
  const paginatedLogs = logs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 text-[#FAF8F5] font-sans">
      {/* Header Bar */}
      <AdminPageHeader
        title="WhatsApp Automation & Dispatch Logs"
        description="Real-time audit stream of automated customer notifications, WhatsApp webhook dispatches, and delivery status events."
        badge={
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-md border border-[#D4AF37]/20">
            <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" /> WhatsApp Gateway
          </span>
        }
        actions={
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D3337] hover:bg-[#103A3E] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Logs
          </button>
        }
      />

      {statusMessage && (
        <div
          className={`p-3 rounded-lg text-xs font-medium border ${
            statusMessage.isError
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Filter Control Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-[#0A2528] p-4 border border-white/5 rounded-xl shadow-sm">
        {/* Search Field */}
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#FAF8F5]/40" />
          <input
            type="text"
            placeholder="Search order #, customer, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
            className="w-full bg-[#06191B] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#FAF8F5] placeholder:text-[#FAF8F5]/30 focus:outline-none focus:border-[#D4AF37]/50"
          />
        </div>

        {/* Date Filter */}
        <div className="sm:col-span-3">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full bg-[#06191B] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]/50"
          />
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#06191B] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]/50 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="QUEUED">Queued</option>
            <option value="SENT">Sent</option>
            <option value="DELIVERED">Delivered</option>
            <option value="READ">Read</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Logs Data Table */}
      <div className="bg-[#0A2528] border border-white/5 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#FAF8F5]">
            <thead className="bg-[#06191B] text-[10px] uppercase tracking-wider text-[#FAF8F5]/60 border-b border-white/5 font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Message Event</th>
                <th className="py-3 px-4">Delivery Status</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <AdminEmptyState
                      icon={MessageSquare}
                      title="No automation logs found"
                      description="No notification dispatches match your search or filter parameters."
                      action={
                        search || statusFilter !== 'ALL' || dateFilter
                          ? {
                              label: 'Reset Filters',
                              onClick: () => {
                                setSearch('');
                                setStatusFilter('ALL');
                                setDateFilter('');
                              },
                            }
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-[#FAF8F5]/60 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-[#D4AF37]">
                      {log.order ? (
                        <span>{log.order.orderNumber}</span>
                      ) : (
                        <span className="text-[#FAF8F5]/40 font-sans">System Alert</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[#FAF8F5]">
                      <div>
                        <p className="font-mono font-medium text-xs">{log.recipientPhone}</p>
                        {log.order && <p className="text-[11px] text-[#FAF8F5]/50">{log.order.customerName}</p>}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="bg-[#06191B] px-2 py-0.5 rounded text-[10px] font-mono text-[#D4AF37] border border-white/5">
                        {log.messageType}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          log.status === 'READ'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : log.status === 'DELIVERED' || log.status === 'SENT'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : log.status === 'QUEUED'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {log.status === 'FAILED' ? (
                          <AlertCircle className="w-3 h-3 text-rose-400" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {log.status}
                      </span>
                      {log.errorDetails && (
                        <p className="text-[10px] text-rose-400/80 mt-1 max-w-xs truncate">{log.errorDetails}</p>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-center">
                      <span className="bg-[#06191B] px-2 py-0.5 rounded text-[10px] border border-white/5">
                        {log.attempts}/{log.maxAttempts}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {log.status === 'FAILED' && log.attempts < log.maxAttempts && (
                        <button
                          onClick={() => handleRetry(log.id)}
                          disabled={retryingId === log.id}
                          className="inline-flex items-center gap-1 bg-[#D4AF37] hover:bg-[#c49f2f] text-black px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${retryingId === log.id ? 'animate-spin' : ''}`} /> Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {logs.length > 0 && (
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={logs.length}
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
