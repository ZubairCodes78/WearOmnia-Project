import React from 'react';
import { prisma } from '@/lib/prisma';
import { ShieldCheck, Clock, Terminal } from 'lucide-react';

export default async function AdminAuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-offwhite p-6 rounded-3xl border border-sand shadow-sm">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-champagne-700">Security Ledger</span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-teal mt-1">Audit Logs & Admin Trail ({logs.length})</h1>
        </div>
      </div>

      <div className="bg-offwhite rounded-3xl border border-sand shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-sand text-charcoal uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4">Details</th>
                <th className="p-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-sand/40 font-mono">
                  <td className="p-4 text-charcoal-muted text-[11px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 font-bold text-teal">{log.action}</td>
                  <td className="p-4 font-semibold text-charcoal">{log.entity}</td>
                  <td className="p-4 text-charcoal-muted font-sans text-xs">{log.details || '-'}</td>
                  <td className="p-4 text-charcoal-muted">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
