'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/gameStore';
import { getSocket } from '@/lib/socket';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';

type MediaMode = 'photo' | 'video' | 'both';
interface Settings { totalRounds: number; displayDuration: number; mediaMode: MediaMode; progressiveBlur: boolean; }

function OptionRow<T extends string | number>({
  label, options, value, onChange, format,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
  format?: (v: T) => string;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-sm font-display font-semibold text-[#F1F5F9]">{label}</p>
      <div className="flex gap-2">
        {options.map(opt => (
          <button
            key={String(opt)}
            onClick={() => onChange(opt)}
            className={`
              flex-1 py-2.5 rounded-xl font-body font-medium text-sm
              border transition-all duration-150
              ${value === opt
                ? 'border-[var(--amber-border)] bg-[var(--amber-surface)] text-[var(--amber-500)] shadow-[0_0_10px_rgba(217,119,6,0.15)]'
                : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:border-[var(--glass-border-hover)]'
              }
            `}
          >
            {format ? format(opt) : String(opt)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CreatePage() {
  const router  = useRouter();
  const store   = useGameStore();
  const [s, setS] = useState<Settings>({ totalRounds: 10, displayDuration: 5, mediaMode: 'photo', progressiveBlur: false });
  const [loading, setLoading] = useState(false);

  if (!store.playerName) { if (typeof window !== 'undefined') router.replace('/'); return null; }

  const handleCreate = () => {
    setLoading(true);
    const socket = getSocket(store.playerName, store.playerAvatar);
    socket.once('room:created', ({ code, playerId, player }) => {
      store.setRoomCode(code);
      store.setIdentity(playerId, player.name, player.avatar);
      store.setRoomSettings(s);
      store.addPlayer(player);
      router.push(`/room/${code}`);
    });
    socket.once('error', () => setLoading(false));
    socket.emit('room:create', { playerName: store.playerName, avatar: store.playerAvatar, settings: s });
  };

  return (
    <main className="min-h-screen flex flex-col bg-gradient-app relative overflow-hidden">
      <div className="orb-amber w-96 h-96 -top-32 -right-32 opacity-60" />

      <div className="relative z-10 w-full max-w-sm mx-auto px-5 pt-6 pb-10 flex flex-col gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[#F1F5F9] transition-colors mb-5">
            ← Retour
          </button>
          <h1 className="font-display font-bold text-2xl text-[#F1F5F9]">Nouvelle partie</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Configure les règles du jeu</p>
        </motion.div>

        <GlassCard animate className="p-5 flex flex-col gap-6">
          <OptionRow label="Nombre de tours" options={[5, 10, 15, 20] as number[]} value={s.totalRounds} onChange={v => setS(p => ({ ...p, totalRounds: v }))} />
          <OptionRow label="Durée par photo" options={[3, 5, 7, 10] as number[]} value={s.displayDuration} onChange={v => setS(p => ({ ...p, displayDuration: v }))} format={v => `${v}s`} />
          <OptionRow
            label="Type de média"
            options={['photo', 'video', 'both'] as MediaMode[]}
            value={s.mediaMode}
            onChange={v => setS(p => ({ ...p, mediaMode: v }))}
            format={v => v === 'photo' ? '📸 Photos' : v === 'video' ? '🎬 Vidéos' : '🎭 Les deux'}
          />

          {/* Progressive blur toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-display font-semibold text-[#F1F5F9]">Flou progressif</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">La photo se révèle lentement</p>
            </div>
            <button
              onClick={() => setS(p => ({ ...p, progressiveBlur: !p.progressiveBlur }))}
              className="relative w-11 h-6 rounded-full transition-all duration-200"
              style={{
                background: s.progressiveBlur ? 'var(--amber-600)' : 'rgba(255,255,255,0.1)',
                boxShadow: s.progressiveBlur ? '0 0 12px rgba(217,119,6,0.3)' : 'none',
              }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                style={{ transform: s.progressiveBlur ? 'translateX(21px)' : 'translateX(2px)' }}
              />
            </button>
          </div>
        </GlassCard>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Button size="lg" variant="primary" onClick={handleCreate} loading={loading}>
            🚀 Créer la partie
          </Button>
        </motion.div>
      </div>
    </main>
  );
}
