import {
  CourierProvider,
  ShipmentRequest,
  ShipmentResult,
  TrackingResult,
  PrintLabelResult,
  CancelShipmentResult,
  SettlementResult,
  POSTEX_STATUS_MAP,
} from './types';
import { postexApi } from './postex-api';

export class PostExProvider implements CourierProvider {
  name = 'POSTEX';

  isConfigured(): boolean {
    return postexApi.isConfigured();
  }

  async checkConfiguration(): Promise<boolean> {
    return postexApi.isConfiguredAsync();
  }

  /**
   * Creates an official shipment on PostEx via POST /services/integration/api/order/v3/create-order
   */
  async createShipment(request: ShipmentRequest): Promise<ShipmentResult> {
    const isConfig = await this.checkConfiguration();
    if (!isConfig) {
      return {
        success: false,
        provider: this.name,
        status: 'UNCONFIGURED',
        message: 'PostEx integration is not configured. Please set POSTEX_API_TOKEN in server environment variables or Admin Settings.',
      };
    }

    try {
      // Resolve address codes from request or server SiteSettings
      let pickupCode = request.pickupAddressCode?.trim();
      let storeCode = request.storeAddressCode?.trim();

      if (!pickupCode && !storeCode) {
        const { getSiteSettings } = await import('@/lib/settings');
        const settings = await getSiteSettings();
        pickupCode = settings.postex_pickup_address_code?.trim() || undefined;
        storeCode = settings.postex_store_address_code?.trim() || undefined;
      }

      if (!pickupCode && !storeCode) {
        return {
          success: false,
          provider: this.name,
          status: 'UNCONFIGURED_ADDRESS',
          message: 'PostEx pickup address is not configured. Please configure it in Admin Settings → PostEx.',
        };
      }

      const itemsCount = request.items.reduce((sum, i) => sum + (i.quantity || 1), 0);
      const itemsDetail = request.items
        .map((i) => `${i.quantity}x ${i.productTitle}${i.variantInfo ? ` (${i.variantInfo})` : ''}`)
        .join(', ') || 'WearOMNIA Apparel';

      const result = await postexApi.createOrder({
        cityName: request.shippingCity,
        customerName: request.customerName,
        customerPhone: request.customerPhone,
        deliveryAddress: request.shippingAddress,
        invoiceDivision: 1,
        invoicePayment: request.codAmount,
        items: itemsCount,
        orderDetail: itemsDetail,
        orderRefNumber: request.orderNumber,
        orderType: 'Normal',
        pickupAddressCode: pickupCode,
        storeAddressCode: storeCode,
        transactionNotes: request.orderNotes || `WearOMNIA Order #${request.orderNumber}`,
      });

      if (!result.success || !result.trackingNumber) {
        return {
          success: false,
          provider: this.name,
          status: 'FAILED',
          message: result.message || 'Failed to create shipment on PostEx.',
          raw: result.raw,
        };
      }

      return {
        success: true,
        provider: this.name,
        trackingNumber: result.trackingNumber,
        orderRefNumber: request.orderNumber,
        status: 'Booked',
        labelUrl: `/api/admin/courier/postex/label?trackingNumber=${encodeURIComponent(result.trackingNumber)}`,
        trackingUrl: `https://postex.pk/tracking?trackingNumber=${encodeURIComponent(result.trackingNumber)}`,
        message: 'PostEx shipment created successfully.',
        metadata: {
          postexStatus: 'Booked',
          orderRefNumber: request.orderNumber,
          createdAt: new Date().toISOString(),
        },
        raw: result.raw,
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

  /**
   * Retrieves shipment details from PostEx
   */
  async getShipment(trackingNumberOrId: string): Promise<ShipmentResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        provider: this.name,
        status: 'UNCONFIGURED',
        message: 'PostEx integration is not configured yet.',
      };
    }

    const tracking = await postexApi.trackOrder(trackingNumberOrId);
    if (!tracking.success || !tracking.tracking) {
      return {
        success: false,
        provider: this.name,
        status: 'FAILED',
        message: tracking.message || 'Could not retrieve shipment details.',
        raw: tracking.raw,
      };
    }

    const detail = tracking.tracking;
    return {
      success: true,
      provider: this.name,
      trackingNumber: detail.trackingNumber || trackingNumberOrId,
      orderRefNumber: detail.orderRefNumber,
      status: detail.orderStatus || 'Booked',
      labelUrl: `/api/admin/courier/postex/label?trackingNumber=${encodeURIComponent(detail.trackingNumber || trackingNumberOrId)}`,
      trackingUrl: `https://postex.pk/tracking?trackingNumber=${encodeURIComponent(detail.trackingNumber || trackingNumberOrId)}`,
      message: 'Shipment info retrieved successfully.',
      raw: tracking.raw,
    };
  }

  /**
   * Retrieves full tracking history and mapped status
   */
  async getTracking(trackingNumber: string): Promise<TrackingResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        provider: this.name,
        trackingNumber,
        status: 'UNCONFIGURED',
        courierName: 'PostEx',
        message: 'PostEx tracking is not configured. POSTEX_API_TOKEN is missing.',
      };
    }

    try {
      const result = await postexApi.trackOrder(trackingNumber);
      if (!result.success || !result.tracking) {
        return {
          success: false,
          provider: this.name,
          trackingNumber,
          status: 'PENDING',
          courierName: 'PostEx',
          message: result.message || 'Tracking information could not be found.',
        };
      }

      const t = result.tracking;
      const rawStatus = t.orderStatus || t.transactionStatus || 'Booked';
      const mapped = POSTEX_STATUS_MAP[rawStatus] || { orderStatus: 'DISPATCHED' };

      return {
        success: true,
        provider: this.name,
        trackingNumber: t.trackingNumber || trackingNumber,
        orderRefNumber: t.orderRefNumber,
        status: mapped.orderStatus,
        rawStatus: rawStatus,
        statusDetails: t.transactionStatus || rawStatus,
        courierName: 'PostEx',
        pickupDate: t.pickupDate,
        deliveryDate: t.deliveryDate,
        returnDate: t.returnDate,
        returnReason: t.returnReason,
        transactionFee: t.transactionFee,
        taxAmount: t.taxAmount,
        fuelSurcharge: t.fuelSurcharge,
        history: t.history
          ? t.history.map((h) => ({
              status: h.status,
              location: h.location,
              timestamp: h.timestamp || new Date().toISOString(),
              remarks: h.remarks,
            }))
          : [
              {
                status: rawStatus,
                timestamp: new Date().toISOString(),
                remarks: t.transactionStatus || `Status: ${rawStatus}`,
              },
            ],
        message: 'Tracking details retrieved successfully.',
      };
    } catch (e: any) {
      return {
        success: false,
        provider: this.name,
        trackingNumber,
        status: 'ERROR',
        courierName: 'PostEx',
        message: e?.message || 'Error tracking shipment.',
      };
    }
  }

  /**
   * Cancels shipment on PostEx via PUT /services/integration/api/order/v1/cancel-order
   */
  async cancelShipment(trackingNumberOrId: string): Promise<CancelShipmentResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'PostEx integration is not configured.',
      };
    }

    const res = await postexApi.cancelOrder({ trackingNumber: trackingNumberOrId });
    return {
      success: res.success,
      message: res.message || (res.success ? 'PostEx shipment cancelled successfully.' : 'Cancellation failed.'),
    };
  }

  /**
   * Retrieves official PostEx Airway Bill invoice PDF
   */
  async printLabel(trackingNumberOrId: string): Promise<PrintLabelResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'PostEx API is not configured.',
      };
    }

    const pdfRes = await postexApi.getInvoicePdf(trackingNumberOrId);
    if (!pdfRes.success || !pdfRes.buffer) {
      return {
        success: false,
        message: pdfRes.message || 'Failed to retrieve official PostEx airway bill label.',
      };
    }

    return {
      success: true,
      labelFormat: 'PDF',
      pdfBuffer: pdfRes.buffer,
      labelUrl: `/api/admin/courier/postex/label?trackingNumber=${encodeURIComponent(trackingNumberOrId)}`,
      message: 'Official PostEx PDF retrieved successfully.',
    };
  }

  /**
   * Retrieves payment / COD settlement status
   */
  async getPaymentStatus(trackingNumber: string): Promise<SettlementResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        trackingNumber,
        settlementStatus: 'UNCONFIGURED',
        message: 'PostEx is not configured.',
      };
    }

    const res = await postexApi.getPaymentStatus(trackingNumber);
    if (!res.success || !res.payment) {
      return {
        success: false,
        trackingNumber,
        settlementStatus: 'UNKNOWN',
        message: res.message || 'Settlement information not available.',
        raw: res.raw,
      };
    }

    const p = res.payment;
    return {
      success: true,
      trackingNumber: p.trackingNumber || trackingNumber,
      orderRefNumber: p.orderRefNumber,
      settlementStatus: p.settlementStatus || 'Pending',
      settlementDate: p.settlementDate,
      upfrontPaymentDate: p.upfrontPaymentDate,
      cprNumber: p.cprNumber,
      reservePaymentDate: p.reservePaymentDate,
      codAmount: p.invoicePayment,
      netAmount: p.netAmount,
      transactionFee: p.transactionFee,
      taxAmount: p.tax,
      fuelSurcharge: p.fuelSurcharge,
      message: 'Settlement details retrieved successfully.',
      raw: res.raw,
    };
  }

  async getShipmentStatus(trackingNumberOrId: string): Promise<string> {
    const tracking = await this.getTracking(trackingNumberOrId);
    return tracking.rawStatus || tracking.status || 'UNKNOWN';
  }
}

