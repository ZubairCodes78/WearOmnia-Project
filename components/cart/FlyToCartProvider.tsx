'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface FlightInstance {
  id: string;
  imageSrc: string;
  startCenterX: number;
  startCenterY: number;
  initialWidth: number;
  initialHeight: number;
  midX: number;
  midY: number;
  targetCenterX: number;
  targetCenterY: number;
  onArrival?: () => void;
}

interface FlyToCartContextType {
  triggerFlyToCart: (
    source: HTMLElement | DOMRect | null,
    imageSrc?: string,
    onArrival?: () => void
  ) => void;
}

const FlyToCartContext = createContext<FlyToCartContextType>({
  triggerFlyToCart: () => {},
});

export const useFlyToCart = () => useContext(FlyToCartContext);

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getCartTargetCoordinates(): {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
} {
  if (typeof window === 'undefined') {
    return { centerX: 0, centerY: 0, width: 44, height: 44 };
  }

  // Find all cart button candidates across desktop & mobile
  const candidates: HTMLElement[] = Array.from(
    document.querySelectorAll<HTMLElement>(
      '#header-cart-button, [data-cart-target="true"], button[aria-label*="Shopping bag"], button[title="Shopping Bag"]'
    )
  );

  for (const el of candidates) {
    const rect = el.getBoundingClientRect();
    // Element must be actually visible in the active viewport (not hidden, display none, or zero size)
    if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight) {
      const style = window.getComputedStyle(el);
      if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
        const svgEl = el.querySelector('svg');
        const measureRect = (svgEl || el).getBoundingClientRect();
        return {
          centerX: measureRect.left + measureRect.width / 2,
          centerY: measureRect.top + measureRect.height / 2,
          width: measureRect.width,
          height: measureRect.height,
        };
      }
    }
  }

  // Dynamic fallback based on viewport width
  const isMobile = window.innerWidth < 640;
  const fallbackX = window.innerWidth - (isMobile ? 40 : 64);
  const fallbackY = isMobile ? 30 : 36;

  return {
    centerX: fallbackX,
    centerY: fallbackY,
    width: 36,
    height: 36,
  };
}

// ─────────────────────────────────────────────────────────────
// Provider Component
// ─────────────────────────────────────────────────────────────

export const FlyToCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flights, setFlights] = useState<FlightInstance[]>([]);

  const triggerFlyToCart = useCallback(
    (
      source: HTMLElement | DOMRect | null,
      imageSrc?: string,
      onArrival?: () => void
    ) => {
      if (typeof window === 'undefined') return;

      // 1. Honor prefers-reduced-motion: bypass visual flight, trigger subtle bounce and arrival only
      if (isReducedMotion()) {
        if (onArrival) onArrival();
        window.dispatchEvent(new CustomEvent('wearomnia-cart-bounce'));
        return;
      }

      // 2. Resolve image rect and source URL
      let startRect: DOMRect | null = null;
      let resolvedSrc = imageSrc || '';

      if (source instanceof DOMRect) {
        startRect = source;
      } else if (source) {
        let imgEl: HTMLImageElement | null = null;
        if (source.tagName === 'IMG') {
          imgEl = source as HTMLImageElement;
        } else {
          imgEl = source.querySelector('img');
          if (!imgEl) {
            const container =
              source.closest('[data-fly-source]') ||
              source.closest('.group') ||
              source.closest('[role="dialog"]');
            if (container) {
              imgEl = container.querySelector('img');
            }
          }
        }

        if (imgEl) {
          startRect = imgEl.getBoundingClientRect();
          if (!resolvedSrc) {
            resolvedSrc = imgEl.currentSrc || imgEl.src;
          }
        } else {
          startRect = source.getBoundingClientRect();
        }
      }

      if (!startRect || startRect.width <= 0 || startRect.height <= 0 || !resolvedSrc) {
        // Source not measurable, trigger bounce and arrival fallback
        if (onArrival) onArrival();
        window.dispatchEvent(new CustomEvent('wearomnia-cart-bounce'));
        return;
      }

      // 3. Resolve cart target position dynamically (handles scroll and responsive viewports)
      const target = getCartTargetCoordinates();

      const isMobile = window.innerWidth < 640;
      const initialWidth = Math.min(startRect.width, isMobile ? 100 : 140);
      const aspectRatio = startRect.height / (startRect.width || 1);
      const initialHeight = initialWidth * aspectRatio;

      const startCenterX = startRect.left + startRect.width / 2;
      const startCenterY = startRect.top + startRect.height / 2;

      const targetCenterX = target.centerX;
      const targetCenterY = target.centerY;

      const deltaX = targetCenterX - startCenterX;
      const deltaY = targetCenterY - startCenterY;

      // 4. Calculate Parabolic Curved Trajectory:
      // Guarantee the curve stays gracefully within the visible viewport and never flies above the top edge
      const headerSafetyY = targetCenterY + (isMobile ? 22 : 36);
      const naturalArcY =
        startCenterY + deltaY * 0.48 - Math.min(isMobile ? 55 : 90, Math.abs(deltaX) * 0.15);
      const midY = Math.max(headerSafetyY, naturalArcY);
      const midX = startCenterX + deltaX * 0.52;

      const flightId = `flight-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const newFlight: FlightInstance = {
        id: flightId,
        imageSrc: resolvedSrc,
        startCenterX,
        startCenterY,
        initialWidth,
        initialHeight,
        midX,
        midY,
        targetCenterX,
        targetCenterY,
        onArrival,
      };

      // Append flight instance to allow multiple rapid clicks across products concurrently
      setFlights((prev) => [...prev, newFlight]);
    },
    []
  );

  // Global window event listener so any button or component can trigger without needing the hook
  useEffect(() => {
    const handleCustomFlyEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{
        source?: HTMLElement;
        imageSrc?: string;
        onArrival?: () => void;
      }>;
      if (customEvent.detail) {
        triggerFlyToCart(
          customEvent.detail.source || null,
          customEvent.detail.imageSrc,
          customEvent.detail.onArrival
        );
      }
    };

    window.addEventListener('wearomnia-fly-to-cart', handleCustomFlyEvent);
    return () => window.removeEventListener('wearomnia-fly-to-cart', handleCustomFlyEvent);
  }, [triggerFlyToCart]);

  const handleFlightComplete = useCallback((id: string) => {
    // Clean up flight clone and trigger arrival bounce
    window.dispatchEvent(new CustomEvent('wearomnia-cart-bounce'));
    setFlights((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return (
    <FlyToCartContext.Provider value={{ triggerFlyToCart }}>
      {children}

      {/* Floating Image Portal Overlay: Unclipped, full viewport layer */}
      <div
        id="wearomnia-fly-portal"
        className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden"
        aria-hidden="true"
      >
        <AnimatePresence>
          {flights.map((flight) => (
            <FlyingImageClone
              key={flight.id}
              flight={flight}
              onComplete={() => handleFlightComplete(flight.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </FlyToCartContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────
// Flying Image Clone (3-Phase Full-Page Flight & True Cart Entry)
// ─────────────────────────────────────────────────────────────

interface FlyingImageCloneProps {
  flight: FlightInstance;
  onComplete: () => void;
}

const FlyingImageClone: React.FC<FlyingImageCloneProps> = ({ flight, onComplete }) => {
  // Safe: FlyingImageClone is only ever rendered client-side (flights state is empty on SSR)
  // Still guard for completeness
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const duration = isMobile ? 0.70 : 0.82;
  const hasTriggeredArrival = React.useRef(false);

  const handleArrival = () => {
    if (!hasTriggeredArrival.current) {
      hasTriggeredArrival.current = true;
      if (flight.onArrival) {
        flight.onArrival();
      }
    }
  };

  return (
    <motion.div
      initial={{
        position: 'fixed',
        left: -flight.initialWidth / 2,
        top: -flight.initialHeight / 2,
        x: flight.startCenterX,
        y: flight.startCenterY,
        width: flight.initialWidth,
        height: flight.initialHeight,
        opacity: 1,
        scale: 1,
        borderRadius: 14,
        rotate: 0,
      }}
      animate={{
        // 3-Phase Movement:
        // Phase 1 (0 -> 14%): Pick up / lift from card
        // Phase 2 (14% -> 90%): Curved flight across full visible page right to cart
        // Phase 3 (90% -> 100%): Enters directly inside the cart icon center
        x: [
          flight.startCenterX,
          flight.startCenterX,
          flight.midX,
          flight.targetCenterX,
          flight.targetCenterX,
        ],
        y: [
          flight.startCenterY,
          flight.startCenterY - (isMobile ? 12 : 20),
          flight.midY,
          flight.targetCenterY,
          flight.targetCenterY,
        ],
        scale: [1.0, 1.05, 0.6, 0.22, 0.02],
        // Product image stays 100% VISIBLE throughout flight; only fades inside cart opening
        opacity: [1.0, 1.0, 1.0, 1.0, 0],
        rotate: [0, -2, 4, 0, 0],
        borderRadius: [14, 16, 22, 40, 50],
      }}
      transition={{
        duration,
        ease: [0.16, 1, 0.3, 1],
        times: [0, 0.14, 0.55, 0.90, 1],
      }}
      onUpdate={(latest) => {
        // As clone arrives at the cart mouth (scale <= 0.25), trigger onArrival synchronously
        if (typeof latest.scale === 'number' && latest.scale <= 0.25) {
          handleArrival();
        }
      }}
      onAnimationComplete={() => {
        handleArrival();
        onComplete();
      }}
      className="overflow-hidden pointer-events-none will-change-transform shadow-2xl border-2 border-champagne bg-offwhite z-[99999]"
      style={{
        boxShadow:
          '0 18px 40px -4px rgba(16, 61, 66, 0.5), 0 0 22px 2px rgba(223, 195, 160, 0.6)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={flight.imageSrc}
        alt="Adding to bag"
        className="w-full h-full object-cover object-center select-none"
      />
    </motion.div>
  );
};
