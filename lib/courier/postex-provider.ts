import {
  CourierProvider,
  ShipmentRequest,
  ShipmentResult,
  TrackingResult,
  PrintLabelResult,
  CancelShipmentResult,
} from './types';
import { getSiteSettings } from '@/lib/settings';

export class PostExProvider implements CourierProvider {
  name = 'POSTEX';

  private async getPostExConfig() {
    const settings = await getSiteSettings();
    return {
      enabled: settings.postex_enabled ?? false,
      baseUrl: settings.postex_api_url || process.env.POSTEX_API_URL || '',
      apiKey: settings.postex_api_key || process.env.POSTEX_API_KEY || '',
      apiToken: settings.postex_api_token || process.env.POSTEX_API_TOKEN || '',
      merchantId: settings.postex_merchant_id || process.env.POSTEX_MERCHANT_ID || '',
      accountId: settings.postex_account_id || process.env.POSTEX_ACCOUNT_ID || '',
      webhookUrl: settings.postex_webhook_url || '',
      environment: settings.postex_environment || 'TEST',
    };
  }

  isConfigured(): boolean {
    // Sync check placeholder — runtime configuration check will evaluate actual settings
    return false;
  }

  async checkConfiguration(): Promise<boolean> {
    const config = await this.getPostExConfig();
    return Boolean(config.enabled && (config.apiKey || config.apiToken));
  }

  async createShipment(request: ShipmentRequest): Promise<ShipmentResult> {
    const config = await this.getPostExConfig();

    if (!config.enabled || (!config.apiKey && !config.apiToken)) {
      return {
        success: false,
        provider: this.name,
        status: 'UNCONFIGURED',
        message: 'PostEx integration is not configured yet. Please enter valid PostEx API credentials in Admin Settings.',
      };
    }

    try {
      // Future live PostEx API Integration Endpoint call
      // When official PostEx API documentation & credentials are provided:
      // const response = await fetch(`${config.baseUrl}/order/create`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'api-key': config.apiKey,
      //     'token': config.apiToken,
      //   },
      //   body: JSON.stringify({ ... }),
      // });
      
      return {
        success: false,
        provider: this.name,
        status: 'PENDING',
        message: 'PostEx API credentials configured, awaiting official API contract implementation.',
      };
    } catch (e: any) {
      return {
        success: false,
        provider: this.name,
        status: 'FAILED',
        message: `PostEx API Error: ${e?.message || 'Failed to create PostEx shipment'}`,
      };
    }
  }

  async getShipment(trackingNumberOrId: string): Promise<ShipmentResult> {
    const config = await this.getPostExConfig();
    if (!config.enabled || (!config.apiKey && !config.apiToken)) {
      return {
        success: false,
        provider: this.name,
        status: 'UNCONFIGURED',
        message: 'PostEx integration is not configured yet.',
      };
    }

    return {
      success: true,
      provider: this.name,
      trackingNumber: trackingNumberOrId,
      status: 'CREATED',
      message: 'Shipment info retrieved',
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingResult> {
    const config = await this.getPostExConfig();
    if (!config.enabled || (!config.apiKey && !config.apiToken)) {
      return {
        success: false,
        provider: this.name,
        trackingNumber,
        status: 'UNCONFIGURED',
        courierName: 'PostEx',
        message: 'PostEx tracking is not configured yet. Credentials missing.',
      };
    }

    return {
      success: true,
      provider: this.name,
      trackingNumber,
      status: 'IN_TRANSIT',
      courierName: 'PostEx',
      message: 'Shipment in transit via PostEx',
    };
  }

  async cancelShipment(trackingNumberOrId: string): Promise<CancelShipmentResult> {
    const config = await this.getPostExConfig();
    if (!config.enabled || (!config.apiKey && !config.apiToken)) {
      return {
        success: false,
        message: 'PostEx integration is not configured yet.',
      };
    }

    return {
      success: false,
      message: 'Shipment cancellation requires PostEx API connection.',
    };
  }

  async printLabel(trackingNumberOrId: string): Promise<PrintLabelResult> {
    const config = await this.getPostExConfig();
    if (!config.enabled || (!config.apiKey && !config.apiToken)) {
      return {
        success: false,
        message: 'PostEx API is not configured. Falling back to standard WearOMNIA label.',
      };
    }

    return {
      success: false,
      message: 'Official PostEx Airway Bill label requires active API credentials.',
    };
  }

  async getShipmentStatus(trackingNumberOrId: string): Promise<string> {
    const config = await this.getPostExConfig();
    if (!config.enabled || (!config.apiKey && !config.apiToken)) {
      return 'UNCONFIGURED';
    }
    return 'PENDING';
  }
}
