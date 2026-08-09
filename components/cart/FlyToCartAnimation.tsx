'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FlyingImage {
  id: string;
  src: string;
  startX: number;
  startY: number;
}

interface FlyToCartAnimationProps {
  flyingImages: FlyingImage[];
  onAnimationComplete: (id: string) => void;
}

export const FlyToCartAnimation: React.FC<FlyToCartAnimationProps> = ({
  flyingImages,
  onAnimationComplete,
}) => {
  const [targetPos, setTargetPos] = useState<{ x: number; y: number }>({ x: 800, y: 30 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cartBtn = document.getElementById('header-cart-button');
      if (cartBtn) {
        const rect = cartBtn.getBoundingClientRect();
        setTargetPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      } else {
        setTargetPos({ x: window.innerWidth - 80, y: 30 });
      }
    }
  }, []);

  return (
    <AnimatePresence>
      {flyingImages.map((img) => (
        <motion.div
          key={img.id}
          initial={{
            position: 'fixed',
            left: img.startX,
            top: img.startY,
            width: 80,
            height: 100,
            opacity: 1,
            scale: 1,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
          animate={{
            left: targetPos.x - 20,
            top: targetPos.y - 25,
            width: 30,
            height: 40,
            opacity: 0.2,
            scale: 0.3,
            rotate: 12,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          onAnimationComplete={() => onAnimationComplete(img.id)}
          className="rounded-xl overflow-hidden shadow-2xl border-2 border-champagne"
        >
          <img src={img.src} alt="Flying item" className="w-full h-full object-cover" />
        </motion.div>
      ))}
    </AnimatePresence>
  );
};
