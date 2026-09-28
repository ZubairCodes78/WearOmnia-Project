'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Calendar, ArrowRight, X } from 'lucide-react';
import { isPreOrderCampaignActive } from '@/lib/preorder';
import { useSettings } from '@/context/SettingsContext';

interface PreOrderLaunchOverlayProps {
  forceShowForTesting?: boolean;
}

export function PreOrderLaunchOverlay({ forceShowForTesting = false }: PreOrderLaunchOverlayProps) {
  const { settings } = useSettings();
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const advancePercent = settings.preorder_advance_percent || 50;

  useEffect(() => {
    // 1. Verify if Pre-Order Campaign window is active (2026-09-29 to 2026-10-20 Asia/Karachi)
    const isCampaignActive = isPreOrderCampaignActive();

    // 2. Safe check for session-level first visit
    let alreadySeen = false;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        alreadySeen = window.sessionStorage.getItem('wearomnia_preorder_launch_seen') === 'true';
      }
    } catch {
      // In private browsing or storage disabled environments, fallback safely
      alreadySeen = false;
    }

    if ((isCampaignActive && !alreadySeen) || forceShowForTesting) {
      setIsVisible(true);

      // Auto-dismiss smoothly after 2.2 seconds (target 1.5–2.5 seconds per specification)
      const timer = setTimeout(() => {
        dismiss();
      }, 2200);

      // Dismiss on Escape key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') dismiss();
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [forceShowForTesting]);

  const dismiss = () => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('wearomnia_preorder_launch_seen', 'true');
      }
    } catch {
      // Fallback
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="preorder-launch-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}
          onClick={dismiss}
          role="dialog"
          aria-modal="true"
          aria-label="Pre-Order Launch Announcement"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#06191B]/96 backdrop-blur-md cursor-pointer select-none px-4"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)] pointer-events-none" />

          {/* Quick Skip button in top corner */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismiss();
            }}
            className="absolute top-6 right-6 p-2 rounded-full text-[#FAF8F5]/60 hover:text-[#D4AF37] hover:bg-teal-900/40 transition-colors cursor-pointer text-xs flex items-center gap-1.5"
            aria-label="Skip to store"
          >
            <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:inline">Skip</span>
            <X className="w-4 h-4" />
          </button>

          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -6 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 max-w-lg w-full text-center space-y-5 px-6 py-8"
          >
            {/* Brand Monogram / Eyebrow */}
            <div className="flex items-center justify-center gap-2">
              <span className="w-6 h-px bg-[#D4AF37]/40" />
              <span className="font-calligraphy text-xs sm:text-sm text-[#D4AF37] tracking-[0.25em] uppercase">
                WearOMNIA Atelier
              </span>
              <span className="w-6 h-px bg-[#D4AF37]/40" />
            </div>

            {/* Launch Banner Headline */}
            <div className="space-y-2">
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#FAF8F5] tracking-tight leading-tight">
                Pre-Order Is <span className="text-[#D4AF37] italic font-normal">Now Open</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#FAF8F5]/75 font-sans max-w-sm mx-auto leading-relaxed">
                Limited Autumn / Winter 2026 Collection • {advancePercent}% Advance Booking With Payment Proof
              </p>
            </div>

            {/* Micro Badge */}
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#103A3E] text-[#D4AF37] border border-[#D4AF37]/30 text-[10.5px] font-bold tracking-wider uppercase font-mono">
                <Calendar className="w-3 h-3 text-[#D4AF37]" /> 29 Sep – 20 Oct 2026
              </span>
            </div>

            <p className="text-[10px] text-[#FAF8F5]/40 font-mono tracking-widest uppercase pt-4">
              Tap anywhere to enter storefront
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
