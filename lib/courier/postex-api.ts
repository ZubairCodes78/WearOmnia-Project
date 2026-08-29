/**
 * Official PostEx Courier Merchant API Client (M-v4.1.9 Specification)
 *
 * Primary Source of Truth: PostEx Merchant API Integration Guide M-v4.1.9
 *
 * Base URLs:
 * - Production: https://api.postex.pk
 * - Test / Staging: https://api.postex.pk
 *
 * Authentication:
 * - Header: `token: <merchant token>`
 * - Token is strictly kept server-side (server environment or DB SiteSettings).
 * - Never logged, never returned to client-side JS or public endpoints.
 *
 * All 16 Official Documented Endpoints:
 * 1. Operational Cities: GET /services/integration/api/order/v2/get-operational-city (query: operationalCityType)
 * 2. Pickup Address: GET /services/integration/api/order/v1/get-merchant-address (query: cityName)
 * 3. Create Pickup Address: POST /services/integration/api/order/v2/create-merchant-address
 * 4. Order Types: GET /services/integration/api/order/v1/get-order-types
 * 5. Order Creation: POST /services/integration/api/order/v3/create-order
 * 6. List Un-booked Orders: GET /services/integration/api/order/v2/get-unbooked-orders
 * 7. Generate Load Sheet: POST /services/integration/api/order/v2/generate-load-sheet
 * 8. Order Tracking: GET /services/integration/api/order/v1/track-order/{trackingNumber}
 * 9. Bulk Order Tracking: GET /services/integration/api/order/v1/track-bulk-order?trackingNumbers=...
 * 10. Airway Bill: GET /services/integration/api/order/v1/getinvoice?trackingNumbers=...
 * 11. Save Shipper Advice: PUT /service/integration/api/order/v2/save-shipper-advice (Note: /service/)
 * 12. Get Shipper Advice: GET /service/integration/api/order/v1/get-shipper-advice/{trackingNumber} (Note: /service/)
 * 13. Cancel Order: PUT /services/integration/api/order/v1/cancel-order
 * 14. Payment Status: GET /services/integration/api/order/v1/payment-status/{trackingNumber}
 * 15. Order Status: GET /services/integration/api/order/v1/get-order-status
 * 16. List Orders: GET /services/integration/api/order/v1/get-all-order (query: orderStatusID, fromDate, toDate)
 */

export interface PostExOperationalCity {
  operationalCityName: string;
  countryName?: string;
  isPickupCity?: boolean | string;
  isDeliveryCity?: boolean | string;
  transitDays?: number;
  [key: string]: any;
}

export interface PostExMerchantAddress {
  addressCode: string;
  cityName: string;
  address: string;
  contactPersonName?: string;
  phone1?: string;
  phone2?: string;
  phone3?: string;
  wareHouseManagerName?: string;
  isDefault?: boolean;
  [key: string]: any;
}

export interface PostExCreateAddressRequest {
  address: string;
  addressTypeId: 1 | 2; // 1 = Return, 2 = Pickup
  cityName: string;
  contactPersonName: string;
  phone1: string;
  phone2: string;
  phone3?: string;
  wareHouseManagerName?: string;
}

export interface PostExCreateOrderRequest {
  orderRefNumber: string; // Merchant order number (e.g. WO-1001)
  invoicePayment: number; // COD amount (integer)
  customerName: string;
  customerPhone: string;
  cityName: string;
  deliveryAddress: string;
  invoiceDivision?: number; // 1 by default
  items: number;
  orderType: 'Normal' | 'Reversed' | 'Replacement' | string;
  orderDetail?: string;
  transactionNotes?: string;
  pickupAddressCode?: string;
  storeAddressCode?: string;
}

export interface PostExCreateOrderResponse {
  statusCode: string | number;
  statusMessage: string;
  dist?: {
    trackingNumber?: string;
    orderStatus?: string;
    orderDate?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface PostExTrackingStatusHistory {
  messageCode?: string; // 0001, 0002, 0003, 0004, 0005, 0006, 0007, 0008, 0013
  transactionStatus?: string;
  status?: string;
  location?: string;
  dateTime?: string;
  timestamp?: string;
  remarks?: string;
  reason?: string;
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
  transactionStatusHistory?: PostExTrackingStatusHistory[];
  history?: PostExTrackingStatusHistory[];
  [key: string]: any;
}

export interface PostExPaymentStatusDetail {
  orderRefNumber?: string;
  trackingNumber?: string;
  settle?: string | boolean;
  settlementStatus?: string;
  settlementDate?: string;
  upfrontPaymentDate?: string;
  cprNumber_1?: string;
  cprNumber_2?: string;
  cprNumber?: string;
  reservePaymentDate?: string;
  invoicePayment?: number;
  transactionFee?: number;
  taxAmount?: number;
  tax?: number;
  fuelSurcharge?: number;
  netAmount?: number;
  [key: string]: any;
}

export interface PostExShipperAdviceRequest {
  trackingNumber: string;
  shipperAdvice: 1 | 2 | string; // 1 = Mark Return Requested, 2 = Mark Retry Attempt
  remarks?: string;
  comments?: string;
  newAddress?: string;
  newPhone?: string;
  newCodAmount?: number;
}

export interface PostExDiagnostics {
  configured: boolean;
  httpStatus?: number;
  statusMessage?: string;
  citiesCount: number;
  addressesCount: number;
  addresses: PostExMerchantAddress[];
  diagnosticMessage: string;
  environment: 'PRODUCTION' | 'TEST';
  baseUrl: string;
  operationalCitiesSample?: PostExOperationalCity[];
}

/**
 * Universal PostEx response extractor that prioritizes the official `dist` schema
 */
export function extractPostExDist<T = any>(data: any): T {
  if (!data) return null as unknown as T;
  if (data.dist !== undefined && data.dist !== null) {
    return data.dist as T;
  }
  if (data.response !== undefined && data.response !== null) {
    return data.response as T;
  }
  if (data.data !== undefined && data.data !== null) {
    return data.data as T;
  }
  return data as T;
}

/**
 * Extracts array specifically from PostEx response
 */
export function extractPostExArray(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.dist)) return data.dist;
  if (Array.isArray(data.distList)) return data.distList;
  if (Array.isArray(data.response)) return data.response;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;

  if (data.dist && typeof data.dist === 'object') {
    if (Array.isArray(data.dist.list)) return data.dist.list;
    if (Array.isArray(data.dist.items)) return data.dist.items;
  }
  if (data.response && typeof data.response === 'object') {
    if (Array.isArray(data.response.distList)) return data.response.distList;
    if (Array.isArray(data.response.addressList)) return data.response.addressList;
    if (Array.isArray(data.response.list)) return data.response.list;
    if (Array.isArray(data.response.items)) return data.response.items;
  }
  return [];
}

export class PostExApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = (process.env.POSTEX_API_URL || 'https://api.postex.pk').replace(/\/+$/, '');
  }

  /**
   * Resolves the secret PostEx token from server environment or DB SiteSettings.
   * Strict security: Never leaves the server.
   */
  private async resolveToken(customToken?: string): Promise<string> {
    if (customToken?.trim()) return customToken.trim();
    if (process.env.POSTEX_API_TOKEN?.trim()) return process.env.POSTEX_API_TOKEN.trim();
    try {
      const { getSiteSettings } = await import('@/lib/settings');
      const settings = await getSiteSettings();
      if (settings.postex_api_token?.trim()) {
        return settings.postex_api_token.trim();
      }
    } catch {
      // Fallback
    }
    return '';
  }

  public isConfigured(): boolean {
    return Boolean(process.env.POSTEX_API_TOKEN?.trim());
  }

  public async isConfiguredAsync(): Promise<boolean> {
    const token = await this.resolveToken();
    return Boolean(token);
  }

  public getBaseUrl(): string {
    return this.baseUrl;
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
      customToken?: string;
    } = {}
  ): Promise<{ ok: boolean; status: number; data?: T; buffer?: ArrayBuffer; error?: string }> {
    const token = await this.resolveToken(options.customToken);
    if (!token) {
      return {
        ok: false,
        status: 401,
        error: 'PostEx API token is not configured. Please enter your API token in Admin Settings → PostEx or set POSTEX_API_TOKEN in server environment.',
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
      const timeoutId = setTimeout(() => controller.abort(), 25000);

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
        const statusMessage = json.statusMessage || json.message || json.error;
        const isAppError = !response.ok || (json.statusCode && String(json.statusCode) !== '200' && String(json.statusCode) !== '201');
        return {
          ok: !isAppError && response.ok,
          status: response.status,
          data: json as T,
          error: isAppError ? (statusMessage || `HTTP ${response.status}`) : undefined,
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
  // Optional query: operationalCityType = Pickup | Delivery | Null
  // ─────────────────────────────────────────────────────────────────────────────
  async getOperationalCities(options?: {
    operationalCityType?: 'Pickup' | 'Delivery' | string;
    customToken?: string;
  }): Promise<{
    success: boolean;
    cities: PostExOperationalCity[];
    message?: string;
    raw?: any;
  }> {
    const query = options?.operationalCityType ? `?operationalCityType=${encodeURIComponent(options.operationalCityType)}` : '';
    const res = await this.request<any>(`/services/integration/api/order/v2/get-operational-city${query}`, {
      method: 'GET',
      customToken: options?.customToken,
    });

    if (!res.ok || !res.data) {
      return {
        success: false,
        cities: [],
        message: res.error || 'Failed to fetch operational cities from PostEx',
        raw: res.data,
      };
    }

    const rawList = extractPostExArray(res.data);
    const formattedCities: PostExOperationalCity[] = rawList.map((item: any) => {
      if (typeof item === 'string') {
        return {
          operationalCityName: item.trim(),
          countryName: 'Pakistan',
          isPickupCity: true,
          isDeliveryCity: true,
        };
      }
      return {
        operationalCityName: (item.operationalCityName || item.cityName || item.name || '').trim(),
        countryName: item.countryName || 'Pakistan',
        isPickupCity: item.isPickupCity === 'true' || item.isPickupCity === true,
        isDeliveryCity: item.isDeliveryCity === 'true' || item.isDeliveryCity === true || (item.isOperational ?? true),
        transitDays: item.transitDays ?? item.deliveryDays,
      };
    }).filter((c) => Boolean(c.operationalCityName));

    return {
      success: true,
      cities: formattedCities,
      message: res.data?.statusMessage || `Successfully retrieved ${formattedCities.length} operational delivery cities.`,
      raw: res.data,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Pickup Address
  // GET /services/integration/api/order/v1/get-merchant-address
  // Optional query: cityName
  // ─────────────────────────────────────────────────────────────────────────────
  async getMerchantAddresses(options?: {
    cityName?: string;
    customToken?: string;
  }): Promise<{
    success: boolean;
    addresses: PostExMerchantAddress[];
    message?: string;
    raw?: any;
  }> {
    const query = options?.cityName ? `?cityName=${encodeURIComponent(options.cityName)}` : '';
    const res = await this.request<any>(`/services/integration/api/order/v1/get-merchant-address${query}`, {
      method: 'GET',
      customToken: options?.customToken,
    });

    if (!res.ok || !res.data) {
      return {
        success: false,
        addresses: [],
        message: res.error || 'Failed to fetch merchant addresses from PostEx',
        raw: res.data,
      };
    }

    const rawList = extractPostExArray(res.data);
    const formatted: PostExMerchantAddress[] = rawList.map((item: any, idx: number) => {
      const code = String(item.addressCode || item.code || item.id || `00${idx + 1}`).trim();
      return {
        addressCode: code,
        cityName: (item.cityName || item.city || '').trim(),
        address: (item.address || item.fullAddress || '').trim(),
        contactPersonName: (item.contactPersonName || item.merchantName || item.name || '').trim(),
        phone1: (item.phone1 || item.contactPersonPhone || item.phone || '').trim(),
        phone2: (item.phone2 || '').trim(),
        phone3: (item.phone3 || '').trim(),
        wareHouseManagerName: (item.wareHouseManagerName || '').trim(),
        isDefault: Boolean(item.isDefault || idx === 0),
      };
    }).filter((a) => Boolean(a.addressCode || a.address));

    return {
      success: true,
      addresses: formatted,
      message: res.data?.statusMessage || (formatted.length > 0
        ? `Successfully retrieved ${formatted.length} PostEx merchant address(es).`
        : 'PostEx account returned 0 configured pickup addresses.'),
      raw: res.data,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Create Pickup Address
  // POST /services/integration/api/order/v2/create-merchant-address
  // ─────────────────────────────────────────────────────────────────────────────
  async createMerchantAddress(payload: PostExCreateAddressRequest): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    const res = await this.request<any>('/services/integration/api/order/v2/create-merchant-address', {
      method: 'POST',
      body: {
        address: payload.address.trim(),
        addressTypeId: payload.addressTypeId || 2, // 1 = Return, 2 = Pickup
        cityName: payload.cityName.trim(),
        contactPersonName: payload.contactPersonName.trim(),
        phone1: payload.phone1.trim(),
        phone2: payload.phone2.trim(),
        phone3: payload.phone3?.trim() || undefined,
        wareHouseManagerName: payload.wareHouseManagerName?.trim() || undefined,
      },
    });

    if (!res.ok || !res.data) {
      return { success: false, message: res.error || 'Failed to create merchant pickup address on PostEx' };
    }

    const dist = extractPostExDist(res.data);
    return {
      success: true,
      data: dist,
      message: res.data?.statusMessage || 'Merchant address created successfully on PostEx.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Order Types
  // GET /services/integration/api/order/v1/get-order-types
  // Documented values: Normal, Reversed, Replacement
  // ─────────────────────────────────────────────────────────────────────────────
  async getOrderTypes(): Promise<{ success: boolean; orderTypes: string[]; message?: string; raw?: any }> {
    const res = await this.request<any>('/services/integration/api/order/v1/get-order-types', {
      method: 'GET',
    });

    if (!res.ok || !res.data) {
      // Fallback to official documented order types
      return {
        success: true,
        orderTypes: ['Normal', 'Reversed', 'Replacement'],
        message: res.error || 'Using official PostEx order types.',
      };
    }

    const rawList = extractPostExArray(res.data);
    const types: string[] = rawList.map((item: any) => {
      if (typeof item === 'string') return item.trim();
      return (item.orderTypeName || item.name || 'Normal').trim();
    }).filter(Boolean);

    return {
      success: true,
      orderTypes: types.length > 0 ? types : ['Normal', 'Reversed', 'Replacement'],
      message: res.data?.statusMessage || 'Order types retrieved successfully.',
      raw: res.data,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Create Order
  // POST /services/integration/api/order/v3/create-order
  // ─────────────────────────────────────────────────────────────────────────────
  async createOrder(payload: PostExCreateOrderRequest): Promise<{
    success: boolean;
    trackingNumber?: string;
    orderRefNumber?: string;
    orderStatus?: string;
    raw?: any;
    message?: string;
  }> {
    const pickupCode = payload.pickupAddressCode?.trim();
    const storeCode = payload.storeAddressCode?.trim();

    // PostEx Rule: "Both pickup address code and store address code must not be null at the same time"
    if (!pickupCode && !storeCode) {
      return {
        success: false,
        message: 'PostEx shipment could not be created because no valid merchant pickup address code is configured.',
      };
    }

    const cleanPayload: Record<string, any> = {
      orderRefNumber: payload.orderRefNumber.trim(),
      invoicePayment: Math.round(Number(payload.invoicePayment) || 0),
      customerName: payload.customerName.trim(),
      customerPhone: payload.customerPhone.trim(),
      cityName: payload.cityName.trim(),
      deliveryAddress: payload.deliveryAddress.trim(),
      invoiceDivision: payload.invoiceDivision ?? 1,
      items: Number(payload.items) || 1,
      orderType: payload.orderType || 'Normal',
      orderDetail: payload.orderDetail || 'WearOMNIA Apparel',
      transactionNotes: payload.transactionNotes || `WearOMNIA Order ${payload.orderRefNumber}`,
    };

    if (pickupCode) cleanPayload.pickupAddressCode = pickupCode;
    if (storeCode) cleanPayload.storeAddressCode = storeCode;

    const res = await this.request<PostExCreateOrderResponse>('/services/integration/api/order/v3/create-order', {
      method: 'POST',
      body: cleanPayload,
    });

    if (!res.ok || !res.data) {
      return {
        success: false,
        message: res.error || 'Failed to create order on PostEx.',
        raw: res.data,
      };
    }

    const data = res.data;
    const dist = extractPostExDist<{ trackingNumber?: string; orderStatus?: string; orderDate?: string }>(data);
    const trackingNumber = dist?.trackingNumber || data.trackingNumber || data.response?.trackingNumber;

    if (!trackingNumber) {
      return {
        success: false,
        message: data.statusMessage || res.error || 'PostEx API did not return a valid tracking number in dist.trackingNumber.',
        raw: data,
      };
    }

    return {
      success: true,
      trackingNumber: String(trackingNumber).trim(),
      orderRefNumber: payload.orderRefNumber,
      orderStatus: dist?.orderStatus || 'UnBooked',
      raw: data,
      message: data.statusMessage || 'PostEx shipment created successfully.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. List Un-booked Orders
  // GET /services/integration/api/order/v2/get-unbooked-orders
  // ─────────────────────────────────────────────────────────────────────────────
  async getUnbookedOrders(): Promise<{ success: boolean; orders: any[]; message?: string; raw?: any }> {
    const res = await this.request<any>('/services/integration/api/order/v2/get-unbooked-orders', {
      method: 'GET',
    });

    if (!res.ok || !res.data) {
      return { success: false, orders: [], message: res.error || 'Failed to fetch unbooked orders from PostEx' };
    }

    const list = extractPostExArray(res.data);
    return {
      success: true,
      orders: list,
      message: res.data?.statusMessage || `Retrieved ${list.length} unbooked order(s).`,
      raw: res.data,
    };
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
      return { success: false, message: res.error || 'Failed to generate load sheet on PostEx' };
    }

    const dist = extractPostExDist<{ loadSheetId?: string; loadSheetUrl?: string }>(res.data);
    return {
      success: true,
      loadSheetId: dist?.loadSheetId || res.data.loadSheetId,
      loadSheetUrl: dist?.loadSheetUrl || res.data.loadSheetUrl,
      raw: res.data,
      message: res.data.statusMessage || 'Load sheet generated successfully.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Order Tracking (Single)
  // GET /services/integration/api/order/v1/track-order/{trackingNumber}
  // Documented message codes: 0001 - 0013
  // ─────────────────────────────────────────────────────────────────────────────
  async trackOrder(trackingNumber: string): Promise<{
    success: boolean;
    tracking?: PostExTrackingDetail;
    raw?: any;
    message?: string;
  }> {
    const cleanTracking = encodeURIComponent(trackingNumber.trim());
    const res = await this.request<any>(
      `/services/integration/api/order/v1/track-order/${cleanTracking}`,
      { method: 'GET' }
    );

    if (!res.ok || !res.data) {
      return {
        success: false,
        message: res.error || `Could not track PostEx order #${trackingNumber}`,
        raw: res.data,
      };
    }

    const dist = extractPostExDist<PostExTrackingDetail>(res.data);
    const detail: PostExTrackingDetail = dist || res.data;

    // Normalize transaction history
    const history = detail.transactionStatusHistory || detail.history || [];

    return {
      success: true,
      tracking: {
        ...detail,
        history: history.map((h: any) => ({
          messageCode: h.messageCode || h.code,
          transactionStatus: h.transactionStatus || h.status,
          status: h.transactionStatus || h.status,
          location: h.location,
          timestamp: h.dateTime || h.timestamp || new Date().toISOString(),
          remarks: h.remarks || h.reason,
        })),
      },
      raw: res.data,
      message: res.data?.statusMessage || 'Tracking information retrieved.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. Bulk Order Tracking
  // GET /services/integration/api/order/v1/track-bulk-order
  // Query: ?trackingNumbers=TN1,TN2,TN3
  // ─────────────────────────────────────────────────────────────────────────────
  async trackBulkOrders(trackingNumbers: string[]): Promise<{
    success: boolean;
    results: PostExTrackingDetail[];
    raw?: any;
    message?: string;
  }> {
    const param = encodeURIComponent(trackingNumbers.map((t) => t.trim()).join(','));
    const res = await this.request<any>(
      `/services/integration/api/order/v1/track-bulk-order?trackingNumbers=${param}`,
      { method: 'GET' }
    );

    if (!res.ok || !res.data) {
      return { success: false, results: [], message: res.error || 'Failed to fetch bulk tracking from PostEx' };
    }

    const rawList = extractPostExArray(res.data);
    return {
      success: true,
      results: rawList,
      raw: res.data,
      message: res.data?.statusMessage || 'Bulk tracking retrieved successfully.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. Official Airway Bill (Invoice PDF)
  // GET /services/integration/api/order/v1/getinvoice?trackingNumbers=...
  // Limit: 10 tracking numbers per request
  // ─────────────────────────────────────────────────────────────────────────────
  async getInvoicePdf(trackingNumbers: string | string[]): Promise<{
    success: boolean;
    buffer?: ArrayBuffer;
    contentType?: string;
    message?: string;
  }> {
    const list = Array.isArray(trackingNumbers) ? trackingNumbers : [trackingNumbers];
    if (list.length > 10) {
      return {
        success: false,
        message: 'PostEx Airway Bill API supports a maximum of 10 tracking numbers per request.',
      };
    }

    const cleanParam = encodeURIComponent(list.map((t) => t.trim()).join(','));
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
        message: res.error || `Failed to retrieve official PostEx Airway Bill PDF for ${cleanParam}.`,
      };
    }

    return {
      success: true,
      buffer: res.buffer,
      contentType: 'application/pdf',
      message: 'Official PostEx PDF retrieved successfully.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. Save Shipper Advice
  // PUT /service/integration/api/order/v2/save-shipper-advice
  // Note: Path has singular `/service/`
  // 1 = Mark Return Requested, 2 = Mark Retry Attempt
  // ─────────────────────────────────────────────────────────────────────────────
  async saveShipperAdvice(advice: PostExShipperAdviceRequest): Promise<{
    success: boolean;
    raw?: any;
    message?: string;
  }> {
    const numericAdvice = advice.shipperAdvice === '1' || advice.shipperAdvice === 1 ? 1 : 2;

    const res = await this.request<any>('/service/integration/api/order/v2/save-shipper-advice', {
      method: 'PUT',
      body: {
        trackingNumber: advice.trackingNumber.trim(),
        shipperAdvice: numericAdvice,
        remarks: advice.remarks || advice.comments,
        newAddress: advice.newAddress?.trim() || undefined,
        newPhone: advice.newPhone?.trim() || undefined,
        invoicePayment: advice.newCodAmount !== undefined ? Math.round(advice.newCodAmount) : undefined,
      },
    });

    if (!res.ok) {
      return { success: false, message: res.error || 'Failed to save shipper advice on PostEx' };
    }

    return {
      success: true,
      raw: res.data,
      message: res.data?.statusMessage || 'Shipper advice saved successfully.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. Get Shipper Advice
  // GET /service/integration/api/order/v1/get-shipper-advice/{trackingNumber}
  // Note: Path has singular `/service/`
  // ─────────────────────────────────────────────────────────────────────────────
  async getShipperAdvice(trackingNumber: string): Promise<{
    success: boolean;
    advice?: any;
    raw?: any;
    message?: string;
  }> {
    const cleanTracking = encodeURIComponent(trackingNumber.trim());
    const res = await this.request<any>(
      `/service/integration/api/order/v1/get-shipper-advice/${cleanTracking}`,
      { method: 'GET' }
    );

    if (!res.ok || !res.data) {
      return { success: false, message: res.error || 'Failed to get shipper advice from PostEx' };
    }

    const dist = extractPostExDist(res.data);
    return {
      success: true,
      advice: dist || res.data,
      raw: res.data,
      message: res.data?.statusMessage || 'Shipper advice retrieved.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 13. Cancel Order
  // PUT /services/integration/api/order/v1/cancel-order
  // ─────────────────────────────────────────────────────────────────────────────
  async cancelOrder(trackingNumber: string): Promise<{ success: boolean; raw?: any; message?: string }> {
    const res = await this.request<any>('/services/integration/api/order/v1/cancel-order', {
      method: 'PUT',
      body: {
        trackingNumber: trackingNumber.trim(),
      },
    });

    if (!res.ok) {
      return { success: false, message: res.error || 'Failed to cancel PostEx shipment.' };
    }

    return {
      success: true,
      raw: res.data,
      message: res.data?.statusMessage || 'PostEx shipment cancelled successfully.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 14. Payment Status (Settlement)
  // GET /services/integration/api/order/v1/payment-status/{trackingNumber}
  // Documented fields: orderRefNumber, trackingNumber, settle, settlementDate,
  // upfrontPaymentDate, cprNumber_1, reservePaymentDate, cprNumber_2
  // ─────────────────────────────────────────────────────────────────────────────
  async getPaymentStatus(trackingNumber: string): Promise<{
    success: boolean;
    payment?: PostExPaymentStatusDetail;
    raw?: any;
    message?: string;
  }> {
    const cleanTracking = encodeURIComponent(trackingNumber.trim());
    const res = await this.request<any>(
      `/services/integration/api/order/v1/payment-status/${cleanTracking}`,
      { method: 'GET' }
    );

    if (!res.ok || !res.data) {
      return { success: false, message: res.error || 'Failed to fetch payment settlement status from PostEx.' };
    }

    const dist = extractPostExDist<PostExPaymentStatusDetail>(res.data);
    const p = dist || res.data;

    return {
      success: true,
      payment: {
        orderRefNumber: p.orderRefNumber,
        trackingNumber: p.trackingNumber || trackingNumber,
        settle: p.settle,
        settlementStatus: p.settle === 'true' || p.settle === true ? 'SETTLED' : (p.settlementStatus || 'PENDING'),
        settlementDate: p.settlementDate,
        upfrontPaymentDate: p.upfrontPaymentDate,
        cprNumber_1: p.cprNumber_1 || p.cprNumber,
        cprNumber_2: p.cprNumber_2,
        cprNumber: p.cprNumber_1 || p.cprNumber_2 || p.cprNumber,
        reservePaymentDate: p.reservePaymentDate,
        invoicePayment: p.invoicePayment,
        transactionFee: p.transactionFee,
        taxAmount: p.taxAmount || p.tax,
        fuelSurcharge: p.fuelSurcharge,
        netAmount: p.netAmount,
      },
      raw: res.data,
      message: res.data?.statusMessage || 'Payment status retrieved successfully.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 15. Order Status List
  // GET /services/integration/api/order/v1/get-order-status
  // Documented: Unbooked, Booked, PostEx WareHouse, Out For Delivery, Delivered,
  // Returned, Un-Assigned By Me, Expired, Delivery Under Review, Picked By PostEx,
  // Out For Return, Attempted, En-Route to PostEx warehouse
  // ─────────────────────────────────────────────────────────────────────────────
  async getOrderStatusList(): Promise<{ success: boolean; statuses: string[]; message?: string; raw?: any }> {
    const res = await this.request<any>('/services/integration/api/order/v1/get-order-status', {
      method: 'GET',
    });

    const fallbackStatuses = [
      'Unbooked',
      'Booked',
      'PostEx WareHouse',
      'Out For Delivery',
      'Delivered',
      'Returned',
      'Un-Assigned By Me',
      'Expired',
      'Delivery Under Review',
      'Picked By PostEx',
      'Out For Return',
      'Attempted',
      'En-Route to PostEx warehouse',
    ];

    if (!res.ok || !res.data) {
      return { success: true, statuses: fallbackStatuses, message: 'Using documented PostEx statuses.' };
    }

    const rawList = extractPostExArray(res.data);
    const statuses = rawList.map((s: any) => (typeof s === 'string' ? s.trim() : (s.orderStatus || s.name || '').trim())).filter(Boolean);

    return {
      success: true,
      statuses: statuses.length > 0 ? statuses : fallbackStatuses,
      message: res.data?.statusMessage || 'Order statuses retrieved.',
      raw: res.data,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 16. List Orders
  // GET /services/integration/api/order/v1/get-all-order
  // Parameters: orderStatusID (0 = All Orders), fromDate, toDate
  // ─────────────────────────────────────────────────────────────────────────────
  async getAllOrders(queryParams?: {
    orderStatusID?: number | string;
    fromDate?: string;
    toDate?: string;
  }): Promise<{ success: boolean; orders: any[]; message?: string; raw?: any }> {
    const params = new URLSearchParams();
    params.set('orderStatusID', String(queryParams?.orderStatusID ?? 0));
    if (queryParams?.fromDate) params.set('fromDate', queryParams.fromDate);
    if (queryParams?.toDate) params.set('toDate', queryParams.toDate);

    const res = await this.request<any>(`/services/integration/api/order/v1/get-all-order?${params.toString()}`, {
      method: 'GET',
    });

    if (!res.ok || !res.data) {
      return { success: false, orders: [], message: res.error || 'Failed to fetch all orders from PostEx' };
    }

    const list = extractPostExArray(res.data);
    return {
      success: true,
      orders: list,
      message: res.data?.statusMessage || `Retrieved ${list.length} orders from PostEx.`,
      raw: res.data,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Diagnostics Runner
  // ─────────────────────────────────────────────────────────────────────────────
  async testConnectionAndDiagnose(customToken?: string): Promise<PostExDiagnostics> {
    const isConfig = customToken ? true : await this.isConfiguredAsync();
    if (!isConfig) {
      return {
        configured: false,
        citiesCount: 0,
        addressesCount: 0,
        addresses: [],
        diagnosticMessage: 'POSTEX_API_TOKEN is not configured. Please enter your API token in Admin Settings or set POSTEX_API_TOKEN in server environment.',
        environment: 'PRODUCTION',
        baseUrl: this.baseUrl,
      };
    }

    const [citiesRes, addressesRes] = await Promise.all([
      this.getOperationalCities({ customToken }),
      this.getMerchantAddresses({ customToken }),
    ]);

    const citiesCount = citiesRes.cities.length;
    const addressesCount = addressesRes.addresses.length;

    let diagnosticMessage = '';
    if (citiesRes.success && addressesRes.success) {
      if (addressesCount > 0) {
        diagnosticMessage = `✓ PostEx API connected successfully! Loaded ${citiesCount} operational delivery cities and ${addressesCount} merchant pickup address(es). Ready for express dispatch.`;
      } else {
        diagnosticMessage = `✓ PostEx API authenticated with ${citiesCount} operational delivery cities. Note: Merchant account currently has 0 pickup addresses returned by PostEx API. Ensure an address is registered in the PostEx portal.`;
      }
    } else if (citiesRes.success && !addressesRes.success) {
      diagnosticMessage = `PostEx operational cities active (${citiesCount} cities), but merchant address lookup returned: ${addressesRes.message || 'Address lookup error'}.`;
    } else {
      diagnosticMessage = `PostEx API error: ${citiesRes.message || addressesRes.message || 'Could not authenticate with PostEx.'}`;
    }

    return {
      configured: true,
      httpStatus: 200,
      statusMessage: citiesRes.message,
      citiesCount,
      addressesCount,
      addresses: addressesRes.addresses,
      diagnosticMessage,
      environment: this.baseUrl.includes('test') || this.baseUrl.includes('staging') ? 'TEST' : 'PRODUCTION',
      baseUrl: this.baseUrl,
      operationalCitiesSample: citiesRes.cities.slice(0, 10),
    };
  }
}

export const postexApi = new PostExApiClient();
