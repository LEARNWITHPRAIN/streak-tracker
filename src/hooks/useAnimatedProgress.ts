import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook that animates progress value from 0 (or previous value) to target in realtime.
 * Uses requestAnimationFrame with cubic ease-out for a smooth 60fps counter animation.
 */
export const useAnimatedProgress = (target: number, duration: number = 800): number => {
  const [value, setValue] = useState(0);
  const currentRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const startValRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startValRef.current = currentRef.current;
    startTimeRef.current = null;

    if (startValRef.current === target) {
      setValue(target);
      return;
    }

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth easeOutCubic curve: 1 - (1 - t)^3
      const ease = 1 - Math.pow(1 - progress, 3);
      const nextVal = Math.round(startValRef.current + (target - startValRef.current) * ease);

      currentRef.current = nextVal;
      setValue(nextVal);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        currentRef.current = target;
        setValue(target);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, duration]);

  return value;
};
