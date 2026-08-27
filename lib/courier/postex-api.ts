/**
 * Official PostEx Courier Merchant API Client
 *
 * Base URL: https://api.postex.pk
 * Authentication: token header with POSTEX_API_TOKEN
 *
 * Security:
 * - Reads token ONLY from process.env.POSTEX_API_TOKEN
 * - Never exposes or logs the token
 */

export interface PostExOperationalCity {
  cityId?: number | string;
  cityName: string;
  isOperational?: boolean;
  transitDays?: number;
}

export interface PostExMerchantAddress {
  addressCode?: string;
  pickupAddressCode?: string;
  cityName: string;
  address: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  isDefault?: boolean;
}

export interface PostExOrderType {
  orderTypeId?: number | string;
  orderTypeName: string; // e.g., "Normal", "Reversed", "Replacement"
  description?: string;
}

export interface PostExCreateOrderRequest {
  cityName: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  invoiceDivision?: number; // 1 by default
  invoicePayment: number; // COD Amount
  items: number;
  orderDetail: string;
  orderRefNumber: string; // WearOMNIA orderNumber
  orderType?: string; // "Normal" by default
  pickupAddressCode?: string;
  storeAddressCode?: string;
  transactionNotes?: string;
}

export interface PostExCreateOrderResponse {
  statusCode: string | number;
  statusMessage: string;
  distCode?: string;
  response?: {
    trackingNumber?: string;
    orderRefNumber?: string;
    invoicePayment?: number;
    orderStatus?: string;
    transactionStatus?: string;
    cityName?: string;
    deliveryAddress?: string;
    [key: string]: any;
  };
  trackingNumber?: string;
  [key: string]: any;
}

export interface PostExTrackingDetail {
  orderStatusId?: number | string;
  orderStatus: string;
  transactionStatus?: string;
  trackingNumber: string;
  orderRefNumber?: string;
  invoicePayment?: number;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  cityName?: string;
  transactionFee?: number;
  taxAmount?: number;
  fuelSurcharge?: number;
  orderDate?: string;
  pickupDate?: string;
  deliveryDate?: string;
  returnDate?: string;
  returnReason?: string;
  history?: Array<{
    status: string;
    location?: string;
    timestamp?: string;
    remarks?: string;
  }>;
  [key: string]: any;
}

export interface PostExTrackingResponse {
  statusCode: string | number;
  statusMessage: string;
  distCode?: string;
  response?: PostExTrackingDetail;
  [key: string]: any;
}

export interface PostExPaymentStatusResponse {
  statusCode: string | number;
  statusMessage: string;
  distCode?: string;
  response?: {
    trackingNumber?: string;
    orderRefNumber?: string;
    invoicePayment?: number;
    settlementStatus?: string; // e.g. "Settled", "Pending", "Unpaid", "Paid"
    settlementDate?: string;
    upfrontPaymentDate?: string;
    cprNumber?: string;
    reservePaymentDate?: string;
    transactionFee?: number;
    tax?: number;
    fuelSurcharge?: number;
    netAmount?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface PostExShipperAdviceRequest {
  trackingNumber: string;
  advice: string; // e.g., "Re-attempt delivery", "Cancel and return to origin", "Change address"
  newAddress?: string;
  newPhone?: string;
  newCodAmount?: number;
  comments?: string;
}

export class PostExApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = (process.env.POSTEX_API_URL || 'https://api.postex.pk').replace(/\/+$/, '');
  }

  /**
   * Retrieves the server-side PostEx API token.
   * STRICT SECURITY: Never logs or exposes this token.
   */
  private getToken(): string {
    return (process.env.POSTEX_API_TOKEN || '').trim();
  }

  public isConfigured(): boolean {
    return Boolean(this.getToken());
  }

  /**
   * Generic authenticated HTTP fetcher
   */
  private async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
      headers?: Record<string, string>;
      isBinary?: boolean;
    } = {}
  ): Promise<{ ok: boolean; status: number; data?: T; buffer?: ArrayBuffer; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return {
        ok: false,
        status: 401,
        error: 'PostEx API token is not configured. Please set the POSTEX_API_TOKEN server environment variable.',
      };
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    const headers: Record<string, string> = {
      token: token,
      ...options.headers,
    };

    if (options.body && !(options.body instanceof FormData) && !options.headers?.['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeoutId);

      if (options.isBinary) {
        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          return {
            ok: false,
            status: response.status,
            error: errorText || `PostEx HTTP error ${response.status}`,
          };
        }
        const buffer = await response.arrayBuffer();
        return { ok: true, status: response.status, buffer };
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await response.json().catch(() => ({}));
        return {
          ok: response.ok,
          status: response.status,
          data: json as T,
          error: !response.ok ? (json.statusMessage || json.message || json.error || `HTTP ${response.status}`) : undefined,
        };
      } else {
        const text = await response.text().catch(() => '');
        return {
          ok: response.ok,
          status: response.status,
          data: { raw: text } as unknown as T,
          error: !response.ok ? (text || `HTTP ${response.status}`) : undefined,
        };
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        return { ok: false, status: 408, error: 'PostEx API request timed out after 25 seconds.' };
      }
      return { ok: false, status: 500, error: e?.message || 'Network error communicating with PostEx API.' };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Operational Cities
  // GET /services/integration/api/order/v2/get-operational-city
  // ─────────────────────────────────────────────────────────────────────────────
  async getOperationalCities(): Promise<{ success: boolean; cities: PostExOperationalCity[]; message?: string }> {
    const res = await this.request<{ statusCode: string; statusMessage: string; response?: any[] }>(
      '/services/integration/api/order/v2/get-operational-city',
      { method: 'GET' }
    );

    if (!res.ok || !res.data) {
      return { success: false, cities: [], message: res.error || 'Failed to fetch operational cities' };
    }

    const list = Array.isArray(res.data.response) ? res.data.response : Array.isArray(res.data) ? (res.data as any) : [];
    const formattedCities: PostExOperationalCity[] = list.map((item: any) => ({
      cityId: item.cityId || item.id || item.cityName,
      cityName: typeof item === 'string' ? item : item.cityName || item.name || '',
      isOperational: item.isOperational ?? true,
      transitDays: item.transitDays ?? item.deliveryDays,
    }));

    return { success: true, cities: formattedCities, message: res.data.statusMessage || 'Cities retrieved' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Pickup Address
  // GET /services/integration/api/order/v1/get-merchant-address
  // ─────────────────────────────────────────────────────────────────────────────
  async getMerchantAddresses(): Promise<{ success: boolean; addresses: PostExMerchantAddress[]; message?: string }> {
    const res = await this.request<{ statusCode: string; statusMessage: string; response?: any[] }>(
      '/services/integration/api/order/v1/get-merchant-address',
      { method: 'GET' }
    );

    if (!res.ok || !res.data) {
      return { success: false, addresses: [], message: res.error || 'Failed to fetch merchant addresses' };
    }

    const list = Array.isArray(res.data.response) ? res.data.response : [];
    const formatted: PostExMerchantAddress[] = list.map((item: any) => ({
      addressCode: item.addressCode || item.pickupAddressCode || item.id,
      pickupAddressCode: item.pickupAddressCode || item.addressCode || item.id,
      cityName: item.cityName || '',
      address: item.address || item.pickupAddress || '',
      contactPersonName: item.contactPersonName || item.merchantName,
      contactPersonPhone: item.contactPersonPhone || item.merchantPhone,
      isDefault: Boolean(item.isDefault || item.default),
    }));

    return { success: true, addresses: formatted, message: res.data.statusMessage || 'Addresses retrieved' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Create Pickup Address
  // POST /services/integration/api/order/v2/create-merchant-address
  // ─────────────────────────────────────────────────────────────────────────────
  async createMerchantAddress(addressData: {
    cityName: string;
    address: string;
    contactPersonName?: string;
    contactPersonPhone?: string;
    addressCode?: string;
  }): Promise<{ success: boolean; data?: any; message?: string }> {
    const res = await this.request<any>('/services/integration/api/order/v2/create-merchant-address', {
      method: 'POST',
      body: addressData,
    });

    if (!res.ok) {
      return { success: false, message: res.error || 'Failed to create merchant address' };
    }

    return {
      success: true,
      data: res.data?.response || res.data,
      message: res.data?.statusMessage || 'Merchant address created successfully',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Order Types
  // GET /services/integration/api/order/v1/get-order-types
  // ─────────────────────────────────────────────────────────────────────────────
  async getOrderTypes(): Promise<{ success: boolean; orderTypes: PostExOrderType[]; message?: string }> {
    const res = await this.request<{ statusCode: string; statusMessage: string; response?: any[] }>(
      '/services/integration/api/order/v1/get-order-types',
      { method: 'GET' }
    );

    if (!res.ok || !res.data) {
      return { success: false, orderTypes: [], message: res.error || 'Failed to fetch order types' };
    }

    const list = Array.isArray(res.data.response) ? res.data.response : [];
    const formatted: PostExOrderType[] = list.map((item: any) => ({
      orderTypeId: item.orderTypeId || item.id,
      orderTypeName: typeof item === 'string' ? item : item.orderTypeName || item.name || 'Normal',
      description: item.description,
    }));

    return { success: true, orderTypes: formatted, message: res.data.statusMessage || 'Order types retrieved' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. CREATE ORDER
  // POST /services/integration/api/order/v3/create-order
  // ─────────────────────────────────────────────────────────────────────────────
  async createOrder(payload: PostExCreateOrderRequest): Promise<{
    success: boolean;
    trackingNumber?: string;
    orderRefNumber?: string;
    raw?: any;
    message?: string;
  }> {
    const cleanPayload = {
      cityName: payload.cityName.trim(),
      customerName: payload.customerName.trim(),
      customerPhone: payload.customerPhone.trim(),
      deliveryAddress: payload.deliveryAddress.trim(),
      invoiceDivision: payload.invoiceDivision ?? 1,
      invoicePayment: Math.round(payload.invoicePayment),
      items: payload.items || 1,
      orderDetail: payload.orderDetail || 'Apparel Order',
      orderRefNumber: payload.orderRefNumber,
      orderType: payload.orderType || 'Normal',
      pickupAddressCode: payload.pickupAddressCode || undefined,
      storeAddressCode: payload.storeAddressCode || undefined,
      transactionNotes: payload.transactionNotes || `WearOMNIA Order ${payload.orderRefNumber}`,
    };

    const res = await this.request<PostExCreateOrderResponse>('/services/integration/api/order/v3/create-order', {
      method: 'POST',
      body: cleanPayload,
    });

    if (!res.ok || !res.data) {
      return {
        success: false,
        message: res.error || 'Failed to create order on PostEx',
        raw: res.data,
      };
    }

    // PostEx v3 returns tracking number either in response object or top level
    const data = res.data;
    const trackingNumber =
      data.response?.trackingNumber ||
      data.trackingNumber ||
      data.response?.orderTrackingNumber ||
      (typeof data.distCode === 'string' && data.distCode.length > 5 ? data.distCode : undefined);

    const isSuccess = Boolean(
      trackingNumber ||
        String(data.statusCode) === '200' ||
        String(data.statusCode) === '201' ||
        data.statusMessage?.toLowerCase().includes('success')
    );

    if (!isSuccess || !trackingNumber) {
      return {
        success: false,
        message: data.statusMessage || res.error || 'PostEx API did not return a valid tracking number.',
        raw: data,
      };
    }

    return {
      success: true,
      trackingNumber: String(trackingNumber),
      orderRefNumber: payload.orderRefNumber,
      raw: data,
      message: data.statusMessage || 'PostEx shipment created successfully.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Unbooked Orders
  // GET /services/integration/api/order/v2/get-unbooked-orders
  // ─────────────────────────────────────────────────────────────────────────────
  async getUnbookedOrders(): Promise<{ success: boolean; orders: any[]; message?: string }> {
    const res = await this.request<any>('/services/integration/api/order/v2/get-unbooked-orders', {
      method: 'GET',
    });

    if (!res.ok || !res.data) {
      return { success: false, orders: [], message: res.error || 'Failed to fetch unbooked orders' };
    }

    const list = Array.isArray(res.data.response) ? res.data.response : [];
    return { success: true, orders: list, message: res.data.statusMessage || 'Unbooked orders retrieved' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Generate Load Sheet
  // POST /services/integration/api/order/v2/generate-load-sheet
  // ─────────────────────────────────────────────────────────────────────────────
  async generateLoadSheet(orderRefNumbersOrTracking: string[]): Promise<{
    success: boolean;
    loadSheetId?: string;
    loadSheetUrl?: string;
    raw?: any;
    message?: string;
  }> {
    const res = await this.request<any>('/services/integration/api/order/v2/generate-load-sheet', {
      method: 'POST',
      body: {
        orderRefNumbers: orderRefNumbersOrTracking,
        trackingNumbers: orderRefNumbersOrTracking,
      },
    });

    if (!res.ok || !res.data) {
      return { success: false, message: res.error || 'Failed to generate load sheet' };
    }

    return {
      success: true,
      loadSheetId: res.data.response?.loadSheetId || res.data.loadSheetId,
      loadSheetUrl: res.data.response?.loadSheetUrl || res.data.loadSheetUrl,
      raw: res.data,
      message: res.data.statusMessage || 'Load sheet generated successfully',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. TRACK ORDER
  // GET /services/integration/api/order/v1/track-order/{trackingNumber}
  // ─────────────────────────────────────────────────────────────────────────────
  async trackOrder(trackingNumber: string): Promise<{
    success: boolean;
    tracking?: PostExTrackingDetail;
    raw?: any;
    message?: string;
  }> {
    const cleanTracking = encodeURIComponent(trackingNumber.trim());
    const res = await this.request<PostExTrackingResponse>(
      `/services/integration/api/order/v1/track-order/${cleanTracking}`,
      { method: 'GET' }
    );

    if (!res.ok || !res.data) {
      return {
        success: false,
        message: res.error || `Could not track order #${trackingNumber}`,
        raw: res.data,
      };
    }

    const detail: PostExTrackingDetail = res.data.response || (res.data as any);
    return {
      success: true,
      tracking: detail,
      raw: res.data,
      message: res.data.statusMessage || 'Tracking information retrieved',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. Bulk Tracking
  // GET /services/integration/api/order/v1/track-bulk-order
  // ─────────────────────────────────────────────────────────────────────────────
  async trackBulkOrders(trackingNumbers: string[]): Promise<{
    success: boolean;
    results: PostExTrackingDetail[];
    message?: string;
  }> {
    const param = encodeURIComponent(trackingNumbers.join(','));
    const res = await this.request<any>(
      `/services/integration/api/order/v1/track-bulk-order?trackingNumbers=${param}`,
      { method: 'GET' }
    );

    if (!res.ok || !res.data) {
      return { success: false, results: [], message: res.error || 'Failed to fetch bulk tracking' };
    }

    const list = Array.isArray(res.data.response) ? res.data.response : [];
    return { success: true, results: list, message: res.data.statusMessage || 'Bulk tracking retrieved' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. OFFICIAL AIRWAY BILL / INVOICE / LABEL
  // GET /services/integration/api/order/v1/getinvoice?trackingNumbers=...
  // ─────────────────────────────────────────────────────────────────────────────
  async getInvoicePdf(trackingNumbers: string | string[]): Promise<{
    success: boolean;
    buffer?: ArrayBuffer;
    contentType?: string;
    message?: string;
  }> {
    const trackingList = Array.isArray(trackingNumbers) ? trackingNumbers.join(',') : trackingNumbers;
    const cleanParam = encodeURIComponent(trackingList.trim());

    const res = await this.request(
      `/services/integration/api/order/v1/getinvoice?trackingNumbers=${cleanParam}`,
      {
        method: 'GET',
        isBinary: true,
        headers: {
          Accept: 'application/pdf, application/json, */*',
        },
      }
    );

    if (!res.ok || !res.buffer) {
      return {
        success: false,
        message: res.error || `Failed to retrieve official PostEx invoice/label PDF for ${trackingList}`,
      };
    }

    return {
      success: true,
      buffer: res.buffer,
      contentType: 'application/pdf',
      message: 'Official PostEx PDF retrieved successfully',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. Shipper Advice (Save)
  // PUT /service/integration/api/order/v2/save-shipper-advice
  // ─────────────────────────────────────────────────────────────────────────────
  async saveShipperAdvice(advice: PostExShipperAdviceRequest): Promise<{
    success: boolean;
    raw?: any;
    message?: string;
  }> {
    const res = await this.request<any>('/service/integration/api/order/v2/save-shipper-advice', {
      method: 'PUT',
      body: {
        trackingNumber: advice.trackingNumber,
        shipperAdvice: advice.advice,
        remarks: advice.comments,
        newAddress: advice.newAddress,
        newPhone: advice.newPhone,
        invoicePayment: advice.newCodAmount,
      },
    });

    if (!res.ok) {
      return { success: false, message: res.error || 'Failed to save shipper advice' };
    }

    return {
      success: true,
      raw: res.data,
      message: res.data?.statusMessage || 'Shipper advice saved successfully',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. Get Shipper Advice
  // GET /service/integration/api/order/v1/get-shipper-advice/{trackingNumber}
  // ─────────────────────────────────────────────────────────────────────────────
  async getShipperAdvice(trackingNumber: string): Promise<{
    success: boolean;
    advice?: any;
    message?: string;
  }> {
    const cleanTracking = encodeURIComponent(trackingNumber.trim());
    const res = await this.request<any>(
      `/service/integration/api/order/v1/get-shipper-advice/${cleanTracking}`,
      { method: 'GET' }
    );

    if (!res.ok || !res.data) {
      return { success: false, message: res.error || 'Failed to get shipper advice' };
    }

    return {
      success: true,
      advice: res.data.response || res.data,
      message: res.data.statusMessage || 'Shipper advice retrieved',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 13. CANCEL ORDER
  // PUT /services/integration/api/order/v1/cancel-order
  // ─────────────────────────────────────────────────────────────────────────────
  async cancelOrder(trackingNumberOrOrderRef: {
    trackingNumber?: string;
    orderRefNumber?: string;
  }): Promise<{ success: boolean; raw?: any; message?: string }> {
    const res = await this.request<any>('/services/integration/api/order/v1/cancel-order', {
      method: 'PUT',
      body: {
        trackingNumber: trackingNumberOrOrderRef.trackingNumber,
        orderRefNumber: trackingNumberOrOrderRef.orderRefNumber,
      },
    });

    if (!res.ok) {
      return { success: false, message: res.error || 'Failed to cancel PostEx shipment' };
    }

    return {
      success: true,
      raw: res.data,
      message: res.data?.statusMessage || 'PostEx shipment cancelled successfully',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 14. PAYMENT STATUS
  // GET /services/integration/api/order/v1/payment-status/{trackingNumber}
  // ─────────────────────────────────────────────────────────────────────────────
  async getPaymentStatus(trackingNumber: string): Promise<{
    success: boolean;
    payment?: PostExPaymentStatusResponse['response'];
    raw?: any;
    message?: string;
  }> {
    const cleanTracking = encodeURIComponent(trackingNumber.trim());
    const res = await this.request<PostExPaymentStatusResponse>(
      `/services/integration/api/order/v1/payment-status/${cleanTracking}`,
      { method: 'GET' }
    );

    if (!res.ok || !res.data) {
      return { success: false, message: res.error || 'Failed to fetch payment settlement status' };
    }

    return {
      success: true,
      payment: res.data.response,
      raw: res.data,
      message: res.data.statusMessage || 'Payment status retrieved',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 15. ORDER STATUS LIST
  // GET /services/integration/api/order/v1/get-order-status
  // ─────────────────────────────────────────────────────────────────────────────
  async getOrderStatusList(): Promise<{ success: boolean; statuses: any[]; message?: string }> {
    const res = await this.request<any>('/services/integration/api/order/v1/get-order-status', {
      method: 'GET',
    });

    if (!res.ok || !res.data) {
      return { success: false, statuses: [], message: res.error || 'Failed to fetch order statuses' };
    }

    const list = Array.isArray(res.data.response) ? res.data.response : [];
    return { success: true, statuses: list, message: res.data.statusMessage || 'Order statuses retrieved' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 16. LIST ORDERS
  // GET /services/integration/api/order/v1/get-all-order
  // ─────────────────────────────────────────────────────────────────────────────
  async getAllOrders(queryParams?: {
    startDate?: string;
    endDate?: string;
    orderStatus?: string;
    cityName?: string;
  }): Promise<{ success: boolean; orders: any[]; message?: string }> {
    const params = new URLSearchParams();
    if (queryParams?.startDate) params.set('startDate', queryParams.startDate);
    if (queryParams?.endDate) params.set('endDate', queryParams.endDate);
    if (queryParams?.orderStatus) params.set('orderStatus', queryParams.orderStatus);
    if (queryParams?.cityName) params.set('cityName', queryParams.cityName);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await this.request<any>(`/services/integration/api/order/v1/get-all-order${queryStr}`, {
      method: 'GET',
    });

    if (!res.ok || !res.data) {
      return { success: false, orders: [], message: res.error || 'Failed to fetch all orders from PostEx' };
    }

    const list = Array.isArray(res.data.response) ? res.data.response : [];
    return { success: true, orders: list, message: res.data.statusMessage || 'PostEx orders retrieved' };
  }
}

export const postexApi = new PostExApiClient();
