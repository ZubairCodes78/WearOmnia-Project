import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getMessaging, type MulticastMessage } from 'firebase-admin/messaging';
import { prisma } from '@/lib/prisma';

let firebaseApp: App | null = null;

/**
 * Initializes Firebase Admin SDK singleton.
 * Supports service account JSON, environment variables, or graceful fallback when unconfigured.
 */
export function getFirebaseAdmin(): App | null {
  if (firebaseApp) return firebaseApp;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0]!;
    return firebaseApp;
  }

  const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  try {
    if (serviceAccountKeyJson) {
      let parsedCreds: any;
      try {
        parsedCreds = JSON.parse(serviceAccountKeyJson);
      } catch {
        // If it's a file path
        const fs = require('fs');
        parsedCreds = JSON.parse(fs.readFileSync(serviceAccountKeyJson, 'utf8'));
      }
      firebaseApp = initializeApp({
        credential: cert(parsedCreds),
      });
      return firebaseApp;
    }

    if (projectId && clientEmail && privateKey) {
      firebaseApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      return firebaseApp;
    }

    console.warn('[FCM] Firebase credentials not configured in environment (FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY). Push notifications will run in dry-run mode.');
    return null;
  } catch (error) {
    console.error('[FCM] Failed to initialize Firebase Admin SDK:', error);
    return null;
  }
}

export type AdminPushNotificationType =
  | 'NEW_ORDER'
  | 'PAYMENT_PROOF_SUBMITTED'
  | 'PAYMENT_APPROVED'
  | 'PAYMENT_REJECTED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_CANCELLED'
  | 'SHIPMENT_CREATED'
  | 'SHIPMENT_DISPATCHED'
  | 'ORDER_DELIVERED'
  | 'RTO_UPDATED'
  | 'TEST_NOTIFICATION';

export interface SendPushNotificationOptions {
  idempotencyKey?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  orderId?: string;
  type?: AdminPushNotificationType;
}

export interface PushResult {
  sent: boolean;
  successCount: number;
  failureCount: number;
  tokensCount: number;
  skippedDueToIdempotency?: boolean;
  error?: string;
}

/**
 * High-level helper to trigger push notifications for specific order business events.
 */
export async function sendAdminOrderEventPush(
  type: AdminPushNotificationType,
  order: { id: string; orderNumber: string; totalAmount?: number; customerName?: string },
  extra?: { qualifier?: string; note?: string }
): Promise<PushResult> {
  const amountStr = order.totalAmount ? ` — Rs. ${Math.round(order.totalAmount).toLocaleString()}` : '';
  let title = `Order #${order.orderNumber}`;
  let body = `Update for order #${order.orderNumber}`;

  switch (type) {
    case 'NEW_ORDER':
      title = `New Order #${order.orderNumber}`;
      body = `New order received${amountStr}`;
      break;
    case 'PAYMENT_PROOF_SUBMITTED':
      title = `Payment Proof Submitted`;
      body = `Order #${order.orderNumber} — Payment screenshot uploaded for review`;
      break;
    case 'PAYMENT_APPROVED':
      title = `Payment Approved`;
      body = `Payment verified for Order #${order.orderNumber}`;
      break;
    case 'PAYMENT_REJECTED':
      title = `Payment Rejected`;
      body = `Payment rejected for Order #${order.orderNumber}`;
      break;
    case 'ORDER_CONFIRMED':
      title = `Order Confirmed`;
      body = `Order #${order.orderNumber} is confirmed`;
      break;
    case 'ORDER_CANCELLED':
      title = `Order Cancelled`;
      body = `Order #${order.orderNumber} was cancelled`;
      break;
    case 'SHIPMENT_CREATED':
      title = `Shipment Created`;
      body = `Shipment generated for Order #${order.orderNumber}`;
      break;
    case 'SHIPMENT_DISPATCHED':
      title = `Order Dispatched`;
      body = `Order #${order.orderNumber} is out for delivery / dispatched`;
      break;
    case 'ORDER_DELIVERED':
      title = `Order Delivered`;
      body = `Order #${order.orderNumber} delivered successfully`;
      break;
    case 'RTO_UPDATED':
      title = `RTO / Return Update`;
      body = `Order #${order.orderNumber} status changed: Return/RTO`;
      break;
    case 'TEST_NOTIFICATION':
      title = `WearOMNIA Admin Alert`;
      body = `Test push alert received successfully`;
      break;
  }

  const qualifier = extra?.qualifier ? `:${extra.qualifier}` : '';
  const idempotencyKey = `${type}:${order.id}${qualifier}`;

  return sendAdminPushNotification({
    idempotencyKey,
    type,
    orderId: order.id,
    title,
    body,
    data: {
      type,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName || '',
    },
  });
}

/**
 * Sends a push notification to all active admin devices with idempotency deduplication.
 */
export async function sendAdminPushNotification(options: SendPushNotificationOptions): Promise<PushResult> {
  const { idempotencyKey, title, body, data = {}, orderId, type = 'NEW_ORDER' } = options;

  // 1. Idempotency Check: prevent duplicate notifications for the same event
  if (idempotencyKey) {
    const existingLog = await prisma.adminPushNotificationLog.findUnique({
      where: { idempotencyKey },
    });

    if (existingLog) {
      // console.log(`[FCM] Notification skipped due to idempotency key: ${idempotencyKey}`);
      return {
        sent: false,
        skippedDueToIdempotency: true,
        tokensCount: existingLog.tokensCount,
        successCount: existingLog.successCount,
        failureCount: existingLog.failureCount,
      };
    }
  }

  // 2. Fetch all active admin device tokens
  const activeDevices = await prisma.adminDevice.findMany({
    where: { isActive: true },
    select: { id: true, fcmToken: true, adminId: true },
  });

  if (activeDevices.length === 0) {
    // console.log('[FCM] No active admin devices registered for push notification.');
    if (idempotencyKey) {
      await prisma.adminPushNotificationLog.create({
        data: {
          idempotencyKey,
          type,
          orderId,
          title,
          body,
          tokensCount: 0,
          successCount: 0,
          failureCount: 0,
        },
      }).catch(() => null);
    }
    return { sent: false, tokensCount: 0, successCount: 0, failureCount: 0 };
  }

  const tokens = Array.from(new Set(activeDevices.map(d => d.fcmToken)));
  const app = getFirebaseAdmin();

  if (!app) {
    // Dry-run logging when credentials are not yet supplied in env
    console.log(`[FCM Dry Run] Would send "${title}" to ${tokens.length} devices.`);
    if (idempotencyKey) {
      await prisma.adminPushNotificationLog.create({
        data: {
          idempotencyKey,
          type,
          orderId,
          title,
          body,
          tokensCount: tokens.length,
          successCount: tokens.length,
          failureCount: 0,
        },
      }).catch(() => null);
    }
    return { sent: true, tokensCount: tokens.length, successCount: tokens.length, failureCount: 0 };
  }

  try {
    const payload: MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        type,
        ...(orderId ? { orderId } : {}),
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'wearomnia_orders',
          sound: 'default',
          priority: 'max',
          defaultSound: true,
          defaultVibrateTimings: true,
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            contentAvailable: true,
          },
        },
      },
    };

    const messaging = getMessaging(app);
    const response = await messaging.sendEachForMulticast(payload);

    let successCount = response.successCount;
    let failureCount = response.failureCount;

    // Handle invalid or expired tokens cleanup
    const tokensToRemove: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const errorCode = resp.error.code;
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          tokensToRemove.push(tokens[idx]);
        }
      }
    });

    if (tokensToRemove.length > 0) {
      await prisma.adminDevice.updateMany({
        where: { fcmToken: { in: tokensToRemove } },
        data: { isActive: false },
      }).catch(err => console.error('[FCM] Error deactivating stale tokens:', err));
    }

    if (idempotencyKey) {
      await prisma.adminPushNotificationLog.create({
        data: {
          idempotencyKey,
          type,
          orderId,
          title,
          body,
          tokensCount: tokens.length,
          successCount,
          failureCount,
        },
      }).catch(() => null);
    }

    return {
      sent: true,
      tokensCount: tokens.length,
      successCount,
      failureCount,
    };
  } catch (error: any) {
    console.error('[FCM] Error broadcasting push notification:', error);
    return {
      sent: false,
      tokensCount: tokens.length,
      successCount: 0,
      failureCount: tokens.length,
      error: error?.message || 'FCM multicast error',
    };
  }
}
