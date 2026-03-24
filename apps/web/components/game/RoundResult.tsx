'use client';
import { motion } from 'framer-motion';
import { RoundResult, PlayerState } from '@/stores/gameStore';
import { PlayerAvatar, PLAYER_COLORS } from '@/components/ui/PlayerAvatar';

import { getServerUrl } from '@/lib/serverUrl';
const SERVER_URL = getServerUrl();

interface Props {
  result: RoundResult;
  players: PlayerState[];
  myPlayerId: string;
}

export function RoundResultDisplay({ result, players, myPlayerId }: Props) {
  const owner     = players.find(p => p.id === result.correctPlayerId);
  const ownerIdx  = players.findIndex(p => p.id === result.correctPlayerId);
  const myGuess   = result.guesses[myPlayerId];
  const wasRight  = myGuess === result.correctPlayerId;
  const myPoints  = result.pointsAwarded[myPlayerId] || 0;
  const ownerPts  = result.pointsAwarded[result.correctPlayerId] || 0;

  return (
    <div className="flex flex-col items-center gap-5 px-5 py-4 w-full">

      {/* Photo + owner */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        <div className="relative">
          <img
            src={`${SERVER_URL}${result.mediaUrl}`}
            alt=""
            className="w-44 h-44 object-cover rounded-2xl border border-[var(--glass-border)]"
          />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 260 }}
            className="absolute -bottom-3 -right-3 rounded-full border-2 border-bg-deep"
          >
            <PlayerAvatar emoji={owner?.avatar ?? '?'} colorIndex={ownerIdx} size="md" />
          </motion.div>
        </div>
      </motion.div>

      {/* Owner name */}
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-center">
        <p className="text-xs text-[var(--text-secondary)] mb-1">C'était la photo de</p>
        <p className="font-display font-bold text-2xl text-[#F1F5F9]">{owner?.name ?? '?'}</p>
        {ownerPts > 0 && (
          <p className="text-xs text-[var(--amber-text)] mt-0.5">+{ownerPts} pts bonus (personne n'a trouvé)</p>
        )}
      </motion.div>

      {/* My result badge */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring' }}
        className="px-5 py-2.5 rounded-2xl flex items-center gap-2 font-display font-bold text-base"
        style={{
          background: wasRight ? 'rgba(16,185,129,0.12)' : myGuess ? 'rgba(239,68,68,0.10)' : 'rgba(255,255,255,0.04)',
          border: wasRight ? '1px solid rgba(16,185,129,0.3)' : myGuess ? '1px solid rgba(239,68,68,0.25)' : '1px solid var(--glass-border)',
          color: wasRight ? '#10B981' : myGuess ? '#EF4444' : 'var(--text-secondary)',
        }}
      >
        {wasRight ? '✓ Bonne réponse !' : myGuess ? '✗ Mauvaise réponse' : '— Pas de réponse'}
        {myPoints > 0 && <span className="text-sm opacity-80">+{myPoints} pts</span>}
      </motion.div>

      {/* All guesses */}
      <div className="w-full flex flex-col gap-2">
        <p className="text-xs text-[var(--text-muted)] text-center mb-1">Résultats du tour</p>
        {players.filter(p => p.id !== result.correctPlayerId && p.isConnected).map((player, i) => {
          const guess        = result.guesses[player.id];
          const guessedPlayer = players.find(p => p.id === guess);
          const correct      = guess === result.correctPlayerId;
          const pts          = result.pointsAwarded[player.id] || 0;
          const playerIdx    = players.findIndex(p2 => p2.id === player.id);

          return (
            <motion.div
              key={player.id}
              initial={{ x: -12, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
              style={{
                background: correct ? 'rgba(16,185,129,0.08)' : 'var(--glass-bg)',
                border: correct ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--glass-border)',
              }}
            >
              <PlayerAvatar emoji={player.avatar} colorIndex={playerIdx} size="sm" />
              <span className="text-sm font-body text-[#F1F5F9] flex-1 truncate">{player.name}</span>
              {guess ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-[var(--text-secondary)]">→ {guessedPlayer?.name ?? '?'}</span>
                  <span className="text-xs font-display font-bold" style={{ color: correct ? '#10B981' : '#EF4444' }}>
                    {correct ? `+${pts}` : '✗'}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-[var(--text-muted)]">—</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
