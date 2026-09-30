import crypto from 'crypto';
import { INotificationProvider, NotificationProviderType, NotificationResult, WhatsAppSettings } from './types';
import { normalizePhone, validatePhone } from '@/lib/phone';

/**
 * Parse variant info string (e.g. "Size: M, Color: Black" or "M / Black")
 */
export function parseVariantInfo(variantInfo?: string | null): { size: string; color: string } {
  if (!variantInfo) return { size: 'Standard', color: 'Standard' };

  let size = 'Standard';
  let color = 'Standard';

  const sizeMatch = variantInfo.match(/size\s*:\s*([^,;]+)/i);
  if (sizeMatch && sizeMatch[1]?.trim()) {
    size = sizeMatch[1].trim();
  }

  const colorMatch = variantInfo.match(/color\s*:\s*([^,;]+)/i);
  if (colorMatch && colorMatch[1]?.trim()) {
    color = colorMatch[1].trim();
  }

  if (size === 'Standard' && color === 'Standard' && variantInfo.includes('/')) {
    const parts = variantInfo.split('/').map((s) => s.trim());
    if (parts[0]) size = parts[0];
    if (parts[1]) color = parts[1];
  }

  return { size, color };
}

/**
 * Format the official Phase 4 WearOMNIA Order Confirmation message
 */
export function buildOrderConfirmationMessage(order: any): string {
  const customerName = order.customerName || 'Customer';
  const orderNumber = order.orderNumber || order.id?.substring(0, 8);

  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];

  const itemsText = items.length > 0
    ? items
        .map((item: any) => {
          const title = item.productTitle || item.title || 'Luxury Garment';
          const { size, color } = parseVariantInfo(item.variantInfo);
          const qty = item.quantity || 1;
          return `${title}\nQuantity: ${qty}\nSize: ${size}\nColor: ${color}`;
        })
        .join('\n\n')
    : 'WearOMNIA Luxury Garment\nQuantity: 1\nSize: Standard\nColor: Standard';

  const subtotal = Math.round(Number(order.subtotal || 0)).toLocaleString('en-PK');
  const discount = Math.round(Number(order.discountAmount || 0)).toLocaleString('en-PK');
  const shipping = Math.round(Number(order.shippingFee || 0)).toLocaleString('en-PK');
  const total = Math.round(Number(order.totalAmount || 0)).toLocaleString('en-PK');

  let preOrderBlock = '';
  let paymentMethod = 'Cash On Delivery (COD)';
  let paymentStatus = 'Pending on Delivery';

  if (order.isPreOrder) {
    const advancePercent = order.preOrderAdvancePercent || 50;
    const advanceAmount = Math.round(
      Number(order.preOrderAdvanceAmount ?? ((order.totalAmount || 0) * advancePercent) / 100)
    );
    const paidAmount = Math.round(Number(order.amountPaid || 0));
    const remainingAmount = Math.round(
      Number(order.preOrderRemainingAmount ?? ((order.totalAmount || 0) - paidAmount))
    );

    preOrderBlock =
      `\nFor pre-orders:\n\n` +
      `Advance Required: Rs. ${advanceAmount.toLocaleString('en-PK')}\n` +
      `Advance Paid: Rs. ${paidAmount.toLocaleString('en-PK')}\n` +
      `Remaining Balance: Rs. ${remainingAmount.toLocaleString('en-PK')}\n`;

    paymentMethod =
      order.preOrderPaymentMethodName || order.paymentMethod || 'Bank / Wallet Transfer';
    paymentStatus =
      order.preOrderPaymentStatus === 'PAYMENT_APPROVED'
        ? 'Advance Paid & Verified'
        : order.preOrderPaymentStatus === 'PAYMENT_REJECTED'
        ? 'Payment Proof Rejected'
        : 'Payment Verification Pending';
  } else if (order.paymentMethod === 'PAID_ONLINE' || order.paymentMethod === 'ONLINE') {
    paymentMethod = 'Online Card / Wallet';
    paymentStatus = 'Paid in Full';
  }

  const deliveryAddress = order.shippingAddress || 'Address on file';
  const city = order.shippingCity || 'Pakistan';

  return (
    `WearOMNIA\n\n` +
    `ORDER CONFIRMATION\n\n` +
    `Assalam-o-Alaikum ${customerName},\n\n` +
    `Thank you for shopping with WearOMNIA.\n` +
    `Your order has been received successfully.\n\n` +
    `Order No: #${orderNumber}\n\n` +
    `ORDER DETAILS\n` +
    `${itemsText}\n\n` +
    `ORDER SUMMARY\n` +
    `Subtotal: Rs. ${subtotal}\n` +
    `Discount: Rs. ${discount}\n` +
    `Shipping: Rs. ${shipping}\n` +
    `Order Total: Rs. ${total}\n` +
    `${preOrderBlock}\n` +
    `Payment Method: ${paymentMethod}\n` +
    `Payment Status: ${paymentStatus}\n\n` +
    `Delivery Address:\n` +
    `${deliveryAddress}\n\n` +
    `City: ${city}\n\n` +
    `We will keep you updated about your order.\n\n` +
    `Thank you for choosing WearOMNIA.\n\n` +
    `WearOMNIA\n` +
    `Modern Modesty, Made Distinct.`
  );
}

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
  public validateWebhookSignature(
    payloadBuffer: Buffer,
    signatureHeader: string | null,
    appSecret: string
  ): boolean {
    if (!signatureHeader || !appSecret) return false;
    const signatureParts = signatureHeader.split('=');
    if (signatureParts.length !== 2 || signatureParts[0] !== 'sha256') return false;

    try {
      const expectedSignature = crypto
        .createHmac('sha256', appSecret)
        .update(payloadBuffer)
        .digest('hex');

      return crypto.timingSafeEqual(Buffer.from(signatureParts[1]), Buffer.from(expectedSignature));
    } catch {
      return false;
    }
  }

  /**
   * Core Meta Graph API Message Dispatcher
   * Validates phone format, handles rate limits, parses Meta error responses, never leaks secrets.
   */
  public async sendMetaApiMessage(
    recipientPhone: string,
    messagePayload: any,
    settings: WhatsAppSettings
  ): Promise<NotificationResult> {
    const rawPhone = recipientPhone || '';
    const normalizedPhone = this.normalizePhone(rawPhone);

    // Phase 3 Phone Validation
    if (!normalizedPhone || !validatePhone(normalizedPhone)) {
      return {
        success: false,
        error: `Invalid Pakistani phone number: "${rawPhone}". Expected format: 03XXXXXXXXX or 923XXXXXXXXX.`,
        isTransient: false,
        skipped: true,
        skippedReason: `Invalid Pakistani phone number: "${rawPhone}"`,
      };
    }

    // Resolve API token & phone number ID with fallback to process.env
    const apiToken =
      settings.whatsapp_access_token?.trim() ||
      process.env.WHATSAPP_CLOUD_API_TOKEN?.trim() ||
      '';
    const phoneId =
      settings.whatsapp_phone_number_id?.trim() ||
      process.env.WHATSAPP_CLOUD_PHONE_ID?.trim() ||
      '';

    const isSimulated =
      settings.whatsapp_mode === 'DEVELOPMENT' ||
      !apiToken ||
      !phoneId ||
      apiToken === 'your_meta_cloud_api_bearer_token';

    if (isSimulated) {
      return {
        success: true,
        messageId: `sim_wa_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        simulated: true,
      };
    }

    try {
      const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          ...messagePayload,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const httpStatus = res.status;
        const metaError = data?.error || {};
        const metaCode = metaError.code;
        const metaSubcode = metaError.error_subcode;
        const metaMsg = metaError.message || 'Meta WhatsApp API request failed';
        const metaType = metaError.type || 'MetaAPIError';

        // Categorize transient vs permanent
        const isTransient =
          httpStatus === 429 ||
          metaCode === 130429 ||
          httpStatus >= 500 ||
          httpStatus === 503;

        // Structured user-friendly diagnostics
        let userReason = `Meta Error ${metaCode || httpStatus}: ${metaMsg}`;
        if (metaCode === 131047) {
          userReason =
            'Meta Error 131047: 24-hour customer window expired. Business-initiated notifications require an approved WhatsApp Template in Meta Business Manager.';
        } else if (metaCode === 132001 || metaCode === 100) {
          userReason = `Meta Error ${metaCode}: Specified template does not exist or is pending approval in Meta Business Manager.`;
        } else if (metaCode === 190) {
          userReason = 'Meta Error 190: WhatsApp Cloud API access token is invalid or expired.';
        } else if (metaCode === 131026) {
          userReason = 'Meta Error 131026: Undeliverable message. Recipient phone number is not registered on WhatsApp.';
        }

        // Safe production logging without secrets
        console.error('[Meta WhatsApp Cloud API Error]', {
          httpStatus,
          metaCode,
          metaSubcode,
          error: metaMsg,
          recipient: normalizedPhone.slice(0, 4) + '****' + normalizedPhone.slice(-3),
          messageType: messagePayload.type,
          isTransient,
        });

        return {
          success: false,
          error: userReason,
          metaCode,
          metaSubcode,
          isTransient,
        };
      }

      const messageId = data?.messages?.[0]?.id || `wa_${Date.now()}`;
      return {
        success: true,
        messageId,
        simulated: false,
      };
    } catch (err: any) {
      console.error('[WhatsApp Network Exception]', {
        message: err?.message,
        recipient: normalizedPhone.slice(0, 4) + '****' + normalizedPhone.slice(-3),
      });

      return {
        success: false,
        error: err?.message || 'Network error connecting to Meta WhatsApp Cloud API',
        isTransient: true,
      };
    }
  }

  /**
   * PHASE 4: FIRST ORDER CONFIRMATION MESSAGE
   * Sends the full, detailed WearOMNIA order confirmation.
   */
  public async sendOrderConfirmation(order: any, settings: WhatsAppSettings): Promise<NotificationResult> {
    const phone = order.customerWhatsapp || order.customerPhone;
    const bodyText = buildOrderConfirmationMessage(order);

    // If template name configured, format template payload, else send text payload
    const templateName =
      settings.whatsapp_order_confirmation_template ||
      process.env.WHATSAPP_ORDER_CONFIRMATION_TEMPLATE;

    let payload: any;
    if (templateName) {
      payload = {
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: order.customerName || 'Customer' },
                { type: 'text', text: order.orderNumber || '' },
                { type: 'text', text: bodyText },
              ],
            },
          ],
        },
      };
    } else {
      payload = {
        type: 'text',
        text: { body: bodyText },
      };
    }

    return this.sendMetaApiMessage(phone, payload, settings);
  }

  /**
   * Interactive "Confirm Order" Button WhatsApp Message to Customer (Legacy / Secondary)
   */
  public async sendConfirmationRequest(order: any, settings: WhatsAppSettings): Promise<NotificationResult> {
    const phone = order.customerWhatsapp || order.customerPhone;
    const bodyText = buildOrderConfirmationMessage(order);

    const messagePayload = {
      type: 'text',
      text: { body: bodyText },
    };

    return this.sendMetaApiMessage(phone, messagePayload, settings);
  }

  /**
   * Send Order Confirmation Success Reply to Customer
   */
  public async sendConfirmationSuccess(order: any, settings: WhatsAppSettings): Promise<NotificationResult> {
    return this.sendOrderConfirmation(order, settings);
  }

  /**
   * Send Alert to Admin
   */
  public async sendAdminAlert(order: any, alertMessage: string, settings: WhatsAppSettings): Promise<NotificationResult> {
    const adminPhone =
      settings.whatsapp_admin_phone ||
      process.env.WHATSAPP_ADMIN_PHONE ||
      '923180633323';

    if (!adminPhone) {
      return { success: true, simulated: true };
    }

    const text =
      `🔔 [WearOMNIA Admin Alert]\n\n` +
      `${alertMessage}\n\n` +
      `Order: #${order.orderNumber}\n` +
      `Customer: ${order.customerName} (${order.customerPhone})\n` +
      `Amount: Rs. ${Number(order.totalAmount || 0).toLocaleString('en-PK')}`;

    const messagePayload = {
      type: 'text',
      text: { body: text },
    };

    return this.sendMetaApiMessage(adminPhone, messagePayload, settings);
  }

  /**
   * PHASE 7: STATUS UPDATE MESSAGES
   * Supports: CONFIRMED, PACKING, DISPATCHED, DELIVERED, CANCELLED, RTO/RETURNED
   */
  public async sendStatusUpdate(
    order: any,
    newStatus: string,
    settings: WhatsAppSettings
  ): Promise<NotificationResult> {
    const phone = order.customerWhatsapp || order.customerPhone;
    const customerName = order.customerName || 'Customer';
    const orderNumber = order.orderNumber || order.id?.substring(0, 8);

    let statusText = '';
    const statusUpper = (newStatus || '').toUpperCase();

    if (statusUpper === 'CONFIRMED') {
      statusText =
        `WearOMNIA\n\n` +
        `ORDER CONFIRMED\n\n` +
        `Assalam-o-Alaikum ${customerName},\n\n` +
        `Your order #${orderNumber} has been CONFIRMED successfully!\n\n` +
        `Our atelier team has started preparing your parcel.\n` +
        `Estimated delivery: 2-3 Business Days via Express Courier across Pakistan.\n\n` +
        `Thank you for choosing WearOMNIA.\n\n` +
        `WearOMNIA\n` +
        `Modern Modesty, Made Distinct.`;
    } else if (statusUpper === 'PACKING') {
      statusText =
        `WearOMNIA\n\n` +
        `ORDER IN PROGRESS\n\n` +
        `Assalam-o-Alaikum ${customerName},\n\n` +
        `📦 Order #${orderNumber} Update: Your luxury garment is now being packed and hand-checked with utmost care at our Lahore atelier.\n\n` +
        `We will notify you with courier tracking as soon as it is dispatched.\n\n` +
        `WearOMNIA\n` +
        `Modern Modesty, Made Distinct.`;
    } else if (statusUpper === 'OUT_FOR_DELIVERY' || statusUpper === 'DISPATCHED') {
      const courier = order.courier || 'PostEx';
      const trackingNumber = order.trackingNumber || 'Pending Courier Slip';
      const trackingLink = order.trackingNumber
        ? `https://postex.pk/tracking?trackingNumber=${encodeURIComponent(order.trackingNumber)}`
        : 'Available shortly on courier portal';

      statusText =
        `WearOMNIA\n\n` +
        `ORDER DISPATCHED\n\n` +
        `Assalam-o-Alaikum ${customerName},\n\n` +
        `🚚 Your Order #${orderNumber} has been DISPATCHED!\n\n` +
        `Courier: ${courier}\n` +
        `Tracking Number: ${trackingNumber}\n` +
        `Tracking Link: ${trackingLink}\n\n` +
        `Expect delivery in 24-48 hours across Pakistan.\n\n` +
        `Thank you for choosing WearOMNIA.\n\n` +
        `WearOMNIA\n` +
        `Modern Modesty, Made Distinct.`;
    } else if (statusUpper === 'DELIVERED') {
      statusText =
        `WearOMNIA\n\n` +
        `ORDER DELIVERED\n\n` +
        `Assalam-o-Alaikum ${customerName},\n\n` +
        `🎉 Order #${orderNumber} has been delivered successfully!\n\n` +
        `Thank you for choosing WearOMNIA. We hope you love your luxury outfit!\n\n` +
        `WearOMNIA\n` +
        `Modern Modesty, Made Distinct.`;
    } else if (statusUpper === 'CANCELLED') {
      statusText =
        `WearOMNIA\n\n` +
        `ORDER CANCELLED\n\n` +
        `Dear ${customerName},\n\n` +
        `Your Order #${orderNumber} has been cancelled.\n\n` +
        `If you have any questions or wish to replace your order, please contact our concierge team at 03180633323.\n\n` +
        `Thank you,\n` +
        `WearOMNIA Team`;
    } else if (statusUpper === 'RTO' || statusUpper === 'RETURNED') {
      statusText =
        `WearOMNIA\n\n` +
        `RETURN NOTICE\n\n` +
        `Dear ${customerName},\n\n` +
        `Order #${orderNumber} has been marked as Return to Origin (RTO).\n\n` +
        `If you missed your delivery or need assistance, please contact WearOMNIA support.\n\n` +
        `WearOMNIA Team`;
    } else {
      statusText =
        `WearOMNIA\n\n` +
        `ORDER UPDATE\n\n` +
        `Assalam-o-Alaikum ${customerName},\n\n` +
        `Order #${orderNumber} status updated to: ${newStatus}.\n\n` +
        `Thank you for choosing WearOMNIA.`;
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
    return this.sendOrderConfirmation(order, settings);
  }

  /**
   * Pre-order: Send Payment Approved Notification to Customer
   */
  public async sendPreOrderApproved(order: any, settings: WhatsAppSettings): Promise<NotificationResult> {
    const phone = order.customerWhatsapp || order.customerPhone;
    const advance = order.preOrderAdvanceAmount ? Number(order.preOrderAdvanceAmount).toLocaleString('en-PK') : '';
    const remaining = order.preOrderRemainingAmount ? Number(order.preOrderRemainingAmount).toLocaleString('en-PK') : '';

    const text =
      `WearOMNIA\n\n` +
      `PRE-ORDER PAYMENT APPROVED\n\n` +
      `Assalam-o-Alaikum ${order.customerName},\n\n` +
      `🎉 Great news! Your advance payment of Rs. ${advance} for Pre-Order #${order.orderNumber} has been VERIFIED & APPROVED.\n\n` +
      `Your pre-order is now CONFIRMED! Remaining balance: Rs. ${remaining}.\n\n` +
      `Our atelier team is preparing your order. Thank you for choosing WearOMNIA.\n\n` +
      `WearOMNIA\n` +
      `Modern Modesty, Made Distinct.`;

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
      `WearOMNIA\n\n` +
      `PRE-ORDER PAYMENT NOTICE\n\n` +
      `Assalam-o-Alaikum ${order.customerName},\n\n` +
      `We were unable to verify your payment proof screenshot for Pre-Order #${order.orderNumber}.\n\n` +
      `Reason: ${reason || 'Screenshot illegible or transaction not found'}\n\n` +
      `Please reply to this WhatsApp message or re-upload your valid payment screenshot so our team can approve your order.\n\n` +
      `WearOMNIA Support`;

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
      `WearOMNIA\n\n` +
      `Assalam-o-Alaikum ${order.customerName},\n\n` +
      `We would love to hear how you liked your WearOMNIA order #${order.orderNumber}.\n\n` +
      `Please leave your review here:\n` +
      `${reviewLink}\n\n` +
      `Thank you for choosing WearOMNIA.\n\n` +
      `WearOMNIA\n` +
      `Modern Modesty, Made Distinct.`;

    const messagePayload = {
      type: 'text',
      text: { body: text },
    };

    return this.sendMetaApiMessage(phone, messagePayload, settings);
  }
}
