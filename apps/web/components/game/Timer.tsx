'use client';
import { motion } from 'framer-motion';

interface CircularTimerProps {
  progress: number; // 1 → 0
  timeLeft: number;
  size?: number;
}

export function CircularTimer({ progress, timeLeft, size = 56 }: CircularTimerProps) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);
  const secs = Math.ceil(timeLeft);
  const isUrgent = timeLeft <= 3;
  const color = isUrgent ? '#EF4444' : 'var(--amber-500)';

  return (
    <div
      className="glass-amber rounded-full flex items-center justify-center gap-1.5 px-3 py-1.5"
      style={{
        border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.3)' : 'var(--amber-border)'}`,
        boxShadow: `0 0 12px ${isUrgent ? 'rgba(239,68,68,0.15)' : 'rgba(217,119,6,0.15)'}`,
      }}
    >
      <svg width={18} height={18} className="-rotate-90 shrink-0">
        <circle cx={9} cy={9} r={7} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
        <circle
          cx={9} cy={9} r={7}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 7}
          strokeDashoffset={2 * Math.PI * 7 * (1 - progress)}
        />
      </svg>
      <motion.span
        key={secs}
        initial={{ opacity: 0.5, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="font-mono font-bold text-sm leading-none"
        style={{ color }}
      >
        {secs}s
      </motion.span>
    </div>
  );
}

export function AmberBorderTimer({ progress }: { progress: number }) {
  // Animated amber border around the photo that empties clockwise
  return (
    <div
      className="absolute inset-0 rounded-2xl pointer-events-none"
      style={{
        border: '2px solid transparent',
        background: `conic-gradient(from 0deg, rgba(217,119,6,0.6) ${progress * 360}deg, rgba(255,255,255,0.05) ${progress * 360}deg)`,
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        padding: '2px',
      }}
    />
  );
}

export function BarTimer({ progress, urgent }: { progress: number; urgent?: boolean }) {
  return (
    <div className="h-1 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden w-full">
      <motion.div
        className="h-full rounded-full"
        style={{
          width: `${progress * 100}%`,
          background: urgent ? 'rgba(239,68,68,0.7)' : 'rgba(217,119,6,0.7)',
          boxShadow: urgent ? '0 0 8px rgba(239,68,68,0.3)' : '0 0 8px rgba(217,119,6,0.3)',
        }}
        transition={{ duration: 0.1 }}
      />
    </div>
  );
}
