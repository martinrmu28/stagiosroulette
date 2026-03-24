'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerState } from '@/stores/gameStore';
import { BarTimer } from './Timer';
import { PlayerAvatar, PLAYER_COLORS } from '@/components/ui/PlayerAvatar';

const GUESS_DURATION = 5;

interface GuessButtonsProps {
  players: PlayerState[];
  myPlayerId: string;
  myGuess: string | null;
  onGuess: (playerId: string) => void;
  guessedCount?: number; // how many players have guessed
}

export function GuessButtons({ players, myPlayerId, myGuess, onGuess, guessedCount = 0 }: GuessButtonsProps) {
  const [progress, setProgress] = useState(1);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    const iv = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const p = Math.max(0, 1 - elapsed / (GUESS_DURATION * 1000));
      setProgress(p);
      if (p <= 0) clearInterval(iv);
    }, 80);
    return () => clearInterval(iv);
  }, []);

  const eligible = players.filter(p => p.id !== myPlayerId && p.isConnected);
  const guessedNames = players.filter((_, i) => i < guessedCount).map(p => p.name);

  return (
    <div className="flex flex-col gap-4 w-full px-4">
      {/* Timer */}
      <BarTimer progress={progress} urgent={progress < 0.35} />

      {/* Guess grid */}
      <div className={`grid gap-3 ${eligible.length <= 4 ? 'grid-cols-2' : 'grid-cols-2'}`}>
        {eligible.map((player, i) => {
          const selected = myGuess === player.id;
          const color    = PLAYER_COLORS[players.indexOf(player) % 8];

          return (
            <motion.button
              key={player.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onGuess(player.id)}
              className="relative flex items-center gap-3 p-4 rounded-2xl overflow-hidden transition-all duration-150 min-h-[64px]"
              style={{
                background: selected ? `${color}18` : 'var(--glass-bg)',
                backdropFilter: 'blur(40px)',
                border: selected
                  ? `1.5px solid ${color}55`
                  : '1px solid var(--glass-border)',
                boxShadow: selected ? `0 0 16px ${color}22` : 'none',
              }}
            >
              <PlayerAvatar emoji={player.avatar} colorIndex={players.indexOf(player)} size="sm" />
              <span className="font-display font-semibold text-sm text-[#F1F5F9] truncate flex-1 text-left">
                {player.name}
              </span>
              {selected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-base shrink-0"
                  style={{ color: 'var(--amber-500)' }}
                >
                  ✓
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Live activity */}
      {guessedCount > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-[var(--text-secondary)] font-body"
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10B981] mr-1.5 animate-pulse" />
          {guessedCount} joueur{guessedCount > 1 ? 's ont' : ' a'} répondu
        </motion.p>
      )}

      {!myGuess && (
        <p className="text-center text-xs text-[var(--text-muted)] font-body">
          Tap sur un nom pour voter
        </p>
      )}
    </div>
  );
}
