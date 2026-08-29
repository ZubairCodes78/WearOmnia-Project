'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw, AlertCircle, CheckCircle2, Clock, Send, Eye, ShieldAlert } from 'lucide-react';

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

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter && statusFilter !== 'ALL') params.set('status', statusFilter);
      if (dateFilter) params.set('date', dateFilter);

      const res = await fetch(`/api/admin/automation-logs?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (logId: string) => {
    setRetryingId(logId);
    try {
      const res = await fetch('/api/admin/automation-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RETRY', logId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Message retry executed successfully!');
        fetchLogs();
      } else {
        alert(data.error || 'Retry failed');
      }
    } catch (e) {
      alert('Error triggering retry');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6 text-[#FAF8F5] font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0A2528] p-6 border border-[#D4AF37]/20 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-[#D4AF37] bg-teal-950/80 px-2.5 py-0.5 rounded border border-[#D4AF37]/30">
              WhatsApp Gateway
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#FAF8F5]">Automation & WhatsApp Logs</h1>
          <p className="text-xs text-[#FAF8F5]/60 mt-1">
            Real-time audit stream of customer notifications, WhatsApp dispatches, delivery statuses, and automatic retries.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 bg-[#0D3337] hover:bg-[#103A3E] text-[#D4AF37] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-[#D4AF37]/30 transition-all shadow"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Logs
        </button>
      </div>

      {/* Filter Control Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-[#0A2528] p-4 border border-[#D4AF37]/15 rounded-2xl shadow">
        {/* Search Field */}
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37]/70" />
          <input
            type="text"
            placeholder="Filter by Order #, Customer Name, or Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
            className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl pl-10 pr-4 py-2 text-xs text-[#FAF8F5] placeholder-[#FAF8F5]/40 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        {/* Date Filter */}
        <div className="sm:col-span-3">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl px-3 py-2 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl px-3 py-2 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37] font-bold uppercase tracking-wider"
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
      <div className="bg-[#0A2528] border border-[#D4AF37]/15 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#FAF8F5]">
            <thead className="bg-[#06191B] text-[10px] uppercase tracking-wider text-[#D4AF37] border-b border-[#D4AF37]/15 font-semibold">
              <tr>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-4">Order</th>
                <th className="py-3.5 px-4">Recipient</th>
                <th className="py-3.5 px-4">Message Event</th>
                <th className="py-3.5 px-4">Delivery Status</th>
                <th className="py-3.5 px-4">Attempts</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#FAF8F5]/50">
                    No automation logs found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#103A3E]/30 transition-colors">
                    <td className="py-4 px-6 text-[#FAF8F5] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-[#D4AF37]">
                      {log.order ? (
                        <span>#{log.order.orderNumber}</span>
                      ) : (
                        <span className="text-[#FAF8F5]/40">System Alert</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-[#FAF8F5]">
                      <div>
                        <p className="font-semibold font-mono">{log.recipientPhone}</p>
                        {log.order && <p className="text-[10px] text-[#FAF8F5]/60">{log.order.customerName}</p>}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="bg-[#06191B] px-2.5 py-1 rounded text-[10px] font-mono text-[#D4AF37] border border-[#D4AF37]/20">
                        {log.messageType}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          log.status === 'READ'
                            ? 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                            : log.status === 'DELIVERED' || log.status === 'SENT'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                            : log.status === 'QUEUED'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                            : 'bg-red-950/60 text-red-300 border-red-500/40'
                        }`}
                      >
                        {log.status === 'FAILED' ? (
                          <AlertCircle className="w-3 h-3 text-red-400" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {log.status}
                      </span>
                      {log.errorDetails && (
                        <p className="text-[9px] text-red-400 mt-1 max-w-xs truncate">{log.errorDetails}</p>
                      )}
                    </td>

                    <td className="py-4 px-4 font-mono text-center">
                      <span className="bg-[#06191B] px-2 py-0.5 rounded text-[10px] border border-white/5">
                        {log.attempts}/{log.maxAttempts}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      {log.status === 'FAILED' && log.attempts < log.maxAttempts && (
                        <button
                          onClick={() => handleRetry(log.id)}
                          disabled={retryingId === log.id}
                          className="inline-flex items-center gap-1 bg-[#D4AF37] hover:bg-white text-black px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow disabled:opacity-50"
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
      </div>
    </div>
  );
}
