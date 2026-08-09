import { NotificationProvider, NotificationPayload, NotificationResult } from './types';
import { normalizePhone } from '@/lib/phone';

export class TwilioWhatsAppProvider implements NotificationProvider {
  name = 'TwilioWhatsApp';
  isEnabled = true;

  private accountSid = process.env.TWILIO_ACCOUNT_SID || '';
  private authToken = process.env.TWILIO_AUTH_TOKEN || '';
  private fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

  private formatRecipient(phone: string): string {
    return `whatsapp:+${normalizePhone(phone)}`;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.accountSid || !this.authToken) {
      // console.log('[Twilio WhatsApp API] No Twilio credentials configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN). Skipping HTTP dispatch.');
      return {
        provider: this.name,
        success: false,
        error: 'Missing Twilio credentials',
      };
    }

    try {
      const recipient = this.formatRecipient(payload.customerPhone || '');
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

      const params = new URLSearchParams();
      params.append('From', this.fromNumber);
      params.append('To', recipient);
      params.append('Body', `${payload.title}\n\n${payload.message}`);

      const basicAuth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('[Twilio WhatsApp API Response Error]:', responseData);
        return {
          provider: this.name,
          success: false,
          error: responseData?.message || 'Twilio API request failed',
        };
      }

      return {
        provider: this.name,
        success: true,
        messageId: responseData?.sid || `twilio-${Date.now()}`,
      };
    } catch (error: any) {
      console.error('[Twilio WhatsApp API Exception]:', error);
      return {
        provider: this.name,
        success: false,
        error: error.message || 'Twilio network exception',
      };
    }
  }
}

export const twilioWhatsAppProvider = new TwilioWhatsAppProvider();
