'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/gameStore';
import { getSocket } from '@/lib/socket';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { PlayerAvatar, PLAYER_COLORS } from '@/components/ui/PlayerAvatar';
import { QRCodeSVG } from 'qrcode.react';

const MAX_PLAYERS = 10;

export default function RoomPage({ params }: { params: { code: string } }) {
  const router  = useRouter();
  const store   = useGameStore();
  const { code } = params;
  const [showQR, setShowQR]       = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [copied, setCopied]       = useState(false);
  const initialized               = useRef(false);

  const players     = store.players;
  const myId        = store.playerId || '';
  const me          = players.find(p => p.id === myId);
  const isHost      = me?.isHost ?? false;
  const settings    = store.roomSettings;
  const connected   = players.filter(p => p.isConnected);
  const joinUrl     = typeof window !== 'undefined' ? `${window.location.origin}/join?code=${code}` : '';

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const socket = getSocket(store.playerName, store.playerAvatar, code);

    socket.on('room:playerJoined', ({ player }) => store.addPlayer(player));
    socket.on('room:playerLeft',   ({ playerId }) => store.removePlayer(playerId));
    socket.on('player:ready',      ({ playerId }) => store.updatePlayer(playerId, { isReady: true }));
    socket.on('player:uploadProgress', ({ playerId, mediaCount }) => store.updatePlayer(playerId, { mediaCount }));

    socket.on('game:starting', ({ countdown: c }) => {
      let n = c;
      setCountdown(n);
      const iv = setInterval(() => {
        n--;
        setCountdown(n);
        if (n <= 0) { clearInterval(iv); router.push(`/game/${code}`); }
      }, 1000);
    });

    return () => {
      socket.off('room:playerJoined');
      socket.off('room:playerLeft');
      socket.off('player:ready');
      socket.off('player:uploadProgress');
      socket.off('game:starting');
      initialized.current = false;
    };
  }, [code]);

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleStart = () => getSocket().emit('game:start');
  const goSelectPhotos = () => router.push(`/room/${code}/select`);

  const myPlayer = players.find(p => p.id === myId);
  const myReady  = myPlayer?.isReady ?? false;

  return (
    <main className="min-h-screen flex flex-col bg-gradient-app relative overflow-hidden">
      <div className="orb-amber w-80 h-80 -top-20 -right-20 opacity-50" />
      <div className="orb-blue  w-64 h-64 bottom-0 -left-20 opacity-60" />

      <div className="relative z-10 w-full max-w-sm mx-auto px-5 pt-6 pb-10 flex flex-col gap-5">

        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-body">Salle d'attente</p>
            <p className="text-lg font-display font-bold text-[#F1F5F9] mt-0.5">{connected.length} joueur{connected.length > 1 ? 's' : ''} connecté{connected.length > 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowQR(v => !v)}
            className="w-10 h-10 rounded-xl glass border border-[var(--glass-border)] flex items-center justify-center text-lg hover:border-[var(--glass-border-hover)] transition-all"
          >
            📱
          </button>
        </motion.div>

        {/* Code room card */}
        <GlassCard variant="amber" animate className="p-4">
          <p className="text-xs font-body text-[var(--amber-text)] uppercase tracking-wider mb-2">Code de la partie</p>
          <p className="font-mono font-black text-4xl tracking-[0.5em] text-[var(--amber-500)]" style={{ letterSpacing: '0.5em' }}>
            {code}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={copyLink} className="text-xs text-[var(--text-secondary)] hover:text-[#F1F5F9] transition-colors flex items-center gap-1">
              {copied ? '✓ Copié !' : '📋 Copier le lien'}
            </button>
            <button onClick={() => setShowQR(v => !v)} className="text-xs text-[var(--text-secondary)] hover:text-[#F1F5F9] transition-colors flex items-center gap-1">
              QR Code
            </button>
          </div>
          <AnimatePresence>
            {showQR && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-4 flex justify-center">
                  <div className="bg-white p-3 rounded-xl">
                    <QRCodeSVG value={joinUrl} size={140} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Players */}
        <GlassCard animate className="p-4 flex flex-col gap-3">
          <p className="text-sm font-display font-semibold text-[#F1F5F9]">Joueurs</p>
          <div className="flex flex-col gap-2">
            {connected.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 py-2 px-3 rounded-2xl"
                style={{
                  background: player.id === myId ? `${PLAYER_COLORS[i % 8]}11` : 'transparent',
                  border: player.id === myId ? `1px solid ${PLAYER_COLORS[i % 8]}22` : '1px solid transparent',
                }}
              >
                <PlayerAvatar emoji={player.avatar} colorIndex={i} isHost={player.isHost} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-body font-medium text-[#F1F5F9] truncate">{player.name}</span>
                    {player.id === myId && <span className="text-xs text-[var(--text-tertiary)]">(toi)</span>}
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {player.mediaCount > 0 ? `${player.mediaCount} photo${player.mediaCount > 1 ? 's' : ''}` : 'Aucune photo'}
                  </span>
                </div>
                {player.isReady ? (
                  <span className="text-xs px-2 py-0.5 rounded-full font-body font-medium bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.25)] text-[#10B981]">
                    Prêt
                  </span>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">…</span>
                )}
              </motion.div>
            ))}
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 3 - connected.length) }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-2xl border border-dashed border-[var(--glass-border)]">
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-[var(--glass-border)] flex items-center justify-center text-lg text-[var(--text-muted)]">+</div>
                <span className="text-sm text-[var(--text-muted)]">En attente...</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Settings pills */}
        {settings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-2">
            {[
              `${settings.totalRounds} tours`,
              `${settings.displayDuration}s par photo`,
              settings.mediaMode === 'photo' ? 'Photos' : settings.mediaMode === 'video' ? 'Vidéos' : 'Photos + Vidéos',
              settings.progressiveBlur && 'Flou progressif',
            ].filter(Boolean).map((tag) => (
              <span key={String(tag)} className="text-xs px-3 py-1 rounded-full glass border border-[var(--glass-border)] text-[var(--text-secondary)]">
                {tag}
              </span>
            ))}
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {!myReady && (
            <Button variant="secondary" size="lg" onClick={goSelectPhotos}>
              📸 Choisir mes photos
            </Button>
          )}
          {myReady && (
            <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)]">
              <span className="text-[#10B981] text-sm font-body font-medium">✓ Photos uploadées — prêt !</span>
            </div>
          )}
          {isHost && (
            <Button variant="primary" size="lg" onClick={handleStart} disabled={connected.length < 3}>
              🚀 Lancer la partie
            </Button>
          )}
          {!isHost && (
            <p className="text-center text-xs text-[var(--text-muted)] font-body">
              En attente du host pour lancer...
            </p>
          )}
          {isHost && connected.length < 3 && (
            <p className="text-center text-xs text-[var(--text-muted)] font-body">
              Il faut au moins 3 joueurs pour commencer
            </p>
          )}
        </div>
      </div>

      {/* Countdown overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(11,17,32,0.85)', backdropFilter: 'blur(20px)' }}
          >
            <div className="text-center">
              <p className="text-[var(--text-secondary)] font-body mb-3">La partie commence dans</p>
              <motion.p
                key={countdown}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.4, opacity: 0 }}
                className="font-display font-black text-9xl"
                style={{ color: 'var(--amber-500)', textShadow: '0 0 60px rgba(217,119,6,0.5)' }}
              >
                {countdown}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
