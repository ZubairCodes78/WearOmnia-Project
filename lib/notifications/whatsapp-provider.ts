import crypto from 'crypto';
import { INotificationProvider, NotificationProviderType, NotificationResult, WhatsAppSettings } from './types';
import { normalizePhone } from '@/lib/phone';

export class WhatsAppProvider implements INotificationProvider {
  public name = 'Meta WhatsApp Cloud API';
  public providerType: NotificationProviderType = 'WHATSAPP';

  /**
   * Helper to normalize phone numbers to international format without + (e.g., 923001234567)
   */
  public normalizePhone(phone: string): string {
    return normalizePhone(phone);
  }

  /**
   * Validate incoming Meta Webhook HMAC SHA256 Signature
   */
  public validateWebhookSignature(payloadBuffer: Buffer, signatureHeader: string | null, appSecret: string): boolean {
    if (!signatureHeader || !appSecret) return false;
    const signatureParts = signatureHeader.split('=');
    if (signatureParts.length !== 2 || signatureParts[0] !== 'sha256') return false;

    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(payloadBuffer)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signatureParts[1]), Buffer.from(expectedSignature));
  }

  /**
   * Core Meta Graph API Message Dispatcher
   */
  private async sendMetaApiMessage(
    recipientPhone: string,
    messagePayload: any,
    settings: WhatsAppSettings
  ): Promise<NotificationResult> {
    const isDev = settings.whatsapp_mode === 'DEVELOPMENT' || !settings.whatsapp_access_token || !settings.whatsapp_phone_number_id;

    const normalizedPhone = this.normalizePhone(recipientPhone);

    if (isDev) {
      // console.log(`[WhatsApp DEV/SIMULATED MODE] Message to ${normalizedPhone}:`, JSON.stringify(messagePayload, null, 2));
      return {
        success: true,
        messageId: `sim_wa_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        simulated: true,
      };
    }

    try {
      const url = `https://graph.facebook.com/v21.0/${settings.whatsapp_phone_number_id}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.whatsapp_access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          ...messagePayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('[WhatsApp API Error]', data);
        return {
          success: false,
          error: data?.error?.message || 'Meta WhatsApp API request failed',
        };
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id || `wa_${Date.now()}`,
        simulated: false,
      };
    } catch (err: any) {
      console.error('[WhatsApp Network Error]', err);
      return {
        success: false,
        error: err?.message || 'Network error connecting to Meta API',
      };
    }
  }

  /**
   * STEP 2: Send Interactive "Confirm Order" Button WhatsApp Message to Customer
   */
  public async sendConfirmationRequest(order: any, settings: WhatsAppSettings): Promise<NotificationResult> {
    const phone = order.customerWhatsapp || order.customerPhone;
    const bodyText =
      `Hello ${order.customerName},\n\n` +
      `Thank you for shopping with WearOMNIA Haute Couture.\n\n` +
      `Your order ${order.orderNumber} has been received.\n` +
      `Total Amount: Rs. ${order.totalAmount.toLocaleString()} (Cash On Delivery)\n\n` +
      `Please tap the button below to confirm your order so we can dispatch your parcel immediately.`;

    const messagePayload = {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: `confirm_order_${order.id}`,
                title: 'Confirm Order',
              },
            },
          ],
        },
      },
    };

    return this.sendMetaApiMessage(phone, messagePayload, settings);
  }

  /**
   * STEP 6: Send Step 6 WhatsApp Confirmation Reply to Customer
   */
  public async sendConfirmationSuccess(order: any, settings: WhatsAppSettings): Promise<NotificationResult> {
    const phone = order.customerWhatsapp || order.customerPhone;
    const text =
      `Thank you ${order.customerName}.\n\n` +
      `Your Order ${order.orderNumber} has been CONFIRMED successfully!\n\n` +
      `Our atelier team has started preparing your parcel.\n` +
      `Estimated delivery: 2-3 Business Days via Express Courier across Pakistan.`;

    const messagePayload = {
      type: 'text',
      text: { body: text },
    };

    return this.sendMetaApiMessage(phone, messagePayload, settings);
  }

  /**
   * STEP 5: Send Step 5 WhatsApp Notification to Admin
   */
  public async sendAdminAlert(order: any, alertMessage: string, settings: WhatsAppSettings): Promise<NotificationResult> {
    if (!settings.whatsapp_admin_phone) {
      return { success: true, simulated: true };
    }

    const text =
      `🔔 [WearOMNIA Admin Alert]\n\n` +
      `${alertMessage}\n\n` +
      `Order: ${order.orderNumber}\n` +
      `Customer: ${order.customerName} (${order.customerPhone})\n` +
      `Amount: Rs. ${order.totalAmount.toLocaleString()}`;

    const messagePayload = {
      type: 'text',
      text: { body: text },
    };

    return this.sendMetaApiMessage(settings.whatsapp_admin_phone, messagePayload, settings);
  }

  /**
   * STEP 7: Send Status Update (PACKING, DISPATCHED, DELIVERED) to Customer
   */
  public async sendStatusUpdate(order: any, newStatus: string, settings: WhatsAppSettings): Promise<NotificationResult> {
    const phone = order.customerWhatsapp || order.customerPhone;

    let statusText = '';
    if (newStatus === 'PACKING') {
      statusText = `📦 Order ${order.orderNumber} Update: Your luxury garment is now being packed and hand-checked at our Lahore atelier.`;
    } else if (newStatus === 'OUT_FOR_DELIVERY' || newStatus === 'DISPATCHED') {
      statusText = `🚚 Order ${order.orderNumber} Dispatched! Tracking Number: ${order.trackingNumber || 'Pending Courier Slip'}. Expect delivery in 24-48 hours.`;
    } else if (newStatus === 'DELIVERED') {
      statusText = `🎉 Order ${order.orderNumber} Delivered! Thank you for choosing WearOMNIA. Enjoy your luxury outfit!`;
    } else {
      statusText = `Order ${order.orderNumber} Status Updated: ${newStatus}`;
    }

    const messagePayload = {
      type: 'text',
      text: { body: statusText },
    };

    return this.sendMetaApiMessage(phone, messagePayload, settings);
  }

  /**
   * Pre-order: Send Payment Verification Pending Notification to Customer
   */
  public async sendPreOrderReceived(order: any, settings: WhatsAppSettings): Promise<NotificationResult> {
    const phone = order.customerWhatsapp || order.customerPhone;
    const advance = order.preOrderAdvanceAmount ? Number(order.preOrderAdvanceAmount).toLocaleString() : '50%';
    const remaining = order.preOrderRemainingAmount ? Number(order.preOrderRemainingAmount).toLocaleString() : 'Remaining';

    const text =
      `Hello ${order.customerName},\n\n` +
      `Thank you for placing your Pre-Order ${order.orderNumber} with WearOMNIA.\n\n` +
      `• Total Amount: Rs. ${Number(order.totalAmount).toLocaleString()}\n` +
      `• Advance Required (${order.preOrderAdvancePercent || 50}%): Rs. ${advance}\n` +
      `• Balance on Delivery: Rs. ${remaining}\n` +
      `• Payment Method: ${order.preOrderPaymentMethodName || 'Bank/Wallet Transfer'}\n\n` +
      `Our finance team is currently reviewing your payment screenshot. You will receive a confirmation message once verified.`;

    const messagePayload = {
      type: 'text',
      text: { body: text },
    };

    return this.sendMetaApiMessage(phone, messagePayload, settings);
  }

  /**
   * Pre-order: Send Payment Approved Notification to Customer
   */
  public async sendPreOrderApproved(order: any, settings: WhatsAppSettings): Promise<NotificationResult> {
    const phone = order.customerWhatsapp || order.customerPhone;
    const advance = order.preOrderAdvanceAmount ? Number(order.preOrderAdvanceAmount).toLocaleString() : '';
    const remaining = order.preOrderRemainingAmount ? Number(order.preOrderRemainingAmount).toLocaleString() : '';

    const text =
      `🎉 Great news ${order.customerName}!\n\n` +
      `Your advance payment of Rs. ${advance} for Pre-Order ${order.orderNumber} has been VERIFIED & APPROVED.\n\n` +
      `Your pre-order is now CONFIRMED! Remaining balance: Rs. ${remaining}.\n\n` +
      `Our atelier team is preparing your order. Thank you for choosing WearOMNIA.`;

    const messagePayload = {
      type: 'text',
      text: { body: text },
    };

    return this.sendMetaApiMessage(phone, messagePayload, settings);
  }

  /**
   * Pre-order: Send Payment Rejected Notification to Customer
   */
  public async sendPreOrderRejected(order: any, reason: string, settings: WhatsAppSettings): Promise<NotificationResult> {
    const phone = order.customerWhatsapp || order.customerPhone;

    const text =
      `Notice regarding Pre-Order ${order.orderNumber}:\n\n` +
      `Hello ${order.customerName},\n` +
      `We were unable to verify your payment proof screenshot for Pre-Order ${order.orderNumber}.\n\n` +
      `Reason: ${reason || 'Screenshot illegible or transaction not found'}\n\n` +
      `Please reply to this WhatsApp message or re-upload your valid payment screenshot so our team can approve your order.`;

    const messagePayload = {
      type: 'text',
      text: { body: text },
    };

    return this.sendMetaApiMessage(phone, messagePayload, settings);
  }

  /**
   * Send Post-Delivery Review Request with real product review link
   */
  public async sendReviewRequest(order: any, reviewLink: string, settings: WhatsAppSettings): Promise<NotificationResult> {
    const phone = order.customerWhatsapp || order.customerPhone;

    const text =
      `We'd love to hear how you liked your WearOMNIA order ${order.orderNumber}.\n\n` +
      `Leave your review:\n` +
      `${reviewLink}\n\n` +
      `Thank you for shopping with us!`;

    const messagePayload = {
      type: 'text',
      text: { body: text },
    };

    return this.sendMetaApiMessage(phone, messagePayload, settings);
  }
}


