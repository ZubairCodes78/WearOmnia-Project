/**
 * Official PostEx Courier Merchant API Client
 *
 * Base URL: https://api.postex.pk
 * Authentication: token header with POSTEX_API_TOKEN
 *
 * Security:
 * - Reads token ONLY from server environment or SiteSettings in DB.
 * - NEVER exposes or logs the token.
 * - Multi-key response parser handles distList, response, data, and legacy formats.
 */

export interface PostExOperationalCity {
  cityId?: number | string;
  cityName: string;
  isOperational?: boolean;
  transitDays?: number;
}

export interface PostExMerchantAddress {
  addressCode: string;
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
}

/**
 * Universal array extractor from PostEx API responses
 */
function extractArray(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.distList)) return data.distList;
  if (Array.isArray(data.response)) return data.response;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.cities)) return data.cities;
  if (Array.isArray(data.addresses)) return data.addresses;
  if (Array.isArray(data.orderTypes)) return data.orderTypes;
  if (Array.isArray(data.orders)) return data.orders;
  if (Array.isArray(data.statuses)) return data.statuses;

  if (data.response && typeof data.response === 'object') {
    if (Array.isArray(data.response.distList)) return data.response.distList;
    if (Array.isArray(data.response.addressList)) return data.response.addressList;
    if (Array.isArray(data.response.merchantAddressList)) return data.response.merchantAddressList;
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
   * Retrieves the server-side PostEx API token.
   * Resolves from explicit parameter, process.env, or SiteSettings in database.
   * STRICT SECURITY: Never logs or exposes this token.
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
      // fallback
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
        error: 'PostEx API token is not configured. Please set POSTEX_API_TOKEN in server environment or Admin Settings → PostEx.',
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
  // GET /services/integration/api/order/v2/get-operational-city (v1 fallback)
  // ─────────────────────────────────────────────────────────────────────────────
  async getOperationalCities(customToken?: string): Promise<{
    success: boolean;
    cities: PostExOperationalCity[];
    message?: string;
    raw?: any;
  }> {
    // Try v2 endpoint first
    let res = await this.request<any>('/services/integration/api/order/v2/get-operational-city', {
      method: 'GET',
      customToken,
    });

    // Fallback to v1 endpoint if v2 returned empty or failed
    if (!res.ok || extractArray(res.data).length === 0) {
      const v1Res = await this.request<any>('/services/integration/api/order/v1/get-operational-city', {
        method: 'GET',
        customToken,
      });
      if (v1Res.ok && extractArray(v1Res.data).length > 0) {
        res = v1Res;
      }
    }

    if (!res.ok || !res.data) {
      return { success: false, cities: [], message: res.error || 'Failed to fetch operational cities', raw: res.data };
    }

    const list = extractArray(res.data);
    const formattedCities: PostExOperationalCity[] = list.map((item: any, idx: number) => {
      if (typeof item === 'string') {
        return {
          cityId: item,
          cityName: item.trim(),
          isOperational: true,
        };
      }
      return {
        cityId: item.cityId || item.id || item.distCode || item.cityName || `CITY-${idx}`,
        cityName: (item.cityName || item.name || item.cityNameEn || '').trim(),
        isOperational: item.isOperational ?? true,
        transitDays: item.transitDays ?? item.deliveryDays,
      };
    }).filter((c) => Boolean(c.cityName));

    return {
      success: true,
      cities: formattedCities,
      message: res.data?.statusMessage || `Successfully retrieved ${formattedCities.length} operational delivery cities.`,
      raw: res.data,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Pickup Address
  // GET /services/integration/api/order/v1/get-merchant-address (v2 fallback)
  // ─────────────────────────────────────────────────────────────────────────────
  async getMerchantAddresses(customToken?: string): Promise<{
    success: boolean;
    addresses: PostExMerchantAddress[];
    message?: string;
    raw?: any;
  }> {
    // Try v1 endpoint first
    let res = await this.request<any>('/services/integration/api/order/v1/get-merchant-address', {
      method: 'GET',
      customToken,
    });

    // Fallback to v2 endpoint if v1 returned empty or failed
    if (!res.ok || extractArray(res.data).length === 0) {
      const v2Res = await this.request<any>('/services/integration/api/order/v2/get-merchant-address', {
        method: 'GET',
        customToken,
      });
      if (v2Res.ok && extractArray(v2Res.data).length > 0) {
        res = v2Res;
      }
    }

    if (!res.ok || !res.data) {
      return { success: false, addresses: [], message: res.error || 'Failed to fetch merchant addresses', raw: res.data };
    }

    const list = extractArray(res.data);
    const formatted: PostExMerchantAddress[] = list.map((item: any, idx: number) => {
      const rawCode = item.addressCode || item.pickupAddressCode || item.storeAddressCode || item.distCode || item.code || item.id;
      const code = String(rawCode || `00${idx + 1}`).trim();
      return {
        addressCode: code,
        pickupAddressCode: code,
        cityName: (item.cityName || item.city || '').trim(),
        address: (item.address || item.pickupAddress || item.storeAddress || item.fullAddress || '').trim(),
        contactPersonName: (item.contactPersonName || item.merchantName || item.name || '').trim(),
        contactPersonPhone: (item.contactPersonPhone || item.merchantPhone || item.phone || '').trim(),
        isDefault: Boolean(item.isDefault || item.default || item.isPrimary || idx === 0),
      };
    }).filter((a) => Boolean(a.addressCode || a.address));

    return {
      success: true,
      addresses: formatted,
      message: res.data?.statusMessage || (formatted.length > 0
        ? `Successfully retrieved ${formatted.length} PostEx merchant address(es).`
        : 'PostEx account has 0 configured pickup addresses in PostEx portal.'),
      raw: res.data,
    };
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
    const res = await this.request<any>('/services/integration/api/order/v1/get-order-types', {
      method: 'GET',
    });

    if (!res.ok || !res.data) {
      return { success: false, orderTypes: [], message: res.error || 'Failed to fetch order types' };
    }

    const list = extractArray(res.data);
    const formatted: PostExOrderType[] = list.map((item: any) => ({
      orderTypeId: item.orderTypeId || item.id,
      orderTypeName: typeof item === 'string' ? item : item.orderTypeName || item.name || 'Normal',
      description: item.description,
    }));

    return { success: true, orderTypes: formatted, message: res.data?.statusMessage || 'Order types retrieved' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. CREATE ORDER (Manual Admin Dispatch Workflow Only)
  // POST /services/integration/api/order/v3/create-order
  // ─────────────────────────────────────────────────────────────────────────────
  async createOrder(payload: PostExCreateOrderRequest): Promise<{
    success: boolean;
    trackingNumber?: string;
    orderRefNumber?: string;
    raw?: any;
    message?: string;
  }> {
    const pickupCode = payload.pickupAddressCode?.trim();
    const storeCode = payload.storeAddressCode?.trim();

    // PostEx requires at least one address code
    if (!pickupCode && !storeCode) {
      return {
        success: false,
        message: 'PostEx pickup address is not configured. Please configure it in Admin Settings → PostEx.',
      };
    }

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
      pickupAddressCode: pickupCode || undefined,
      storeAddressCode: storeCode || undefined,
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

    const list = extractArray(res.data);
    return { success: true, orders: list, message: res.data?.statusMessage || 'Unbooked orders retrieved' };
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

    const list = extractArray(res.data);
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

    // Try /getinvoice first
    let res = await this.request(
      `/services/integration/api/order/v1/getinvoice?trackingNumbers=${cleanParam}`,
      {
        method: 'GET',
        isBinary: true,
        headers: {
          Accept: 'application/pdf, application/json, */*',
        },
      }
    );

    // If failed, try hyphenated endpoint /get-invoice
    if (!res.ok || !res.buffer) {
      const altRes = await this.request(
        `/services/integration/api/order/v1/get-invoice?trackingNumbers=${cleanParam}`,
        {
          method: 'GET',
          isBinary: true,
          headers: {
            Accept: 'application/pdf, application/json, */*',
          },
        }
      );
      if (altRes.ok && altRes.buffer) {
        res = altRes;
      }
    }

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
  // PUT /services/integration/api/order/v2/save-shipper-advice
  // ─────────────────────────────────────────────────────────────────────────────
  async saveShipperAdvice(advice: PostExShipperAdviceRequest): Promise<{
    success: boolean;
    raw?: any;
    message?: string;
  }> {
    const res = await this.request<any>('/services/integration/api/order/v2/save-shipper-advice', {
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
  // GET /services/integration/api/order/v1/get-shipper-advice/{trackingNumber}
  // ─────────────────────────────────────────────────────────────────────────────
  async getShipperAdvice(trackingNumber: string): Promise<{
    success: boolean;
    advice?: any;
    message?: string;
  }> {
    const cleanTracking = encodeURIComponent(trackingNumber.trim());
    const res = await this.request<any>(
      `/services/integration/api/order/v1/get-shipper-advice/${cleanTracking}`,
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

    const list = extractArray(res.data);
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

    const list = extractArray(res.data);
    return { success: true, orders: list, message: res.data.statusMessage || 'PostEx orders retrieved' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FULL DIAGNOSTIC TEST RUNNER
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
      this.getOperationalCities(customToken),
      this.getMerchantAddresses(customToken),
    ]);

    const citiesCount = citiesRes.cities.length;
    const addressesCount = addressesRes.addresses.length;

    let diagnosticMessage = '';
    if (citiesRes.success && addressesRes.success) {
      if (addressesCount > 0) {
        diagnosticMessage = `✓ PostEx connected successfully! Found ${citiesCount} operational delivery cities and ${addressesCount} merchant pickup address(es). Ready for express dispatch.`;
      } else {
        diagnosticMessage = `✓ PostEx connected successfully to ${citiesCount} operational delivery cities, but no merchant pickup addresses were returned by the API. Please configure your pickup address in the PostEx Merchant Portal or enter your pickup address code manually below.`;
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
    };
  }
}

export const postexApi = new PostExApiClient();
