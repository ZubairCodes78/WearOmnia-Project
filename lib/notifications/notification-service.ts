import { PrismaClient } from '@prisma/client';
import { WhatsAppProvider } from './whatsapp-provider';
import { WhatsAppSettings } from './types';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const DEFAULT_SETTINGS: WhatsAppSettings = {
  whatsapp_mode: 'DEVELOPMENT',
  whatsapp_access_token: '',
  whatsapp_phone_number_id: '',
  whatsapp_verify_token: 'wearomnia_secure_webhook_token_2026',
  whatsapp_app_secret: '',
  whatsapp_admin_phone: '923001234567',
  whatsapp_auto_confirm_enabled: true,
  whatsapp_customer_notify_enabled: true,
  whatsapp_admin_notify_enabled: true,
  whatsapp_sound_enabled: true,
};

export class NotificationService {
  private static whatsappProvider = new WhatsAppProvider();

  /**
   * Helper to load WhatsApp configuration settings from DB SiteSettings
   */
  public static async getSettings(): Promise<WhatsAppSettings> {
    try {
      const records = await prisma.siteSettings.findMany();
      const settingsMap: any = { ...DEFAULT_SETTINGS };

      records.forEach((rec) => {
        try {
          settingsMap[rec.key] = JSON.parse(rec.value);
        } catch {
          settingsMap[rec.key] = rec.value;
        }
      });

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
          recipientPhone: data.recipientPhone,
          messageType: data.messageType,
          provider: data.provider || 'WHATSAPP',
          payload: data.payload ? JSON.stringify(data.payload) : null,
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
   * STEP 1 & 2: Trigger WhatsApp Interactive "Confirm Order" Message when Order is Created
   */
  public static async sendOrderConfirmationRequest(order: any) {
    const settings = await this.getSettings();

    if (!settings.whatsapp_customer_notify_enabled) {
      // console.log('[NotificationService] Customer notifications disabled in settings.');
      return;
    }

    const recipientPhone = order.customerWhatsapp || order.customerPhone;

    // Log initial queued message
    const logRecord = await this.logNotification({
      orderId: order.id,
      recipientPhone,
      messageType: 'CONFIRMATION_REQUEST',
      status: 'QUEUED',
      attempts: 1,
    });

    const result = await this.whatsappProvider.sendConfirmationRequest(order, settings);

    if (result.success) {
      if (logRecord) {
        await prisma.notificationLog.update({
          where: { id: logRecord.id },
          data: {
            status: 'SENT',
            whatsappMessageId: result.messageId,
          },
        });
      }

      await prisma.orderTimeline.create({
        data: {
          orderId: order.id,
          status: 'PENDING',
          note: `WhatsApp Order Confirmation interactive button sent to ${recipientPhone} (Message ID: ${result.messageId || 'simulated'})`,
          updatedBy: 'WhatsApp Automation Service',
        },
      });
    } else {
      if (logRecord) {
        await prisma.notificationLog.update({
          where: { id: logRecord.id },
          data: {
            status: 'FAILED',
            errorDetails: result.error,
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          action: 'WHATSAPP_SEND_FAILED',
          entity: 'Order',
          entityId: order.id,
          details: `Failed to send WhatsApp confirmation to ${recipientPhone}: ${result.error}`,
        },
      });
    }

    return result;
  }

  /**
   * STEP 6: Send Confirmation Success Reply to Customer
   */
  public static async sendConfirmationSuccess(order: any) {
    const settings = await this.getSettings();
    if (!settings.whatsapp_customer_notify_enabled) return;

    const recipientPhone = order.customerWhatsapp || order.customerPhone;

    const result = await this.whatsappProvider.sendConfirmationSuccess(order, settings);

    await this.logNotification({
      orderId: order.id,
      recipientPhone,
      messageType: 'CONFIRMATION_SUCCESS',
      status: result.success ? 'SENT' : 'FAILED',
      whatsappMessageId: result.messageId,
      errorDetails: result.error,
    });

    return result;
  }

  /**
   * STEP 5: Send Alert to Admin
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
   * STEP 7: Send Status Update (PACKING, DISPATCHED, DELIVERED) to Customer
   */
  public static async sendStatusUpdate(order: any, newStatus: string) {
    const settings = await this.getSettings();
    if (!settings.whatsapp_customer_notify_enabled) return;

    const recipientPhone = order.customerWhatsapp || order.customerPhone;

    const result = await this.whatsappProvider.sendStatusUpdate(order, newStatus, settings);

    await this.logNotification({
      orderId: order.id,
      recipientPhone,
      messageType: `STATUS_UPDATE_${newStatus}`,
      status: result.success ? 'SENT' : 'FAILED',
      whatsappMessageId: result.messageId,
      errorDetails: result.error,
    });

    return result;
  }

  /**
   * Manual or Automated Retry helper for failed notification logs
   */
  public static async retryFailedNotification(logId: string) {
    const log = await prisma.notificationLog.findUnique({
      where: { id: logId },
      include: { order: true },
    });

    if (!log || !log.order) {
      throw new Error('Notification log or order not found');
    }

    if (log.attempts >= log.maxAttempts) {
      throw new Error(`Maximum retry attempts (${log.maxAttempts}) reached for this message`);
    }

    const settings = await this.getSettings();
    const newAttempts = log.attempts + 1;

    let result;
    if (log.messageType === 'CONFIRMATION_REQUEST') {
      result = await this.whatsappProvider.sendConfirmationRequest(log.order, settings);
    } else if (log.messageType === 'CONFIRMATION_SUCCESS') {
      result = await this.whatsappProvider.sendConfirmationSuccess(log.order, settings);
    } else {
      result = await this.whatsappProvider.sendStatusUpdate(log.order, log.messageType.replace('STATUS_UPDATE_', ''), settings);
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
}
