import React from 'react';
import { prisma } from '@/lib/prisma';
import { AuditLogsClient } from './AuditLogsClient';

export const dynamic = 'force-dynamic';

export default async function AdminAuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 150,
  });

  return <AuditLogsClient initialLogs={logs as any} />;
}
