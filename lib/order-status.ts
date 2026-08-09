/**
 * WearOMNIA Order Status Workflow
 * 
 * Normal flow:
 *   PENDING → CONFIRMED → PACKING → DISPATCHED → OUT_FOR_DELIVERY → DELIVERED
 * 
 * Alternative paths:
 *   Any status → CANCELLED
 *   DELIVERED → RETURNED
 */

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PACKING',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PACKING: 'Packing',
  DISPATCHED: 'Dispatched',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
};

export const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  PENDING: { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' },
  CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300' },
  PACKING: { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300' },
  DISPATCHED: { bg: 'bg-cyan-100', text: 'text-cyan-900', border: 'border-cyan-300' },
  OUT_FOR_DELIVERY: { bg: 'bg-indigo-100', text: 'text-indigo-900', border: 'border-indigo-300' },
  DELIVERED: { bg: 'bg-green-100', text: 'text-green-900', border: 'border-green-300' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-300' },
  RETURNED: { bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-300' },
};

// Valid status transitions map
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKING', 'CANCELLED'],
  PACKING: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [],
  RETURNED: [],
};

export function getValidNextStatuses(currentStatus: string): string[] {
  return VALID_TRANSITIONS[currentStatus] || [];
}

export function isValidTransition(fromStatus: string, toStatus: string): boolean {
  const validNext = VALID_TRANSITIONS[fromStatus];
  if (!validNext) return false;
  return validNext.includes(toStatus);
}

// Timeline steps for visual timeline display (normal flow only)
export const TIMELINE_STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'PENDING', label: 'Order Placed', icon: '📋' },
  { status: 'CONFIRMED', label: 'Confirmed', icon: '✓' },
  { status: 'PACKING', label: 'Packing', icon: '📦' },
  { status: 'DISPATCHED', label: 'Dispatched', icon: '🚚' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: '🏍️' },
  { status: 'DELIVERED', label: 'Delivered', icon: '✅' },
];

// Notification message templates
export const STATUS_NOTIFICATION_MESSAGES: Record<OrderStatus, (orderNumber: string, courier?: string, trackingNumber?: string) => string> = {
  PENDING: (orderNumber) => `Your WearOMNIA order #${orderNumber} has been received and is awaiting confirmation.`,
  CONFIRMED: (orderNumber) => `Your WearOMNIA order #${orderNumber} has been confirmed. We're preparing it with care.`,
  PACKING: (orderNumber) => `Your WearOMNIA order #${orderNumber} is now being carefully packed at our Lahore Atelier.`,
  DISPATCHED: (orderNumber, courier, trackingNumber) =>
    `Your WearOMNIA order #${orderNumber} has been dispatched${courier ? ` via ${courier}` : ''}.${trackingNumber ? ` Tracking: ${trackingNumber}` : ''}`,
  OUT_FOR_DELIVERY: (orderNumber) => `Your WearOMNIA order #${orderNumber} is out for delivery. Please keep your COD amount ready.`,
  DELIVERED: (orderNumber) => `Your WearOMNIA order #${orderNumber} has been delivered successfully. Thank you for choosing WearOMNIA!`,
  CANCELLED: (orderNumber) => `Your WearOMNIA order #${orderNumber} has been cancelled. If you have any questions, please contact our concierge.`,
  RETURNED: (orderNumber) => `Your WearOMNIA order #${orderNumber} return has been processed.`,
};

// Get the step index for a status in the timeline (for progress display)
export function getTimelineStepIndex(status: string): number {
  return TIMELINE_STEPS.findIndex((s) => s.status === status);
}

// Check if a status is a terminal state
export function isTerminalStatus(status: string): boolean {
  return ['DELIVERED', 'CANCELLED', 'RETURNED'].includes(status);
}
