'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Animate a number from 0 to the target value with an ease-out curve.
 * Safe for hydration: initial state is 0, animation starts only when `end` changes.
 */
export const useCountUp = (end: number, duration = 800): number => {
  const [count, setCount] = useState(0);
  const prevEnd = useRef(0);

  useEffect(() => {
    if (end === prevEnd.current) return;
    prevEnd.current = end;

    if (end === 0) {
      setCount(0);
      return;
    }

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(end * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
};
