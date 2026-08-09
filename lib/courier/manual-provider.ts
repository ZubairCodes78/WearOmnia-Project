import {
  CourierProvider,
  ShipmentRequest,
  ShipmentResult,
  TrackingResult,
  PrintLabelResult,
  CancelShipmentResult,
} from './types';

export class ManualProvider implements CourierProvider {
  name = 'MANUAL';

  isConfigured(): boolean {
    return true;
  }

  async createShipment(request: ShipmentRequest): Promise<ShipmentResult> {
    const generatedTracking = `OMNIA-TRK-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      success: true,
      provider: this.name,
      trackingNumber: generatedTracking,
      externalShipmentId: `MANUAL-${request.orderNumber}`,
      status: 'CONFIRMED',
      message: 'Manual shipment record generated successfully.',
    };
  }

  async getShipment(trackingNumberOrId: string): Promise<ShipmentResult> {
    return {
      success: true,
      provider: this.name,
      trackingNumber: trackingNumberOrId,
      status: 'CONFIRMED',
      message: 'Manual shipment information retrieved.',
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingResult> {
    return {
      success: true,
      provider: this.name,
      trackingNumber,
      status: 'CONFIRMED',
      courierName: 'Manual Courier Dispatch',
      message: 'Package registered for manual dispatch.',
    };
  }

  async cancelShipment(trackingNumberOrId: string): Promise<CancelShipmentResult> {
    return {
      success: true,
      message: 'Manual shipment status updated to CANCELLED.',
    };
  }

  async printLabel(trackingNumberOrId: string): Promise<PrintLabelResult> {
    return {
      success: true,
      labelFormat: 'HTML',
      message: 'Using standard WearOMNIA printable label.',
    };
  }

  async getShipmentStatus(trackingNumberOrId: string): Promise<string> {
    return 'CONFIRMED';
  }
}
