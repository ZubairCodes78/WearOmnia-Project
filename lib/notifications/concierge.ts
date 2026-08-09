import { NotificationPayload, NotificationResult } from './types';
import { sseManager } from '@/lib/sse';
import { prisma } from '@/lib/prisma';
import { notificationService } from './service';

export async function dispatchNotification(payload: NotificationPayload): Promise<NotificationResult[]> {
  try {
    // 1. Broadcast real-time SSE event to connected admin clients
    sseManager.broadcast(payload.type, payload);

    // 2. Persist in AdminNotification table
    await prisma.adminNotification.create({
      data: {
        type: payload.type,
        title: payload.title,
        message: payload.message,
        isRead: false,
      },
    }).catch(() => null);

    // 3. Dispatch through notification providers (WhatsApp, Email, etc.)
    const results = await notificationService.dispatch(payload);
    return results;
  } catch (e) {
    console.error('Failed to dispatch notification:', e);
    return [];
  }
}
