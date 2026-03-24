'use client';
import { motion } from 'framer-motion';
import { useTimer } from '@/hooks/useTimer';
import { CircularTimer, AmberBorderTimer } from './Timer';

import { getServerUrl } from '@/lib/serverUrl';
const SERVER_URL = getServerUrl();

const ENTRY_VARIANTS = [
  { initial: { x: '60%', opacity: 0 }, animate: { x: 0, opacity: 1 } },
  { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 } },
  { initial: { opacity: 0 },            animate: { opacity: 1 } },
];

interface PhotoDisplayProps {
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  duration: number;
  progressiveBlur: boolean;
  roundNumber: number;
  totalRounds: number;
  onComplete?: () => void;
}

export function PhotoDisplay({ mediaUrl, mediaType, duration, progressiveBlur, roundNumber, totalRounds, onComplete }: PhotoDisplayProps) {
  const { timeLeft, progress } = useTimer(duration, onComplete, true);
  const blurPx  = progressiveBlur ? Math.round(20 * progress) : 0;
  const fullUrl = `${SERVER_URL}${mediaUrl}`;
  const entry   = ENTRY_VARIANTS[roundNumber % ENTRY_VARIANTS.length];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-bg-deep">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10">
        <div className="glass-amber rounded-full px-3 py-1 border border-[var(--amber-border)]">
          <span className="font-mono font-bold text-sm text-[var(--amber-500)]">{roundNumber}/{totalRounds}</span>
        </div>
        <CircularTimer progress={progress} timeLeft={timeLeft} />
      </div>

      {/* Photo */}
      <div className="relative w-full px-4 mt-14">
        <motion.div
          className="relative rounded-2xl overflow-hidden"
          initial={entry.initial}
          animate={entry.animate}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {mediaType === 'photo' ? (
            <img
              src={fullUrl}
              alt="Photo du tour"
              className="w-full max-h-[60vh] object-contain"
              style={{ filter: `blur(${blurPx}px)`, transition: 'filter 0.4s ease' }}
            />
          ) : (
            <video
              src={fullUrl}
              autoPlay muted playsInline loop
              className="w-full max-h-[60vh] object-contain"
              style={{ filter: `blur(${blurPx}px)`, transition: 'filter 0.4s ease' }}
            />
          )}
          {/* Amber border timer */}
          <AmberBorderTimer progress={progress} />
        </motion.div>
      </div>

      {/* Question */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute bottom-8 text-center font-display font-semibold text-[var(--text-secondary)] text-sm px-8"
      >
        À qui appartient cette photo ?
      </motion.p>
    </div>
  );
}
