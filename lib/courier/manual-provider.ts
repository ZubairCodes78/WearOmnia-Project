import { CourierProvider, ShipmentRequest, ShipmentResult, TrackingResult } from './types';

/**
 * ManualCourierProvider - Admin manually manages tracking via the dashboard.
 * This is the default provider until PostEx API is connected.
 * 
 * Future: Replace with PostExCourierProvider that calls the PostEx REST API.
 */
export class ManualCourierProvider implements CourierProvider {
  name = 'Manual';

  async createShipment(request: ShipmentRequest): Promise<ShipmentResult> {
    // Manual provider: Admin enters tracking number manually in the dashboard
    return {
      success: true,
      trackingNumber: undefined, // Will be added manually by admin
    };
  }

  async getTrackingStatus(trackingNumber: string): Promise<TrackingResult> {
    // Manual provider: Status is controlled via the admin dashboard
    // In the future, this would call PostEx API: GET /api/v1/tracking/{trackingNumber}
    return {
      success: true,
      currentStatus: 'MANUAL_TRACKING',
      history: [],
    };
  }

  async getTrackingHistory(trackingNumber: string): Promise<TrackingResult> {
    // Manual provider: Timeline is built from OrderTimeline records in the database
    return {
      success: true,
      currentStatus: 'MANUAL_TRACKING',
      history: [],
    };
  }

  async cancelShipment(trackingNumber: string): Promise<{ success: boolean; error?: string }> {
    // Manual provider: Admin cancels via dashboard
    return { success: true };
  }
}
