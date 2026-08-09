import { NotificationProvider, NotificationPayload, NotificationResult } from './types';

export class SMSNotificationProvider implements NotificationProvider {
  name = 'SMS';
  isEnabled = false; // Disabled by default, ready for API credentials

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    // console.log(`[SMS Notification Provider] [${payload.type}] ${payload.title} -> ${payload.customerPhone}`);
    return {
      provider: this.name,
      success: true,
      messageId: `sms-${Date.now()}`,
    };
  }
}

export const smsProvider = new SMSNotificationProvider();
