import { NotificationProvider, NotificationPayload, NotificationResult } from './types';

export class EmailNotificationProvider implements NotificationProvider {
  name = 'Email';
  isEnabled = true;

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    // console.log(`[Email Notification Provider] [${payload.type}] ${payload.title} -> ${payload.customerEmail || 'admin'}`);
    return {
      provider: this.name,
      success: true,
      messageId: `email-${Date.now()}`,
    };
  }
}

export const emailProvider = new EmailNotificationProvider();
