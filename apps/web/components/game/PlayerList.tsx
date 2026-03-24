'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerState } from '@/stores/gameStore';

interface PlayerListProps {
  players: PlayerState[];
  myPlayerId: string;
  showReadyStatus?: boolean;
}

export function PlayerList({ players, myPlayerId, showReadyStatus = false }: PlayerListProps) {
  const connected = players.filter(p => p.isConnected);

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence>
        {connected.map((player, i) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: i * 0.05 }}
            className={`
              flex items-center gap-3 p-3 rounded-xl
              ${player.id === myPlayerId
                ? 'bg-violet-electric/20 border border-violet-electric/40'
                : 'glass-card border border-white/5'
              }
            `}
          >
            <div className="relative">
              <span className="text-2xl">{player.avatar}</span>
              {player.isHost && (
                <span className="absolute -top-1 -right-1 text-xs">👑</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-body font-medium text-[#F1F5F9] truncate">
                  {player.name}
                </span>
                {player.id === myPlayerId && (
                  <span className="text-xs text-violet-glow shrink-0">(toi)</span>
                )}
              </div>
              {showReadyStatus && (
                <div className="flex items-center gap-1 mt-0.5">
                  {player.mediaCount > 0 ? (
                    <span className="text-xs text-[#94A3B8]">{player.mediaCount} photo{player.mediaCount > 1 ? 's' : ''}</span>
                  ) : (
                    <span className="text-xs text-[#475569]">Aucune photo</span>
                  )}
                </div>
              )}
            </div>
            {showReadyStatus && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs
                  ${player.isReady
                    ? 'bg-green-success/20 border border-green-success/50 text-green-success'
                    : 'bg-white/5 border border-white/10 text-[#475569]'
                  }
                `}
              >
                {player.isReady ? '✓' : '…'}
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
