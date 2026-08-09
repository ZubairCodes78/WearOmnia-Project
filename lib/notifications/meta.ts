import { NotificationProvider, NotificationPayload, NotificationResult } from './types';
import { normalizePhone } from '@/lib/phone';

export class MetaWhatsAppCloudApiProvider implements NotificationProvider {
  name = 'MetaWhatsAppCloudAPI';
  isEnabled = true;

  private apiToken = process.env.WHATSAPP_CLOUD_API_TOKEN || '';
  private phoneId = process.env.WHATSAPP_CLOUD_PHONE_ID || '';
  private apiVersion = 'v18.0';

  private formatRecipient(phone: string): string {
    return normalizePhone(phone);
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const recipientPhone = this.formatRecipient(payload.customerPhone || '');

    if (!this.apiToken || !this.phoneId) {
      // console.log('[Meta WhatsApp Cloud API] No API credentials set (WHATSAPP_CLOUD_API_TOKEN / WHATSAPP_CLOUD_PHONE_ID). Skipping HTTP dispatch.');
      return {
        provider: this.name,
        success: false,
        error: 'Missing Meta Cloud API credentials',
      };
    }

    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneId}/messages`;

      const requestBody = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: `${payload.title}\n\n${payload.message}`,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('[Meta WhatsApp Cloud API Response Error]:', responseData);
        return {
          provider: this.name,
          success: false,
          error: responseData?.error?.message || 'Meta API HTTP request failed',
        };
      }

      return {
        provider: this.name,
        success: true,
        messageId: responseData?.messages?.[0]?.id || `meta-${Date.now()}`,
      };
    } catch (error: any) {
      console.error('[Meta WhatsApp Cloud API Exception]:', error);
      return {
        provider: this.name,
        success: false,
        error: error.message || 'Meta Cloud API network exception',
      };
    }
  }
}

export const metaWhatsAppProvider = new MetaWhatsAppCloudApiProvider();
