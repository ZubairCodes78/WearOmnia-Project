import React from 'react';
import { PrismaClient } from '@prisma/client';
import { AutomationLogsClient } from './AutomationLogsClient';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const dynamic = 'force-dynamic';

export default async function AutomationLogsPage() {
  const initialLogs = await prisma.notificationLog.findMany({
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerPhone: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const formattedLogs = initialLogs.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    lastAttemptAt: l.lastAttemptAt ? l.lastAttemptAt.toISOString() : null,
  }));

  return <AutomationLogsClient initialLogs={formattedLogs} />;
}
