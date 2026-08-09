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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#141414] p-6 border border-[#262626] rounded-xl">
        <div>
          <h1 className="text-2xl font-serif tracking-wide text-[#FAF8F5]">Automation & WhatsApp Logs</h1>
          <p className="text-xs text-[#A3A3A3] mt-1">
            Real-time audit stream of message dispatches, webhooks, delivery statuses, and automatic retries.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 bg-[#262626] hover:bg-[#333333] text-[#FAF8F5] px-4 py-2 rounded-lg text-xs font-semibold border border-[#404040] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Logs
        </button>
      </div>

      {/* Filter Control Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-[#141414] p-4 border border-[#262626] rounded-xl">
        {/* Search Field */}
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" />
          <input
            type="text"
            placeholder="Filter by Order #, Customer Name, or Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
            className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg pl-9 pr-4 py-2 text-xs text-[#FAF8F5] placeholder-[#525252] focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        {/* Date Filter */}
        <div className="sm:col-span-3">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3 py-2 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3 py-2 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
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
      <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#A3A3A3]">
            <thead className="bg-[#1A1A1A] text-[10px] uppercase tracking-wider text-[#737373] border-b border-[#262626]">
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
            <tbody className="divide-y divide-[#262626]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#737373]">
                    No automation logs found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1A1A1A]/60 transition-colors">
                    <td className="py-4 px-6 text-[#FAF8F5] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-[#D4AF37]">
                      {log.order ? (
                        <span>#{log.order.orderNumber}</span>
                      ) : (
                        <span className="text-[#525252]">System Alert</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-[#FAF8F5]">
                      <div>
                        <p className="font-semibold">{log.recipientPhone}</p>
                        {log.order && <p className="text-[10px] text-[#737373]">{log.order.customerName}</p>}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="bg-[#1A1A1A] px-2.5 py-1 rounded text-[10px] font-mono text-[#D4AF37] border border-[#333333]">
                        {log.messageType}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          log.status === 'READ'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : log.status === 'DELIVERED' || log.status === 'SENT'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : log.status === 'QUEUED'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
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
                      <span className="bg-[#262626] px-2 py-0.5 rounded text-[10px]">
                        {log.attempts}/{log.maxAttempts}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      {log.status === 'FAILED' && log.attempts < log.maxAttempts && (
                        <button
                          onClick={() => handleRetry(log.id)}
                          disabled={retryingId === log.id}
                          className="inline-flex items-center gap-1 bg-[#D4AF37] hover:bg-[#C5A028] text-black px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
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
