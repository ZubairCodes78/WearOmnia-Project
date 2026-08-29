export interface CourierItem {
  productTitle: string;
  variantInfo?: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface ShipmentRequest {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  shippingAddress: string;
  shippingCity: string;
  shippingProvince: string;
  postalCode?: string | null;
  codAmount: number;
  orderNotes?: string | null;
  items: CourierItem[];
  pickupAddressCode?: string;
  storeAddressCode?: string;
}

export interface ShipmentResult {
  success: boolean;
  provider: string;
  trackingNumber?: string;
  orderRefNumber?: string;
  externalShipmentId?: string;
  status: string;
  labelUrl?: string;
  trackingUrl?: string;
  message: string;
  metadata?: Record<string, any>;
  raw?: any;
}

export interface TrackingHistoryItem {
  messageCode?: string;
  status: string;
  location?: string;
  timestamp?: string;
  remarks?: string;
}

export interface TrackingResult {
  success: boolean;
  provider: string;
  trackingNumber: string;
  orderRefNumber?: string;
  status: string;
  rawStatus?: string;
  statusDetails?: string;
  courierName: string;
  estimatedDelivery?: string;
  pickupDate?: string;
  deliveryDate?: string;
  returnDate?: string;
  returnReason?: string;
  transactionFee?: number;
  taxAmount?: number;
  fuelSurcharge?: number;
  history?: TrackingHistoryItem[];
  message: string;
}

export interface SettlementResult {
  success: boolean;
  trackingNumber: string;
  orderRefNumber?: string;
  settle?: string | boolean;
  settlementStatus: string;
  settlementDate?: string;
  upfrontPaymentDate?: string;
  cprNumber_1?: string;
  cprNumber_2?: string;
  cprNumber?: string;
  reservePaymentDate?: string;
  codAmount?: number;
  netAmount?: number;
  transactionFee?: number;
  taxAmount?: number;
  fuelSurcharge?: number;
  message: string;
  raw?: any;
}

export interface PrintLabelResult {
  success: boolean;
  labelUrl?: string;
  labelFormat?: 'PDF' | 'IMAGE' | 'HTML';
  htmlContent?: string;
  pdfBuffer?: ArrayBuffer;
  message: string;
}

export interface CancelShipmentResult {
  success: boolean;
  message: string;
}

export interface CourierProvider {
  name: string;
  isConfigured(): boolean;
  createShipment(request: ShipmentRequest): Promise<ShipmentResult>;
  getShipment(trackingNumberOrId: string): Promise<ShipmentResult>;
  getTracking(trackingNumber: string): Promise<TrackingResult>;
  cancelShipment(trackingNumberOrId: string): Promise<CancelShipmentResult>;
  printLabel(trackingNumberOrId: string): Promise<PrintLabelResult>;
  getShipmentStatus(trackingNumberOrId: string): Promise<string>;
}

export const COURIER_OPTIONS = [
  { value: 'POSTEX', label: 'PostEx Express Courier' },
  { value: 'TCS', label: 'TCS Express' },
  { value: 'LEOPARDS', label: 'Leopards Courier' },
  { value: 'M&P', label: 'M&P Courier' },
  { value: 'OTHER', label: 'Other Manual Courier' },
];

/**
 * Official PostEx Shipment Statuses from M-v4.1.9 Specification
 */
export const POSTEX_STATUS_MAP: Record<string, { label: string; orderStatus: string; color: string; canonical: string }> = {
  'Unbooked': { label: 'Unbooked', orderStatus: 'CONFIRMED', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', canonical: 'BOOKED' },
  'Booked': { label: 'Booked', orderStatus: 'PACKING', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', canonical: 'BOOKED' },
  'PostEx WareHouse': { label: 'In PostEx Warehouse', orderStatus: 'DISPATCHED', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', canonical: 'IN_TRANSIT' },
  'Picked By PostEx': { label: 'Picked by PostEx', orderStatus: 'DISPATCHED', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', canonical: 'PICKED_UP' },
  'En-Route to PostEx warehouse': { label: 'En-Route to Warehouse', orderStatus: 'DISPATCHED', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', canonical: 'IN_TRANSIT' },
  'Out For Delivery': { label: 'Out For Delivery', orderStatus: 'OUT_FOR_DELIVERY', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', canonical: 'OUT_FOR_DELIVERY' },
  'Delivered': { label: 'Delivered', orderStatus: 'DELIVERED', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', canonical: 'DELIVERED' },
  'Returned': { label: 'Returned to Origin', orderStatus: 'RETURNED', color: 'bg-red-500/20 text-red-300 border-red-500/30', canonical: 'RETURNED' },
  'Out For Return': { label: 'Out For Return', orderStatus: 'RETURNED', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', canonical: 'RETURNED' },
  'Attempted': { label: 'Delivery Attempted', orderStatus: 'OUT_FOR_DELIVERY', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', canonical: 'ATTEMPTED' },
  'Delivery Under Review': { label: 'Delivery Under Review', orderStatus: 'OUT_FOR_DELIVERY', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', canonical: 'ATTEMPTED' },
  'Un-Assigned By Me': { label: 'Cancelled on Courier', orderStatus: 'CONFIRMED', color: 'bg-red-500/20 text-red-300 border-red-500/30', canonical: 'CANCELLED' },
  'Expired': { label: 'Expired', orderStatus: 'CANCELLED', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', canonical: 'CANCELLED' },
  'Cancelled': { label: 'Cancelled', orderStatus: 'CANCELLED', color: 'bg-red-500/20 text-red-300 border-red-500/30', canonical: 'CANCELLED' },
  'CREATED': { label: 'Shipment Created', orderStatus: 'PACKING', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', canonical: 'BOOKED' },
  'PENDING': { label: 'Pending Dispatch', orderStatus: 'CONFIRMED', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', canonical: 'BOOKED' },
  'ARCHIVED': { label: 'Archived', orderStatus: 'CONFIRMED', color: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30', canonical: 'ARCHIVED' },
  'FAILED': { label: 'Dispatch Failed', orderStatus: 'CONFIRMED', color: 'bg-red-500/20 text-red-300 border-red-500/30', canonical: 'FAILED' },
};

/**
 * Official PostEx Message Codes from M-v4.1.9 Tracking Status History
 */
export const POSTEX_MESSAGE_CODES: Record<string, string> = {
  '0001': "At Merchant's Warehouse",
  '0002': 'Returned',
  '0003': 'At PostEx Warehouse',
  '0004': 'Package on Route',
  '0005': 'Delivered',
  '0006': 'Returned',
  '0007': 'Returned',
  '0008': 'Delivery Under Review',
  '0013': 'Attempt Made',
};
