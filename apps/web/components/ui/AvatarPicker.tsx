'use client';
import { motion } from 'framer-motion';

const AVATARS = ['🎭', '🦊', '🐺', '🦁', '🐯', '🦅', '🐉', '🦄', '👾', '🤖', '👻', '💀', '🎃', '🔥', '⚡', '🌙'];

interface AvatarPickerProps {
  selected: string;
  onChange: (avatar: string) => void;
}

export function AvatarPicker({ selected, onChange }: AvatarPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-body font-medium text-[rgba(255,255,255,0.5)] uppercase tracking-wider">
        Ton avatar
      </p>
      <div className="grid grid-cols-8 gap-2">
        {AVATARS.map(a => (
          <motion.button
            key={a}
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(a)}
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center text-xl
              transition-all duration-150 border
              ${selected === a
                ? 'border-[var(--amber-border)] bg-[var(--amber-surface)] shadow-[0_0_12px_rgba(217,119,6,0.2)]'
                : 'border-[var(--glass-border)] bg-[var(--glass-bg)] hover:border-[var(--glass-border-hover)]'
              }
            `}
          >
            {a}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
