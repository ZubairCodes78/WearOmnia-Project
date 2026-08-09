'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useCart } from '@/context/CartContext';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface FlyToCartItem {
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

interface FlyAnimation {
  id: string;
  imageSrc: string;
  startRect: DOMRect;
  endRect: DOMRect;
}

interface FlyToCartContextType {
  flyToCart: (item: FlyToCartItem, sourceElement: HTMLElement | null) => Promise<boolean>;
  isAnimating: boolean;
}

const FlyToCartContext = createContext<FlyToCartContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────
// Utility: find the cart target element
// ─────────────────────────────────────────────────────────────

function getCartTargetRect(): DOMRect | null {
  // Find all elements with data-cart-target
  const targets = document.querySelectorAll('[data-cart-target="true"]');
  if (targets.length === 0) return null;

  // Return the first visible one (handles responsive layouts)
  for (const target of targets) {
    const rect = target.getBoundingClientRect();
    // Element is visible if it has dimensions and is within viewport
    if (rect.width > 0 && rect.height > 0 && rect.top >= -50 && rect.left >= -50) {
      return rect;
    }
  }

  // Fallback to first target
  return targets[0].getBoundingClientRect();
}

// ─────────────────────────────────────────────────────────────
// Utility: check prefers-reduced-motion
// ─────────────────────────────────────────────────────────────

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ─────────────────────────────────────────────────────────────
// Utility: get the product image element from a source
// ─────────────────────────────────────────────────────────────

function getImageRect(sourceElement: HTMLElement | null): { rect: DOMRect; src: string } | null {
  if (!sourceElement) return null;

  // Try to find the nearest img element
  let imgEl: HTMLImageElement | null = null;

  // If the source IS an image
  if (sourceElement.tagName === 'IMG') {
    imgEl = sourceElement as HTMLImageElement;
  } else {
    // Search within the source for an img
    imgEl = sourceElement.querySelector('img');

    // Search upward to find a product card / image container
    if (!imgEl) {
      const card = sourceElement.closest('[data-fly-source]') || sourceElement.closest('.group');
      if (card) {
        imgEl = card.querySelector('img');
      }
    }
  }

  if (!imgEl) return null;

  return {
    rect: imgEl.getBoundingClientRect(),
    src: imgEl.src || imgEl.currentSrc,
  };
}

// ─────────────────────────────────────────────────────────────
// Provider Component
// ─────────────────────────────────────────────────────────────

export const FlyToCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToCart, setIsCartOpen } = useCart();
  const [animations, setAnimations] = useState<FlyAnimation[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationLock = useRef(false);

  const flyToCart = useCallback(
    async (item: FlyToCartItem, sourceElement: HTMLElement | null): Promise<boolean> => {
      // Rapid click protection
      if (animationLock.current) return false;
      animationLock.current = true;
      setIsAnimating(true);

      try {
        // 1. Add to cart state FIRST (animation is only visual feedback)
        addToCart(item);

        // 2. Check for reduced motion
        if (prefersReducedMotion()) {
          // Skip animation, just open cart
          setTimeout(() => {
            setIsCartOpen(true);
          }, 150);
          return true;
        }

        // 3. Get source image rect
        const imageInfo = getImageRect(sourceElement);
        const cartRect = getCartTargetRect();

        if (!imageInfo || !cartRect) {
          // No visual source or cart target found — skip animation, open cart
          setTimeout(() => {
            setIsCartOpen(true);
          }, 300);
          return true;
        }

        // 4. Create fly animation
        const animId = `fly-${Date.now()}`;
        const flyAnim: FlyAnimation = {
          id: animId,
          imageSrc: imageInfo.src || item.image,
          startRect: imageInfo.rect,
          endRect: cartRect,
        };

        setAnimations((prev) => [...prev, flyAnim]);

        // 5. Wait for animation to complete, then open cart
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            // Remove animation clone
            setAnimations((prev) => prev.filter((a) => a.id !== animId));
            resolve();
          }, 650); // Animation duration
        });

        // 6. Open cart drawer after animation
        setTimeout(() => {
          setIsCartOpen(true);
        }, 50);

        return true;
      } catch (error) {
        console.error('[FlyToCart] Error:', error);
        return false;
      } finally {
        animationLock.current = false;
        setIsAnimating(false);
      }
    },
    [addToCart, setIsCartOpen]
  );

  return (
    <FlyToCartContext.Provider value={{ flyToCart, isAnimating }}>
      {children}

      {/* Animation Portal Layer */}
      {animations.map((anim) => (
        <FlyingImage key={anim.id} animation={anim} />
      ))}
    </FlyToCartContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────
// Flying Image Component (rendered in portal layer)
// ─────────────────────────────────────────────────────────────

const FlyingImage: React.FC<{ animation: FlyAnimation }> = ({ animation }) => {
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    const { startRect, endRect } = animation;

    // Calculate the flight path
    const startX = startRect.left;
    const startY = startRect.top;
    const startW = Math.min(startRect.width, 120); // Cap size for performance
    const startH = Math.min(startRect.height, 160);

    const endX = endRect.left + endRect.width / 2;
    const endY = endRect.top + endRect.height / 2;

    // Set initial position
    el.style.left = `${startX}px`;
    el.style.top = `${startY}px`;
    el.style.width = `${startW}px`;
    el.style.height = `${startH}px`;
    el.style.opacity = '1';
    el.style.transform = 'scale(1)';

    // Force reflow
    el.getBoundingClientRect();

    // Use requestAnimationFrame for smooth start
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Calculate curved midpoint for arc trajectory
        const midX = (startX + endX) / 2;
        const midY = Math.min(startY, endY) - 60; // Arc upward

        el.style.transition = 'all 600ms cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.left = `${endX - 12}px`;
        el.style.top = `${endY - 12}px`;
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.opacity = '0';
        el.style.transform = 'scale(0.3)';
        el.style.borderRadius = '50%';
      });
    });
  }, [animation]);

  return (
    <div
      ref={imgRef}
      className="fixed pointer-events-none will-change-transform"
      style={{
        zIndex: 9999,
        overflow: 'hidden',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(16, 61, 66, 0.25)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={animation.imageSrc}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export const useFlyToCart = () => {
  const context = useContext(FlyToCartContext);
  if (!context) {
    throw new Error('useFlyToCart must be used within a FlyToCartProvider');
  }
  return context;
};
