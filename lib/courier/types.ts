// Courier Provider Interface - Future-ready for PostEx API integration
export interface ShipmentRequest {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: string;
  city: string;
  province: string;
  postalCode?: string;
  codAmount: number;
  weight?: number;
  description?: string;
}

export interface ShipmentResult {
  success: boolean;
  trackingNumber?: string;
  error?: string;
}

export interface TrackingStatus {
  status: string;
  timestamp: string;
  location?: string;
  description: string;
}

export interface TrackingResult {
  success: boolean;
  currentStatus?: string;
  history?: TrackingStatus[];
  error?: string;
}

export interface CourierProvider {
  name: string;
  createShipment(request: ShipmentRequest): Promise<ShipmentResult>;
  getTrackingStatus(trackingNumber: string): Promise<TrackingResult>;
  getTrackingHistory(trackingNumber: string): Promise<TrackingResult>;
  cancelShipment(trackingNumber: string): Promise<{ success: boolean; error?: string }>;
}

export const COURIER_OPTIONS = [
  { value: 'PostEx', label: 'PostEx' },
  { value: 'TCS', label: 'TCS' },
  { value: 'Leopards', label: 'Leopards Courier' },
  { value: 'M&P', label: 'M&P Express' },
  { value: 'Other', label: 'Other' },
] as const;

export type CourierName = typeof COURIER_OPTIONS[number]['value'];
