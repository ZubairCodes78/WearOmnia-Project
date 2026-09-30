import { PrismaClient } from '@prisma/client';
import { WhatsAppProvider } from './whatsapp-provider';
import { WhatsAppSettings, NotificationResult } from './types';
import { normalizePhone, validatePhone } from '@/lib/phone';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const DEFAULT_SETTINGS: WhatsAppSettings = {
  whatsapp_mode: 'DEVELOPMENT',
  whatsapp_access_token: '',
  whatsapp_phone_number_id: '',
  whatsapp_verify_token: 'wearomnia_secure_webhook_token_2026',
  whatsapp_app_secret: '',
  whatsapp_admin_phone: '923180633323',
  whatsapp_auto_confirm_enabled: true,
  whatsapp_customer_notify_enabled: true,
  whatsapp_admin_notify_enabled: true,
  whatsapp_sound_enabled: true,
  whatsapp_order_confirmation_template: 'wearomnia_order_confirmation',
  whatsapp_order_status_template: 'wearomnia_order_status_update',
};

export class NotificationService {
  private static whatsappProvider = new WhatsAppProvider();

  /**
   * Helper to load WhatsApp configuration settings with DB and process.env fallback resolution
   */
  public static async getSettings(): Promise<WhatsAppSettings> {
    try {
      const records = await prisma.siteSettings.findMany();
      const settingsMap: any = { ...DEFAULT_SETTINGS };

      records.forEach((rec) => {
        try {
          const parsed = JSON.parse(rec.value);
          if (rec.key === 'site_config' && typeof parsed === 'object' && parsed !== null) {
            Object.assign(settingsMap, parsed);
          }
          settingsMap[rec.key] = parsed;
        } catch {
          settingsMap[rec.key] = rec.value;
        }
      });

      // Environmental Fallbacks for Production Vercel / Docker environments
      if (!settingsMap.whatsapp_access_token && process.env.WHATSAPP_CLOUD_API_TOKEN) {
        settingsMap.whatsapp_access_token = process.env.WHATSAPP_CLOUD_API_TOKEN.trim();
      }
      if (!settingsMap.whatsapp_phone_number_id && process.env.WHATSAPP_CLOUD_PHONE_ID) {
        settingsMap.whatsapp_phone_number_id = process.env.WHATSAPP_CLOUD_PHONE_ID.trim();
      }
      if (
        (!settingsMap.whatsapp_verify_token || settingsMap.whatsapp_verify_token === DEFAULT_SETTINGS.whatsapp_verify_token) &&
        (process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN)
      ) {
        settingsMap.whatsapp_verify_token = (process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN)!.trim();
      }
      if (!settingsMap.whatsapp_app_secret && process.env.WHATSAPP_APP_SECRET) {
        settingsMap.whatsapp_app_secret = process.env.WHATSAPP_APP_SECRET.trim();
      }
      if (!settingsMap.whatsapp_admin_phone && process.env.WHATSAPP_ADMIN_PHONE) {
        settingsMap.whatsapp_admin_phone = process.env.WHATSAPP_ADMIN_PHONE.trim();
      }

      // Automatically adopt PRODUCTION mode if valid token & phone id are present in env/db and not explicitly set to DEVELOPMENT
      if (
        settingsMap.whatsapp_access_token &&
        settingsMap.whatsapp_phone_number_id &&
        settingsMap.whatsapp_access_token !== 'your_meta_cloud_api_bearer_token' &&
        (process.env.WHATSAPP_MODE === 'PRODUCTION' || process.env.NODE_ENV === 'production' || settingsMap.whatsapp_mode === 'PRODUCTION')
      ) {
        settingsMap.whatsapp_mode = 'PRODUCTION';
      }

      return settingsMap as WhatsAppSettings;
    } catch (e) {
      console.error('[NotificationService] Error loading settings from DB:', e);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Log an event into NotificationLog in DB
   */
  public static async logNotification(data: {
    orderId?: string;
    recipientPhone: string;
    messageType: string;
    provider?: string;
    payload?: any;
    status: string;
    whatsappMessageId?: string;
    attempts?: number;
    errorDetails?: string;
  }) {
    try {
      return await prisma.notificationLog.create({
        data: {
          orderId: data.orderId || null,
          recipientPhone: normalizePhone(data.recipientPhone),
          messageType: data.messageType,
          provider: data.provider || 'WHATSAPP',
          payload: data.payload ? (typeof data.payload === 'string' ? data.payload : JSON.stringify(data.payload)) : null,
          status: data.status,
          whatsappMessageId: data.whatsappMessageId || null,
          attempts: data.attempts || 1,
          lastAttemptAt: new Date(),
          errorDetails: data.errorDetails || null,
        },
      });
    } catch (e) {
      console.error('[NotificationService] Error saving NotificationLog:', e);
      return null;
    }
  }

  /**
   * PHASE 4 & PHASE 6: ORDER CONFIRMATION
   * The FIRST customer message after an order is created.
   * Generates detailed order confirmation, checks idempotency key ORDER_CONFIRMED:${order.id},
   * prevents duplicate sends, records results individually.
   */
  public static async sendOrderConfirmation(order: any): Promise<NotificationResult> {
    const settings = await this.getSettings();

    if (!settings.whatsapp_customer_notify_enabled) {
      return { success: true, simulated: true, error: 'Customer notifications disabled in settings' };
    }

    const rawPhone = order.customerWhatsapp || order.customerPhone || '';
    const recipientPhone = normalizePhone(rawPhone);

    // Validate phone number before sending
    if (!recipientPhone || !validatePhone(recipientPhone)) {
      const err = `Invalid Pakistani phone number: "${rawPhone}". Message skipped.`;
      await this.logNotification({
        orderId: order.id,
        recipientPhone: rawPhone,
        messageType: 'ORDER_CONFIRMATION',
        status: 'FAILED',
        errorDetails: err,
        attempts: 1,
      });

      return {
        success: false,
        error: err,
        isTransient: false,
        skipped: true,
        skippedReason: err,
      };
    }

    // Idempotency: Prevent duplicate confirmation messages
    if (order.confirmationWhatsAppSentAt) {
      return {
        success: true,
        messageId: order.confirmationWhatsAppMessageId || 'already_sent',
        skipped: true,
        skippedReason: `Confirmation already sent on ${new Date(order.confirmationWhatsAppSentAt).toISOString()}`,
      };
    }

    const existingSentLog = await prisma.notificationLog.findFirst({
      where: {
        orderId: order.id,
        messageType: 'ORDER_CONFIRMATION',
        status: 'SENT',
      },
    });

    if (existingSentLog) {
      return {
        success: true,
        messageId: existingSentLog.whatsappMessageId || 'already_sent',
        skipped: true,
        skippedReason: `Confirmation already recorded in notification log (ID: ${existingSentLog.whatsappMessageId})`,
      };
    }

    // Ensure order items are loaded for full product details
    let fullOrder = order;
    if (!Array.isArray(order.items) || order.items.length === 0) {
      const dbOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true, shipments: true },
      });
      if (dbOrder) fullOrder = dbOrder;
    }

    const logRecord = await this.logNotification({
      orderId: order.id,
      recipientPhone,
      messageType: 'ORDER_CONFIRMATION',
      status: 'QUEUED',
      attempts: 1,
    });

    const result = await this.whatsappProvider.sendOrderConfirmation(fullOrder, settings);

    if (result.success) {
      const now = new Date();
      if (logRecord) {
        await prisma.notificationLog.update({
          where: { id: logRecord.id },
          data: {
            status: 'SENT',
            whatsappMessageId: result.messageId,
            lastAttemptAt: now,
          },
        }).catch(() => {});
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          confirmationWhatsAppSentAt: now,
          confirmationWhatsAppMessageId: result.messageId || 'sent',
          timeline: {
            create: {
              status: order.status || 'CONFIRMED',
              note: `WhatsApp Order Confirmation dispatched to ${recipientPhone} (Message ID: ${result.messageId || 'simulated'}).`,
              updatedBy: 'WhatsApp Automation Service',
            },
          },
        },
      }).catch(() => {});
    } else {
      if (logRecord) {
        await prisma.notificationLog.update({
          where: { id: logRecord.id },
          data: {
            status: 'FAILED',
            errorDetails: result.error,
            lastAttemptAt: new Date(),
          },
        }).catch(() => {});
      }

      await prisma.auditLog.create({
        data: {
          action: 'WHATSAPP_CONFIRMATION_FAILED',
          entity: 'Order',
          entityId: order.id,
          details: `Failed to send WhatsApp confirmation to ${recipientPhone}: ${result.error}`,
        },
      }).catch(() => {});
    }

    return result;
  }

  /**
   * For backwards compatibility with legacy triggers:
   * Maps sendOrderConfirmationRequest directly to the comprehensive sendOrderConfirmation.
   */
  public static async sendOrderConfirmationRequest(order: any) {
    return this.sendOrderConfirmation(order);
  }

  /**
   * For backwards compatibility with legacy triggers:
   * Maps sendConfirmationSuccess directly to sendOrderConfirmation.
   */
  public static async sendConfirmationSuccess(order: any) {
    return this.sendOrderConfirmation(order);
  }

  /**
   * Send Alert to Admin
   */
  public static async sendAdminAlert(order: any, message: string) {
    const settings = await this.getSettings();
    if (!settings.whatsapp_admin_notify_enabled || !settings.whatsapp_admin_phone) return;

    const result = await this.whatsappProvider.sendAdminAlert(order, message, settings);

    await this.logNotification({
      orderId: order.id,
      recipientPhone: settings.whatsapp_admin_phone,
      messageType: 'ADMIN_ALERT',
      status: result.success ? 'SENT' : 'FAILED',
      whatsappMessageId: result.messageId,
      errorDetails: result.error,
    });

    return result;
  }

  /**
   * PHASE 7: STATUS UPDATE (PACKING, DISPATCHED, DELIVERED, CANCELLED, RTO)
   */
  public static async sendStatusUpdate(order: any, newStatus: string) {
    const settings = await this.getSettings();
    if (!settings.whatsapp_customer_notify_enabled) return;

    const rawPhone = order.customerWhatsapp || order.customerPhone || '';
    const recipientPhone = normalizePhone(rawPhone);

    if (!recipientPhone || !validatePhone(recipientPhone)) {
      const err = `Invalid Pakistani phone number: "${rawPhone}". Status update skipped.`;
      return {
        success: false,
        error: err,
        isTransient: false,
        skipped: true,
        skippedReason: err,
      };
    }

    const logRecord = await this.logNotification({
      orderId: order.id,
      recipientPhone,
      messageType: `STATUS_UPDATE_${newStatus}`,
      status: 'QUEUED',
      attempts: 1,
    });

    const result = await this.whatsappProvider.sendStatusUpdate(order, newStatus, settings);

    if (logRecord) {
      await prisma.notificationLog.update({
        where: { id: logRecord.id },
        data: {
          status: result.success ? 'SENT' : 'FAILED',
          whatsappMessageId: result.messageId,
          errorDetails: result.error,
          lastAttemptAt: new Date(),
        },
      }).catch(() => {});
    }

    return result;
  }

  /**
   * Safe Retry helper for failed notification logs
   * Only retries transient failures; prevents blind retries of permanent errors.
   */
  public static async retryFailedNotification(logId: string) {
    const log = await prisma.notificationLog.findUnique({
      where: { id: logId },
      include: { order: { include: { items: true, shipments: true } } },
    });

    if (!log || !log.order) {
      throw new Error('Notification log or order record not found');
    }

    if (log.attempts >= log.maxAttempts) {
      throw new Error(`Maximum retry attempts (${log.maxAttempts}) reached for this notification`);
    }

    // Do NOT retry permanent errors (e.g. invalid phone number)
    if (!validatePhone(log.recipientPhone)) {
      throw new Error(`Cannot retry: Permanent error with invalid recipient phone number (${log.recipientPhone})`);
    }

    const settings = await this.getSettings();
    const newAttempts = log.attempts + 1;

    let result: NotificationResult;
    if (log.messageType === 'ORDER_CONFIRMATION' || log.messageType === 'CONFIRMATION_REQUEST' || log.messageType === 'CONFIRMATION_SUCCESS') {
      result = await this.whatsappProvider.sendOrderConfirmation(log.order, settings);
    } else if (log.messageType.startsWith('STATUS_UPDATE_')) {
      const status = log.messageType.replace('STATUS_UPDATE_', '');
      result = await this.whatsappProvider.sendStatusUpdate(log.order, status, settings);
    } else {
      result = await this.whatsappProvider.sendOrderConfirmation(log.order, settings);
    }

    await prisma.notificationLog.update({
      where: { id: logId },
      data: {
        attempts: newAttempts,
        status: result.success ? 'SENT' : 'FAILED',
        whatsappMessageId: result.messageId || log.whatsappMessageId,
        errorDetails: result.error || null,
        lastAttemptAt: new Date(),
      },
    });

    return result;
  }

  /**
   * Pre-order: Send confirmation when customer submits pre-order with payment proof
   */
  public static async sendPreOrderReceived(order: any) {
    return this.sendOrderConfirmation(order);
  }

  /**
   * Pre-order: Send approval notification when Admin verifies payment
   */
  public static async sendPreOrderApproved(order: any) {
    const settings = await this.getSettings();
    if (!settings.whatsapp_customer_notify_enabled) return;

    // Idempotency: prevent sending duplicate approval message
    const existing = await prisma.notificationLog.findFirst({
      where: {
        orderId: order.id,
        messageType: 'PRE_ORDER_APPROVED',
        status: 'SENT',
      },
    });
    if (existing) return { success: true, messageId: existing.whatsappMessageId };

    const recipientPhone = normalizePhone(order.customerWhatsapp || order.customerPhone);
    const logRecord = await this.logNotification({
      orderId: order.id,
      recipientPhone,
      messageType: 'PRE_ORDER_APPROVED',
      status: 'QUEUED',
      attempts: 1,
    });

    const result = await this.whatsappProvider.sendPreOrderApproved(order, settings);

    if (logRecord) {
      await prisma.notificationLog.update({
        where: { id: logRecord.id },
        data: {
          status: result.success ? 'SENT' : 'FAILED',
          whatsappMessageId: result.messageId,
          errorDetails: result.error,
        },
      });
    }

    return result;
  }

  /**
   * Pre-order: Send rejection notification if payment proof is invalid
   */
  public static async sendPreOrderRejected(order: any, reason: string) {
    const settings = await this.getSettings();
    if (!settings.whatsapp_customer_notify_enabled) return;

    const recipientPhone = normalizePhone(order.customerWhatsapp || order.customerPhone);
    const logRecord = await this.logNotification({
      orderId: order.id,
      recipientPhone,
      messageType: 'PRE_ORDER_REJECTED',
      status: 'QUEUED',
      attempts: 1,
    });

    const result = await this.whatsappProvider.sendPreOrderRejected(order, reason, settings);

    if (logRecord) {
      await prisma.notificationLog.update({
        where: { id: logRecord.id },
        data: {
          status: result.success ? 'SENT' : 'FAILED',
          whatsappMessageId: result.messageId,
          errorDetails: result.error,
        },
      });
    }

    return result;
  }

  /**
   * Post-Delivery: Send Review Request with real product/order review link
   */
  public static async sendReviewRequest(order: any, reviewLink: string) {
    const settings = await this.getSettings();
    if (!settings.whatsapp_customer_notify_enabled) return;

    // Duplicate protection: Check if review request was already sent for this order
    const existing = await prisma.notificationLog.findFirst({
      where: {
        orderId: order.id,
        messageType: 'REVIEW_REQUEST',
        status: 'SENT',
      },
    });
    if (existing) {
      return { success: true, message: 'Review request already sent previously' };
    }

    const recipientPhone = normalizePhone(order.customerWhatsapp || order.customerPhone);
    const logRecord = await this.logNotification({
      orderId: order.id,
      recipientPhone,
      messageType: 'REVIEW_REQUEST',
      status: 'QUEUED',
      attempts: 1,
    });

    const result = await this.whatsappProvider.sendReviewRequest(order, reviewLink, settings);

    if (logRecord) {
      await prisma.notificationLog.update({
        where: { id: logRecord.id },
        data: {
          status: result.success ? 'SENT' : 'FAILED',
          whatsappMessageId: result.messageId,
          errorDetails: result.error,
        },
      });
    }

    return result;
  }
}
