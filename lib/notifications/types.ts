export type NotificationType =
  | 'CONFIRMATION_REQUEST'
  | 'CONFIRMATION_SUCCESS'
  | 'STATUS_UPDATE'
  | 'ADMIN_ALERT';

export type NotificationProviderType = 'WHATSAPP' | 'EMAIL' | 'SMS';

export type NotificationStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface NotificationResult {
  success: boolean;
  provider?: string;
  messageId?: string;
  whatsappUrl?: string;
  error?: string;
  simulated?: boolean;
}

export type NotificationEventType =
  | 'NEW_ORDER_ADMIN'
  | 'NEW_ORDER_CUSTOMER'
  | 'ORDER_STATUS_CONFIRMED'
  | 'ORDER_STATUS_PACKING'
  | 'ORDER_STATUS_OUT_FOR_DELIVERY'
  | 'ORDER_STATUS_DELIVERED'
  | 'ORDER_STATUS_CANCELLED'
  | 'LOW_STOCK';

export interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  trackingNumber?: string;
  city?: string;
  province?: string;
  totalAmount?: number;
  codAmount?: number;
  items?: any[];
  time?: string;
}

export interface WhatsAppSettings {
  whatsapp_mode: 'DEVELOPMENT' | 'PRODUCTION';
  whatsapp_access_token: string;
  whatsapp_phone_number_id: string;
  whatsapp_verify_token: string;
  whatsapp_app_secret: string;
  whatsapp_admin_phone: string;
  whatsapp_auto_confirm_enabled: boolean;
  whatsapp_customer_notify_enabled: boolean;
  whatsapp_admin_notify_enabled: boolean;
  whatsapp_sound_enabled: boolean;
}

export interface NotificationProvider {
  name: string;
  isEnabled: boolean;
  send(payload: NotificationPayload): Promise<NotificationResult>;
}

export interface INotificationProvider {
  name: string;
  providerType: NotificationProviderType;
  sendConfirmationRequest(order: any, settings: WhatsAppSettings): Promise<NotificationResult>;
  sendConfirmationSuccess(order: any, settings: WhatsAppSettings): Promise<NotificationResult>;
  sendAdminAlert(order: any, message: string, settings: WhatsAppSettings): Promise<NotificationResult>;
  sendStatusUpdate(order: any, newStatus: string, settings: WhatsAppSettings): Promise<NotificationResult>;
}
