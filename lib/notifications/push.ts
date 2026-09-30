import { NotificationProvider, NotificationPayload, NotificationResult } from './types';
import { sendAdminPushNotification } from './fcm';

export class PushNotificationProvider implements NotificationProvider {
  name = 'Push';
  isEnabled = true;

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      const result = await sendAdminPushNotification({
        idempotencyKey: payload.orderNumber ? `NOTIF_${payload.type}:${payload.orderNumber}` : undefined,
        type: 'NEW_ORDER',
        title: payload.title,
        body: payload.message,
        data: {
          recipient: payload.customerPhone || '',
          type: payload.type,
          ...(payload.orderNumber ? { orderNumber: payload.orderNumber } : {}),
        },
      });

      return {
        provider: this.name,
        success: result.sent,
        messageId: `fcm-${Date.now()}`,
        error: result.error,
      };
    } catch (err: any) {
      return {
        provider: this.name,
        success: false,
        error: err?.message || 'Push provider failed',
      };
    }
  }
}

export const pushProvider = new PushNotificationProvider();
