'use client';

import { useEffect } from 'react';
import { trackPurchase, type GAItem } from '@/lib/analytics';

interface OrderSuccessTrackerProps {
  orderNumber: string;
  totalAmount: number;
  shippingFee: number;
  couponCode?: string | null;
  items: GAItem[];
}

export function OrderSuccessTracker({
  orderNumber,
  totalAmount,
  shippingFee,
  couponCode,
  items,
}: OrderSuccessTrackerProps) {
  useEffect(() => {
    if (!orderNumber || items.length === 0) return;
    trackPurchase(
      orderNumber,
      totalAmount,
      items,
      shippingFee,
      'PKR',
      couponCode || undefined
    );
  }, [orderNumber, totalAmount, shippingFee, couponCode, items]);

  return null;
}

