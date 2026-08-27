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
  history?: Array<{
    status: string;
    location?: string;
    timestamp?: string;
    remarks?: string;
  }>;
  message: string;
}

export interface SettlementResult {
  success: boolean;
  trackingNumber: string;
  orderRefNumber?: string;
  settlementStatus: string;
  settlementDate?: string;
  upfrontPaymentDate?: string;
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
  { value: 'POSTEX', label: 'PostEx Courier' },
  { value: 'TCS', label: 'TCS Express' },
  { value: 'LEOPARDS', label: 'Leopards Courier' },
  { value: 'M&P', label: 'M&P Courier' },
  { value: 'OTHER', label: 'Other Manual Courier' },
];

/**
 * Official PostEx Shipment Statuses
 */
export const POSTEX_STATUS_MAP: Record<string, { label: string; orderStatus: string; color: string }> = {
  'Unbooked': { label: 'Unbooked', orderStatus: 'CONFIRMED', color: 'bg-amber-500/20 text-amber-300' },
  'Booked': { label: 'Booked', orderStatus: 'PACKING', color: 'bg-blue-500/20 text-blue-300' },
  'PostEx WareHouse': { label: 'In PostEx Warehouse', orderStatus: 'DISPATCHED', color: 'bg-indigo-500/20 text-indigo-300' },
  'Picked By PostEx': { label: 'Picked by PostEx', orderStatus: 'DISPATCHED', color: 'bg-purple-500/20 text-purple-300' },
  'En-Route to PostEx warehouse': { label: 'En-Route to Warehouse', orderStatus: 'DISPATCHED', color: 'bg-indigo-500/20 text-indigo-300' },
  'Out For Delivery': { label: 'Out For Delivery', orderStatus: 'OUT_FOR_DELIVERY', color: 'bg-cyan-500/20 text-cyan-300' },
  'Delivered': { label: 'Delivered', orderStatus: 'DELIVERED', color: 'bg-emerald-500/20 text-emerald-300' },
  'Returned': { label: 'Returned', orderStatus: 'RETURNED', color: 'bg-red-500/20 text-red-300' },
  'Out For Return': { label: 'Out For Return', orderStatus: 'RETURNED', color: 'bg-orange-500/20 text-orange-300' },
  'Attempted': { label: 'Delivery Attempted', orderStatus: 'OUT_FOR_DELIVERY', color: 'bg-amber-500/20 text-amber-300' },
  'Delivery Under Review': { label: 'Delivery Under Review', orderStatus: 'OUT_FOR_DELIVERY', color: 'bg-yellow-500/20 text-yellow-300' },
  'Un-Assigned By Me': { label: 'Un-Assigned', orderStatus: 'CONFIRMED', color: 'bg-gray-500/20 text-gray-300' },
  'Expired': { label: 'Expired', orderStatus: 'CANCELLED', color: 'bg-red-500/20 text-red-300' },
  'Cancelled': { label: 'Cancelled', orderStatus: 'CANCELLED', color: 'bg-red-500/20 text-red-300' },
  'CREATED': { label: 'Shipment Created', orderStatus: 'PACKING', color: 'bg-blue-500/20 text-blue-300' },
  'PENDING': { label: 'Pending Dispatch', orderStatus: 'CONFIRMED', color: 'bg-amber-500/20 text-amber-300' },
};

