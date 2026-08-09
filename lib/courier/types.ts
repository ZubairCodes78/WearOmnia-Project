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
}

export interface ShipmentResult {
  success: boolean;
  provider: string;
  trackingNumber?: string;
  externalShipmentId?: string;
  status: string;
  labelUrl?: string;
  trackingUrl?: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface TrackingResult {
  success: boolean;
  provider: string;
  trackingNumber: string;
  status: string;
  statusDetails?: string;
  courierName: string;
  estimatedDelivery?: string;
  history?: Array<{
    status: string;
    location?: string;
    timestamp: string;
    remarks?: string;
  }>;
  message: string;
}

export interface PrintLabelResult {
  success: boolean;
  labelUrl?: string;
  labelFormat?: 'PDF' | 'IMAGE' | 'HTML';
  htmlContent?: string;
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
