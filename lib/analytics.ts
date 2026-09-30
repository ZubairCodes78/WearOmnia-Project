export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-FBD3441VL9';

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Tracks page view in GA4 across client-side App Router navigations.
 * Safely guards against missing window/gtag or ad-blockers.
 */
export const pageview = (url: string) => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return;

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: url,
        page_location: window.location.href,
        page_title: typeof document !== 'undefined' ? document.title : '',
        send_to: GA_MEASUREMENT_ID,
      });
    }
  } catch (error) {
    // Fail silently if blocked by client privacy extension
  }
};

/**
 * Generic GA4 custom event tracking helper.
 */
export const event = (
  action: string,
  params: Record<string, any> = {}
) => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return;

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', action, params);
    }
  } catch (error) {
    // Fail silently if blocked by client privacy extension
  }
};

// ── Reusable E-commerce Helpers for GA4 ───────────────────────────────────────

export interface GAItem {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
  item_category?: string;
  item_variant?: string;
}

export const trackViewItem = (item: GAItem, currency: string = 'PKR') => {
  event('view_item', {
    currency,
    value: item.price ?? 0,
    items: [item],
  });
};

export const trackAddToCart = (item: GAItem, currency: string = 'PKR') => {
  event('add_to_cart', {
    currency,
    value: (item.price ?? 0) * (item.quantity ?? 1),
    items: [item],
  });
};

export const trackBeginCheckout = (items: GAItem[], totalValue: number, currency: string = 'PKR') => {
  event('begin_checkout', {
    currency,
    value: totalValue,
    items,
  });
};

export const trackPurchase = (
  transactionId: string,
  totalValue: number,
  items: GAItem[],
  shipping: number = 0,
  currency: string = 'PKR'
) => {
  event('purchase', {
    transaction_id: transactionId,
    value: totalValue,
    currency,
    shipping,
    items,
  });
};
