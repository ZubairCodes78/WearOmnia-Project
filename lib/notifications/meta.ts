import { NotificationProvider, NotificationPayload, NotificationResult } from './types';
import { normalizePhone, validatePhone } from '@/lib/phone';

export class MetaWhatsAppCloudApiProvider implements NotificationProvider {
  name = 'MetaWhatsAppCloudAPI';
  isEnabled = true;

  private apiToken = process.env.WHATSAPP_CLOUD_API_TOKEN || '';
  private phoneId = process.env.WHATSAPP_CLOUD_PHONE_ID || '';
  private apiVersion = 'v21.0';

  private formatRecipient(phone: string): string {
    return normalizePhone(phone);
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const rawPhone = payload.customerPhone || '';
    const recipientPhone = this.formatRecipient(rawPhone);

    if (!recipientPhone || !validatePhone(recipientPhone)) {
      return {
        provider: this.name,
        success: false,
        error: `Invalid Pakistani phone number: "${rawPhone}"`,
      };
    }

    if (!this.apiToken || !this.phoneId || this.apiToken === 'your_meta_cloud_api_bearer_token') {
      return {
        provider: this.name,
        success: true,
        messageId: `sim_meta_${Date.now()}`,
        simulated: true,
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
          body: `${payload.title ? `${payload.title}\n\n` : ''}${payload.message}`,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        const metaCode = responseData?.error?.code;
        const metaMsg = responseData?.error?.message || 'Meta API HTTP request failed';
        console.error('[Meta WhatsApp Cloud API Error]:', {
          httpStatus: response.status,
          metaCode,
          error: metaMsg,
          recipient: recipientPhone.slice(0, 4) + '****' + recipientPhone.slice(-3),
        });

        return {
          provider: this.name,
          success: false,
          error: `Meta Error ${metaCode || response.status}: ${metaMsg}`,
          metaCode,
        };
      }

      return {
        provider: this.name,
        success: true,
        messageId: responseData?.messages?.[0]?.id || `meta-${Date.now()}`,
      };
    } catch (error: any) {
      console.error('[Meta WhatsApp Cloud API Exception]:', { message: error?.message });
      return {
        provider: this.name,
        success: false,
        error: error.message || 'Meta Cloud API network exception',
      };
    }
  }
}

export const metaWhatsAppProvider = new MetaWhatsAppCloudApiProvider();
