import { NotificationProvider, NotificationPayload, NotificationResult } from './types';
import { whatsappProvider } from './whatsapp';
import { emailProvider } from './email';
import { smsProvider } from './sms';
import { pushProvider } from './push';

export class NotificationService {
  private providers: NotificationProvider[] = [
    whatsappProvider,
    emailProvider,
    smsProvider,
    pushProvider,
  ];

  registerProvider(provider: NotificationProvider) {
    this.providers.push(provider);
  }

  async dispatch(payload: NotificationPayload): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const provider of this.providers) {
      if (provider.isEnabled) {
        try {
          const res = await provider.send(payload);
          results.push(res);
        } catch (e: any) {
          results.push({
            provider: provider.name,
            success: false,
            error: e.message || 'Dispatch error',
          });
        }
      }
    }

    return results;
  }
}

export const notificationService = new NotificationService();
