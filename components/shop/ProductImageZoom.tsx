'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Maximize2 } from 'lucide-react';

interface ProductImageZoomProps {
  src: string;
  alt: string;
  priority?: boolean;
  onOpenLightbox?: () => void;
  className?: string;
}

/**
 * Premium E-Commerce Product Image Hover Zoom.
 *
 * Desktop: Smoothly zooms image up to 2.2x following cursor coordinates via GPU-accelerated
 * requestAnimationFrame without triggering component re-renders. Smoothly resets to 1x on leave.
 *
 * Mobile / Touch: Disables hover tracking to preserve native touch scrolling and gestures.
 */
export const ProductImageZoom: React.FC<ProductImageZoomProps> = ({
  src,
  alt,
  priority = false,
  onOpenLightbox,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isHoverSupported, setIsHoverSupported] = useState(false);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Detect whether current device has true cursor hover capability
    const checkHover = () => {
      const match = window.matchMedia('(hover: hover) and (pointer: fine)');
      setIsHoverSupported(match.matches);
    };
    checkHover();

    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    mediaQuery.addEventListener('change', checkHover);
    return () => {
      mediaQuery.removeEventListener('change', checkHover);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const handlePointerEnter = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isHoverSupported || e.pointerType === 'touch') return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      const container = containerRef.current;
      const imgWrapper = imageWrapperRef.current;
      if (!container || !imgWrapper) return;

      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

      imgWrapper.style.transformOrigin = `${x}% ${y}%`;
      imgWrapper.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
      imgWrapper.style.transform = 'scale(2.2)';
      setIsZoomed(true);
    },
    [isHoverSupported]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isHoverSupported || e.pointerType === 'touch') return;

      const container = containerRef.current;
      const imgWrapper = imageWrapperRef.current;
      if (!container || !imgWrapper) return;

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }

      rafId.current = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

        imgWrapper.style.transformOrigin = `${x.toFixed(2)}% ${y.toFixed(2)}%`;
      });
    },
    [isHoverSupported]
  );

  const handlePointerLeave = useCallback(() => {
    if (!isHoverSupported) return;

    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }

    const imgWrapper = imageWrapperRef.current;
    if (!imgWrapper) return;

    imgWrapper.style.transition =
      'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform-origin 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    imgWrapper.style.transform = 'scale(1)';
    imgWrapper.style.transformOrigin = 'center center';
    setIsZoomed(false);
  }, [isHoverSupported]);

  return (
    <div
      ref={containerRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={() => {
        // If clicked on mobile or when not zoomed, open lightbox
        if (!isZoomed && onOpenLightbox) {
          onOpenLightbox();
        }
      }}
      className={`relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-sand border border-sand shadow-lg group select-none ${
        isHoverSupported ? 'cursor-zoom-in' : 'cursor-pointer'
      } ${className}`}
    >
      <div
        ref={imageWrapperRef}
        className="w-full h-full relative will-change-[transform,transform-origin] product-zoom-image"
        style={{ transformOrigin: 'center center', transform: 'scale(1)' }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
          quality={85}
          className="object-cover object-center pointer-events-none select-none"
        />
      </div>

      {/* Fullscreen Lightbox Trigger Button */}
      {onOpenLightbox && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenLightbox();
          }}
          className="absolute top-4 right-4 z-20 bg-offwhite/90 backdrop-blur-xs p-2.5 rounded-full text-teal hover:bg-champagne transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
          title="Fullscreen Lightbox View"
          aria-label="Open fullscreen image view"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      )}

      {/* Subtle indicator for desktop users */}
      {isHoverSupported && (
        <div
          className={`absolute bottom-3 right-3 z-10 pointer-events-none text-[10px] font-sans font-bold tracking-wider uppercase px-2.5 py-1 rounded-md bg-black/60 text-offwhite backdrop-blur-xs transition-opacity duration-300 ${
            isZoomed ? 'opacity-0' : 'opacity-70 group-hover:opacity-90'
          }`}
        >
          Hover to zoom
        </div>
      )}
    </div>
  );
};
