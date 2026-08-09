import { NotificationProvider, NotificationPayload, NotificationResult } from './types';
import { getSiteSettings } from '@/lib/settings';

export class WhatsAppNotificationProvider implements NotificationProvider {
  name = 'WhatsApp';
  isEnabled = true;

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '+92' + cleaned.substring(1);
    } else if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    return cleaned.replace('+', '');
  }

  generateMessageText(payload: NotificationPayload): { text: string; recipientPhone: string } {
    let recipientPhone = payload.customerPhone || '';

    switch (payload.type) {
      case 'NEW_ORDER_ADMIN': {
        const itemsList = (payload.items || [])
          .map((i) => `• ${i.productTitle} ${i.variantInfo ? `(${i.variantInfo})` : ''} x${i.quantity} - Rs. ${(i.price * i.quantity).toLocaleString()}`)
          .join('\n');

        const text = `🚨 *NEW ORDER ALERT - WearOMNIA*\n\n` +
          `*Order Number:* #${payload.orderNumber}\n` +
          `*Customer Name:* ${payload.customerName}\n` +
          `*Customer Phone:* ${payload.customerPhone}\n` +
          `*City:* ${payload.city || 'N/A'}\n` +
          `*Total Amount:* Rs. ${payload.totalAmount?.toLocaleString()}\n` +
          `*COD Amount:* Rs. ${payload.codAmount?.toLocaleString() || payload.totalAmount?.toLocaleString()}\n\n` +
          `*Ordered Products:*\n${itemsList || 'N/A'}\n\n` +
          `*Time:* ${payload.time || new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}`;

        return { text, recipientPhone: '' }; // Recipient phone will be set to Admin WhatsApp Number from settings
      }

      case 'NEW_ORDER_CUSTOMER': {
        const text = `Thank you for shopping with WearOMNIA.\n\n` +
          `Your order #${payload.orderNumber} has been received successfully.\n\n` +
          `Our team will review your order shortly.\n\n` +
          `Thank you.`;

        return { text, recipientPhone };
      }

      case 'ORDER_STATUS_CONFIRMED': {
        const text = `Your order #${payload.orderNumber} has been confirmed.\n\n` +
          `Our team has started preparing your order.`;

        return { text, recipientPhone };
      }

      case 'ORDER_STATUS_PACKING': {
        const text = `Great news!\n\n` +
          `Your order #${payload.orderNumber} is currently being packed carefully.`;

        return { text, recipientPhone };
      }

      case 'ORDER_STATUS_OUT_FOR_DELIVERY': {
        const text = `Your order #${payload.orderNumber} is on the way.\n\n` +
          `Estimated delivery: 2–3 business days.${payload.trackingNumber ? `\nTracking #: ${payload.trackingNumber}` : ''}`;

        return { text, recipientPhone };
      }

      case 'ORDER_STATUS_DELIVERED': {
        const text = `We hope you love your WearOMNIA order #${payload.orderNumber}.\n\n` +
          `Thank you for choosing us.`;

        return { text, recipientPhone };
      }

      case 'ORDER_STATUS_CANCELLED': {
        const text = `Dear ${payload.customerName || 'Customer'},\n\n` +
          `Your order #${payload.orderNumber} has been cancelled.\n\n` +
          `If you have any questions or wish to replace your order, please contact our concierge team.\n\n` +
          `Thank you, WearOMNIA Team.`;

        return { text, recipientPhone };
      }

      default: {
        const text = `*WearOMNIA Alert*\n\n${payload.title}\n${payload.message}`;
        return { text, recipientPhone };
      }
    }
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      const settings = await getSiteSettings();
      let { text, recipientPhone } = this.generateMessageText(payload);

      if (payload.type === 'NEW_ORDER_ADMIN' || !recipientPhone) {
        recipientPhone = settings.whatsappNumber || settings.storePhone;
      }

      const formattedPhone = this.formatPhoneNumber(recipientPhone);
      const encodedText = encodeURIComponent(text);
      const waApiUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;

      const providerMode = process.env.WHATSAPP_PROVIDER?.toUpperCase();

      // Meta WhatsApp Business Cloud API Dispatch
      if (providerMode === 'META' || (process.env.WHATSAPP_CLOUD_API_TOKEN && process.env.WHATSAPP_CLOUD_PHONE_ID)) {
        const { metaWhatsAppProvider } = await import('./meta');
        const metaRes = await metaWhatsAppProvider.send({
          ...payload,
          customerPhone: formattedPhone,
          message: text,
        });
        if (metaRes.success) return { ...metaRes, whatsappUrl: waApiUrl };
      }

      // Twilio WhatsApp API Dispatch
      if (providerMode === 'TWILIO' || (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)) {
        const { twilioWhatsAppProvider } = await import('./twilio');
        const twilioRes = await twilioWhatsAppProvider.send({
          ...payload,
          customerPhone: formattedPhone,
          message: text,
        });
        if (twilioRes.success) return { ...twilioRes, whatsappUrl: waApiUrl };
      }

      // Pre-rendered URL / Direct Click-to-Chat fallback
      // console.log(`[WhatsApp Strategy Dispatcher] Pre-rendered message generated for ${formattedPhone}:`, text);

      return {
        provider: this.name,
        success: true,
        whatsappUrl: waApiUrl,
      };
    } catch (error: any) {
      console.error('[WhatsApp Notification Provider Error]:', error);
      return {
        provider: this.name,
        success: false,
        error: error.message || 'WhatsApp message generation failed',
      };
    }
  }
}

export const whatsappProvider = new WhatsAppNotificationProvider();
