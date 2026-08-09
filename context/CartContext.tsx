'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { FlyToCartAnimation, FlyingImage } from '@/components/cart/FlyToCartAnimation';

export interface CartItem {
  id: string;
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

export interface Coupon {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
}

interface CartContextType {
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartItem, 'id'>, startPos?: { x: number; y: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  appliedCoupon: Coupon | null;
  applyCoupon: (coupon: Coupon | null) => void;
  subtotal: number;
  discountAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [flyingImages, setFlyingImages] = useState<FlyingImage[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('wearomnia_cart');
      if (saved) setCart(JSON.parse(saved));
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('wearomnia_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  const addToCart = (itemData: Omit<CartItem, 'id'>, startPos?: { x: number; y: number }) => {
    const id = `${itemData.productId}-${itemData.size}-${itemData.color}`;

    if (startPos) {
      setFlyingImages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          src: itemData.image,
          startX: startPos.x,
          startY: startPos.y,
        },
      ]);
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        return prev.map((i) =>
          i.id === id ? { ...i, quantity: Math.min(i.quantity + itemData.quantity, i.maxStock) } : i
        );
      }
      return [...prev, { ...itemData, id }];
    });

    setTimeout(() => {
      setIsCartOpen(true);
    }, 400);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            if (newQuantity <= 0) return null;
            return { ...i, quantity: Math.min(newQuantity, i.maxStock) };
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = (coupon: Coupon | null) => {
    setAppliedCoupon(coupon);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discountAmount = 0;
  if (appliedCoupon && subtotal >= appliedCoupon.minOrderAmount) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscountAmount && discountAmount > appliedCoupon.maxDiscountAmount) {
        discountAmount = appliedCoupon.maxDiscountAmount;
      }
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }

  const removeFlyingImage = (id: string) => {
    setFlyingImages((prev) => prev.filter((img) => img.id !== id));
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        appliedCoupon,
        applyCoupon,
        subtotal,
        discountAmount,
      }}
    >
      {children}
      <FlyToCartAnimation flyingImages={flyingImages} onAnimationComplete={removeFlyingImage} />
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
