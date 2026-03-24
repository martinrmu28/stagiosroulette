'use client';
import { useState, useEffect, useRef } from 'react';
import { sounds } from '@/lib/sounds';

export function useTimer(duration: number, onComplete?: () => void, playTicks = false) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [progress, setProgress] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    setTimeLeft(duration);
    setProgress(1);

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, duration * 1000 - elapsed);
      const secs = remaining / 1000;
      setTimeLeft(secs);
      setProgress(remaining / (duration * 1000));

      if (playTicks && Math.floor(secs) !== Math.floor(secs + 0.1)) {
        sounds.play('tick');
      }

      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        onComplete?.();
      }
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [duration]);

  return { timeLeft, progress };
}
