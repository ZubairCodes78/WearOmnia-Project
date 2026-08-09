export interface CartItem {
  id: string; // product.id + size + color
  productId: string;
  title: string;
  slug: string;
  image: string;
  price: number;
  basePrice: number;
  size: string;
  color: string;
  sku: string;
  quantity: number;
  maxStock: number;
}

export interface WishlistItem {
  productId: string;
  title: string;
  slug: string;
  image: string;
  price: number;
  basePrice: number;
  sku: string;
}

export interface CouponDiscount {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  calculatedDiscount: number;
}

export interface CheckoutFormData {
  fullName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  province: string;
  city: string;
  address: string;
  postalCode?: string;
  orderNotes?: string;
  couponCode?: string;
}

export interface OrderNotification {
  id: string;
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  city?: string;
  amount?: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
