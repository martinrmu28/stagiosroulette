'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { ScoreEntry } from '@/stores/gameStore';
import { PlayerAvatar, PLAYER_COLORS } from '@/components/ui/PlayerAvatar';

interface ScoreBoardProps {
  scores: ScoreEntry[];
  myPlayerId: string;
  compact?: boolean;
}

export function ScoreBoard({ scores, myPlayerId, compact = false }: ScoreBoardProps) {
  const max = scores[0]?.score || 1;

  return (
    <div className="flex flex-col gap-2 w-full">
      <AnimatePresence>
        {scores.map((entry, i) => {
          const isMe  = entry.playerId === myPlayerId;
          const color = PLAYER_COLORS[i % 8];
          const pct   = max > 0 ? (entry.score / max) * 100 : 0;

          return (
            <motion.div
              key={entry.playerId}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
              style={{
                background: isMe ? `${color}10` : 'var(--glass-bg)',
                backdropFilter: 'blur(40px)',
                border: isMe ? `1px solid ${color}30` : '1px solid var(--glass-border)',
              }}
            >
              <span className="w-5 text-center font-display font-bold text-sm"
                style={{ color: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#D97706' : 'var(--text-muted)' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </span>
              <PlayerAvatar emoji={entry.avatar} colorIndex={i} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body truncate text-[#F1F5F9]">
                    {entry.name}{isMe && <span className="ml-1 text-xs text-[var(--text-tertiary)]">(moi)</span>}
                  </span>
                  <motion.span
                    key={entry.score}
                    initial={{ scale: 1.4, color: 'var(--amber-500)' }}
                    animate={{ scale: 1, color: '#F1F5F9' }}
                    className="text-sm font-display font-bold ml-2 shrink-0"
                  >
                    {entry.score}
                  </motion.span>
                </div>
                {!compact && (
                  <div className="mt-1 h-0.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* Compact mini-bar for top of game screen */
export function MiniScoreBar({ scores, myPlayerId }: { scores: ScoreEntry[]; myPlayerId: string }) {
  if (scores.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
      {scores.slice(0, 6).map((s, i) => (
        <div
          key={s.playerId}
          className="flex flex-col items-center gap-0.5 shrink-0"
          style={{ opacity: s.playerId === myPlayerId ? 1 : 0.6 }}
        >
          <span className="text-xs">{s.avatar}</span>
          <span className="text-[10px] font-mono text-[var(--amber-500)]">{s.score}</span>
        </div>
      ))}
    </div>
  );
}
