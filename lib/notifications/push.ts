import { NotificationProvider, NotificationPayload, NotificationResult } from './types';

export class PushNotificationProvider implements NotificationProvider {
  name = 'Push';
  isEnabled = false; // Disabled by default, ready for Web Push / FCM integration

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    // console.log(`[Push Notification Provider] [${payload.type}] ${payload.title}`);
    return {
      provider: this.name,
      success: true,
      messageId: `push-${Date.now()}`,
    };
  }
}

export const pushProvider = new PushNotificationProvider();
