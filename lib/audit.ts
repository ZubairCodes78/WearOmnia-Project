import { prisma } from '@/lib/prisma';

export async function recordAuditLog(
  action: string,
  entity: string,
  entityId?: string,
  details?: string,
  ipAddress?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId: entityId || null,
        details: details || null,
        ipAddress: ipAddress || '127.0.0.1',
      },
    });
  } catch (e) {
    console.error('Failed to record audit log:', e);
  }
}
