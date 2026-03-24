'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/gameStore';
import { Confetti } from '@/components/game/Confetti';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { PlayerAvatar, PLAYER_COLORS } from '@/components/ui/PlayerAvatar';

export default function ResultsPage() {
  const router = useRouter();
  const store  = useGameStore();
  const [confetti, setConfetti] = useState(true);
  const { finalScores, gameStats, playerId } = store;

  useEffect(() => {
    const t = setTimeout(() => setConfetti(false), 6000);
    return () => clearTimeout(t);
  }, []);

  const top3 = finalScores.slice(0, 3);
  const rest = finalScores.slice(3);

  // Podium order: 2nd (left) | 1st (center, taller) | 3rd (right)
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumHeights = ['h-24', 'h-36', 'h-16'];
  const podiumGolds   = [false, true, false];

  return (
    <main className="min-h-screen flex flex-col bg-gradient-app relative overflow-hidden pb-12">
      <Confetti active={confetti} />
      <div className="orb-amber w-[500px] h-[500px] -top-40 -right-40 opacity-40" />
      <div className="orb-blue  w-[400px] h-[400px] -bottom-20 -left-20 opacity-50" />

      <div className="relative z-10 w-full max-w-sm mx-auto px-5 pt-8 flex flex-col gap-6">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-3xl mb-1">🏆</p>
          <h1 className="font-display font-extrabold text-2xl text-[#F1F5F9]">Résultats finaux</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Partie terminée !</p>
        </motion.div>

        {/* Podium */}
        {top3.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-end justify-center gap-3 px-2">
            {podiumOrder.map((entry, posIdx) => {
              if (!entry) return <div key={posIdx} className="flex-1" />;
              const realIdx = finalScores.findIndex(s => s.playerId === entry.playerId);
              const isFirst = realIdx === 0;
              const heights = ['h-24', 'h-36', 'h-16'];
              const podH = posIdx === 1 ? heights[1] : posIdx === 0 ? heights[0] : heights[2];
              const medalColor = realIdx === 0 ? '#F59E0B' : realIdx === 1 ? '#94A3B8' : '#D97706';

              return (
                <motion.div
                  key={entry.playerId}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + posIdx * 0.15, type: 'spring', stiffness: 140 }}
                  className="flex flex-col items-center gap-2 flex-1"
                >
                  {isFirst && (
                    <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-xl">
                      👑
                    </motion.span>
                  )}
                  <span className="text-2xl">{entry.avatar}</span>
                  <p className="text-xs font-body text-[#F1F5F9] text-center truncate w-full">{entry.name}</p>
                  <p className="text-sm font-display font-bold" style={{ color: medalColor }}>{entry.score}</p>
                  <motion.div
                    className={`w-full ${podH} rounded-t-xl flex items-center justify-center`}
                    initial={{ height: 0 }}
                    animate={{ height: undefined }}
                    transition={{ delay: 0.5 + posIdx * 0.1, duration: 0.5, type: 'spring' }}
                    style={{
                      background: isFirst
                        ? `linear-gradient(to bottom, rgba(217,119,6,0.3), rgba(11,17,32,0.95))`
                        : 'var(--glass-bg)',
                      border: isFirst ? '1px solid var(--amber-border)' : '1px solid var(--glass-border)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: isFirst ? '0 0 20px rgba(217,119,6,0.15)' : 'none',
                    }}
                  >
                    <span className="font-display font-black text-2xl" style={{ color: medalColor }}>
                      {realIdx + 1}
                    </span>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Rest */}
        {rest.length > 0 && (
          <GlassCard animate className="p-4 flex flex-col gap-2">
            {rest.map((entry, i) => (
              <div key={entry.playerId} className={`flex items-center gap-3 py-2 px-2 rounded-xl ${entry.playerId === playerId ? 'bg-[rgba(217,119,6,0.06)]' : ''}`}>
                <span className="w-5 text-center text-sm text-[var(--text-muted)] font-display font-bold">{i + 4}</span>
                <PlayerAvatar emoji={entry.avatar} colorIndex={i + 3} size="sm" />
                <span className="flex-1 text-sm font-body text-[#F1F5F9] truncate">
                  {entry.name}
                  {entry.playerId === playerId && <span className="ml-1 text-xs text-[var(--text-tertiary)]">(moi)</span>}
                </span>
                <span className="text-sm font-display font-bold text-[var(--text-secondary)]">{entry.score}</span>
              </div>
            ))}
          </GlassCard>
        )}

        {/* Stats */}
        {gameStats && (gameStats.fastestAnswer || gameStats.mostMysteriousPlayer) && (
          <GlassCard animate className="p-4 flex flex-col gap-3">
            <p className="text-sm font-display font-semibold text-[#F1F5F9]">Stats de la partie</p>
            {gameStats.fastestAnswer && (
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--amber-surface)', border: '1px solid var(--amber-border)' }}>
                <span className="text-xl">⚡</span>
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Réponse la plus rapide</p>
                  <p className="text-sm font-display font-semibold text-[#F1F5F9]">
                    {gameStats.fastestAnswer.playerName} — {(gameStats.fastestAnswer.time / 1000).toFixed(1)}s
                  </p>
                </div>
              </div>
            )}
            {gameStats.mostMysteriousPlayer && (
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <span className="text-xl">🕵️</span>
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Le plus mystérieux</p>
                  <p className="text-sm font-display font-semibold text-[#F1F5F9]">{gameStats.mostMysteriousPlayer.name}</p>
                </div>
              </div>
            )}
          </GlassCard>
        )}

        {/* Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex flex-col gap-3">
          <Button variant="primary" size="lg" onClick={() => { store.reset(); router.push('/'); }}>
            🏠 Nouvelle partie
          </Button>
        </motion.div>
      </div>
    </main>
  );
}
