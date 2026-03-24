'use client';
import { Suspense, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '@/stores/gameStore';
import { getSocket } from '@/lib/socket';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';

function JoinForm() {
  const router = useRouter();
  const params = useSearchParams();
  const store  = useGameStore();
  const [code, setCode]     = useState(params.get('code') || '');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { const c = params.get('code'); if (c) setCode(c); }, [params]);

  if (!store.playerName && typeof window !== 'undefined') { router.replace('/'); return null; }

  const handleJoin = () => {
    if (code.length !== 6) { setError('Code à 6 chiffres'); return; }
    setLoading(true);
    const socket = getSocket(store.playerName, store.playerAvatar);

    socket.once('room:joined', ({ code: rc, playerId, player, room }) => {
      store.setRoomCode(rc);
      store.setIdentity(playerId, player.name, player.avatar);
      store.setPlayers(room.players);
      store.setRoomSettings(room.settings);
      router.push(`/room/${rc}`);
    });
    socket.once('error', ({ message }: { message: string }) => { setError(message); setLoading(false); });
    socket.emit('room:join', { code, playerName: store.playerName, avatar: store.playerAvatar });
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-app relative overflow-hidden px-5">
      <div className="orb-blue w-96 h-96 -bottom-32 -left-32 opacity-80" />

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[#F1F5F9] transition-colors mb-5">
            ← Retour
          </button>
          <h1 className="font-display font-bold text-2xl text-[#F1F5F9]">Rejoindre</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Entre le code de la partie</p>
        </motion.div>

        <GlassCard animate className="p-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-body font-medium text-[rgba(255,255,255,0.5)] uppercase tracking-wider">Code de la partie</p>
            <input
              value={code}
              onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              placeholder="000000"
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]*"
              className="
                w-full py-4 rounded-2xl glass border border-[var(--glass-border)]
                text-center font-mono font-bold text-4xl tracking-[0.5em]
                text-[var(--amber-500)] placeholder-[rgba(255,255,255,0.15)]
                focus:outline-none focus:border-[var(--amber-border)]
                transition-all duration-200
              "
              style={{ letterSpacing: '0.5em' }}
            />
            {error && <p className="text-xs text-[#EF4444] text-center">{error}</p>}
          </div>
        </GlassCard>

        <Button size="lg" variant="primary" onClick={handleJoin} loading={loading} disabled={code.length !== 6}>
          Rejoindre →
        </Button>
      </div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-deep flex items-center justify-center"><div className="w-6 h-6 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" /></div>}>
      <JoinForm />
    </Suspense>
  );
}
