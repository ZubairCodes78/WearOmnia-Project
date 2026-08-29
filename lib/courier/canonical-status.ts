/**
 * WearOMNIA Canonical Courier Status Engine
 *
 * Single Source of Truth for Logistics & Shipment Lifecycle.
 *
 * Strictly separates:
 * 1. Order Status (Shop level: PENDING, CONFIRMED, PACKING, DISPATCHED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, RETURNED)
 * 2. Courier Status (Logistics level: BOOKED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, ATTEMPTED, RETURNED, CANCELLED, FAILED, ARCHIVED)
 * 3. Settlement Status (Remittance level: PENDING, SETTLED, UNPAID, PARTIAL, NOT_APPLICABLE)
 */

export type CanonicalCourierStatus =
  | 'BOOKED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'ATTEMPTED'
  | 'RETURNED'
  | 'CANCELLED'
  | 'FAILED'
  | 'ARCHIVED';

export type CanonicalSettlementStatus =
  | 'PENDING'
  | 'SETTLED'
  | 'UNPAID'
  | 'PARTIAL'
  | 'NOT_APPLICABLE';

export interface CourierStatusBadgeInfo {
  status: CanonicalCourierStatus;
  label: string;
  sublabel?: string;
  badgeClass: string;
  dotClass: string;
  isTerminal: boolean;
  isActive: boolean;
}

/**
 * Maps any raw courier status string (PostEx, TCS, Leopards, Manual) into canonical status
 */
export function getCanonicalCourierStatus(rawStatus: string | null | undefined): CanonicalCourierStatus {
  if (!rawStatus) return 'BOOKED';
  const clean = rawStatus.trim().toLowerCase();

  // Failed / Invalid
  if (clean === 'failed' || clean.includes('error') || clean.includes('rejected')) {
    return 'FAILED';
  }

  // Archived
  if (clean === 'archived' || clean === 'archive') {
    return 'ARCHIVED';
  }

  // Cancelled (Merchant cancellation on PostEx = "un-assigned by me" / "cancelled" / "expired")
  if (
    clean === 'cancelled' ||
    clean === 'canceled' ||
    clean === 'un-assigned by me' ||
    clean === 'unassigned by me' ||
    clean === 'unassigned' ||
    clean === 'un-assigned' ||
    clean === 'expired' ||
    clean.includes('cancelled by merchant')
  ) {
    return 'CANCELLED';
  }

  // Returned / RTO
  if (
    clean === 'returned' ||
    clean === 'returned to origin' ||
    clean === 'out for return' ||
    clean === 'rto' ||
    clean.includes('returned')
  ) {
    return 'RETURNED';
  }

  // Delivered
  if (clean === 'delivered') {
    return 'DELIVERED';
  }

  // Attempted / Under Review
  if (
    clean === 'attempted' ||
    clean === 'delivery attempted' ||
    clean === 'delivery under review' ||
    clean.includes('under review')
  ) {
    return 'ATTEMPTED';
  }

  // Out For Delivery
  if (
    clean === 'out for delivery' ||
    clean === 'out_for_delivery' ||
    clean === 'with rider'
  ) {
    return 'OUT_FOR_DELIVERY';
  }

  // In Transit / PostEx Warehouse
  if (
    clean === 'in_transit' ||
    clean === 'in transit' ||
    clean === 'postex warehouse' ||
    clean === 'in postex warehouse' ||
    clean === 'picked by postex' ||
    clean === 'picked_up' ||
    clean === 'en-route to postex warehouse' ||
    clean.includes('warehouse') ||
    clean.includes('en-route')
  ) {
    return 'IN_TRANSIT';
  }

  // Picked Up
  if (clean === 'picked by postex' || clean === 'picked_up') {
    return 'PICKED_UP';
  }

  // Booked / Created / Pending Dispatch
  if (
    clean === 'booked' ||
    clean === 'unbooked' ||
    clean === 'created' ||
    clean === 'pending' ||
    clean === 'shipment created'
  ) {
    return 'BOOKED';
  }

  return 'BOOKED';
}

/**
 * Returns UI Badge presentation tokens for canonical courier status
 */
export function getCourierStatusBadgeInfo(status: string | null | undefined): CourierStatusBadgeInfo {
  const canonical = getCanonicalCourierStatus(status);

  switch (canonical) {
    case 'DELIVERED':
      return {
        status: canonical,
        label: 'Delivered',
        sublabel: 'Parcel received by customer',
        badgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40',
        dotClass: 'bg-emerald-400',
        isTerminal: true,
        isActive: false,
      };

    case 'IN_TRANSIT':
      return {
        status: canonical,
        label: 'In Transit',
        sublabel: 'At Courier Logistics Hub',
        badgeClass: 'bg-teal-950/60 text-teal-300 border-teal-500/40',
        dotClass: 'bg-teal-400 animate-pulse',
        isActive: true,
        isTerminal: false,
      };

    case 'OUT_FOR_DELIVERY':
      return {
        status: canonical,
        label: 'Out for Delivery',
        sublabel: 'With delivery rider',
        badgeClass: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40',
        dotClass: 'bg-cyan-400 animate-ping',
        isActive: true,
        isTerminal: false,
      };

    case 'PICKED_UP':
      return {
        status: canonical,
        label: 'Picked Up',
        sublabel: 'Courier collected package',
        badgeClass: 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40',
        dotClass: 'bg-indigo-400',
        isActive: true,
        isTerminal: false,
      };

    case 'BOOKED':
      return {
        status: canonical,
        label: 'Booked',
        sublabel: 'Awaiting courier pickup',
        badgeClass: 'bg-blue-950/60 text-blue-300 border-blue-500/40',
        dotClass: 'bg-blue-400',
        isActive: true,
        isTerminal: false,
      };

    case 'ATTEMPTED':
      return {
        status: canonical,
        label: 'Attempted',
        sublabel: 'Delivery under review / retry',
        badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-500/40',
        dotClass: 'bg-amber-400 animate-pulse',
        isActive: true,
        isTerminal: false,
      };

    case 'RETURNED':
      return {
        status: canonical,
        label: 'Returned (RTO)',
        sublabel: 'Returned to merchant',
        badgeClass: 'bg-rose-950/60 text-rose-300 border-rose-500/40',
        dotClass: 'bg-rose-400',
        isTerminal: true,
        isActive: false,
      };

    case 'CANCELLED':
      return {
        status: canonical,
        label: 'Cancelled',
        sublabel: 'Cancelled on Courier',
        badgeClass: 'bg-red-950/50 text-red-300 border-red-500/30',
        dotClass: 'bg-red-400',
        isTerminal: true,
        isActive: false,
      };

    case 'ARCHIVED':
      return {
        status: canonical,
        label: 'Archived',
        sublabel: 'Historical record',
        badgeClass: 'bg-zinc-900/80 text-zinc-400 border-zinc-700/50',
        dotClass: 'bg-zinc-500',
        isTerminal: true,
        isActive: false,
      };

    case 'FAILED':
    default:
      return {
        status: canonical,
        label: 'Dispatch Failed',
        sublabel: 'Validation / Address Error',
        badgeClass: 'bg-red-950/80 text-red-300 border-red-500/50',
        dotClass: 'bg-red-500',
        isTerminal: true,
        isActive: false,
      };
  }
}

/**
 * Determine if a shipment is an active parcel currently in the courier pipeline.
 * Excludes cancelled, failed, archived, and returned parcels.
 */
export function isValidActiveShipment(status: string | null | undefined): boolean {
  const canonical = getCanonicalCourierStatus(status);
  return ['BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'ATTEMPTED'].includes(canonical);
}

/**
 * Determine if a shipment is eligible for COD remittance reconciliation.
 * Financial rule: Only successfully DELIVERED shipments generate pending remittance.
 */
export function isSettlementEligible(shipment: {
  status: string | null | undefined;
  trackingNumber?: string | null;
}): boolean {
  if (!shipment.trackingNumber) return false;
  const canonical = getCanonicalCourierStatus(shipment.status);
  return canonical === 'DELIVERED';
}

/**
 * Returns canonical settlement status badge info
 */
export function getSettlementStatusBadgeInfo(
  settlementStatus: string | null | undefined,
  shipmentStatus: string | null | undefined
) {
  const isDelivered = getCanonicalCourierStatus(shipmentStatus) === 'DELIVERED';
  const cleanSettlement = (settlementStatus || '').trim().toUpperCase();

  if (cleanSettlement === 'SETTLED' || cleanSettlement === 'PAID') {
    return {
      status: 'SETTLED',
      label: 'Settled',
      badgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
    };
  }

  if (!isDelivered) {
    return {
      status: 'NOT_APPLICABLE',
      label: 'Not Delivered',
      badgeClass: 'bg-zinc-900/60 text-zinc-400 border-zinc-700/30',
    };
  }

  return {
    status: 'PENDING',
    label: 'Pending CPR',
    badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
  };
}
