'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export const OrderSuccessConfetti = () => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#103D42', '#DFC3A0', '#C5A070'],
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  return null;
};
