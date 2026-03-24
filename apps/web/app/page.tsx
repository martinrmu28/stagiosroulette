'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/gameStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AvatarPicker } from '@/components/ui/AvatarPicker';

export default function HomePage() {
  const router = useRouter();
  const store = useGameStore();
  const [name, setName]     = useState(store.playerName || '');
  const [avatar, setAvatar] = useState(store.playerAvatar || '🎭');
  const [error, setError]   = useState('');

  const go = (path: string) => {
    if (!name.trim()) { setError('Entre ton pseudo !'); return; }
    store.setIdentity('', name.trim(), avatar);
    router.push(path);
  };

  return (
    <main className="min-h-screen flex flex-col bg-gradient-app relative overflow-hidden">
      {/* Background orbs */}
      <div className="orb-amber w-[600px] h-[600px] -top-48 -right-48 opacity-70" />
      <div className="orb-blue  w-[500px] h-[500px] -bottom-32 -left-32 opacity-80" />

      <div className="relative z-10 flex flex-col items-center px-5 pt-12 pb-10 gap-8 max-w-sm mx-auto w-full">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-2xl">📸</span>
            <h1 className="font-display font-extrabold text-3xl tracking-tight text-[#F1F5F9]">
              Stagios<span style={{ color: 'var(--amber-500)' }}>Roulette</span>
            </h1>
          </div>
          <p className="text-sm font-body text-[var(--text-secondary)]">
            Devinez à qui appartient la photo
          </p>
        </motion.div>

        {/* Hero block */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full rounded-3xl overflow-hidden relative"
          style={{ aspectRatio: '4/3' }}
        >
          {/* Hero image */}
          <img
            src="/images/hero.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Gradient overlay bottom */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(11,17,32,0.95) 0%, rgba(11,17,32,0.5) 40%, rgba(11,17,32,0.1) 100%)',
            }}
          />
{/* Bottom text */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="font-display font-bold text-lg text-[#F1F5F9]">Qui se cache derrière cette photo ?</p>
            <p className="text-sm font-body text-[var(--text-secondary)] mt-0.5">3 à 10 joueurs • 100% anonyme</p>
          </div>
        </motion.div>

        {/* Identity form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="w-full glass rounded-3xl p-5 flex flex-col gap-5"
        >
          <Input
            label="Ton pseudo"
            placeholder="Entre ton pseudo..."
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            error={error}
            maxLength={20}
            autoComplete="off"
          />
          <AvatarPicker selected={avatar} onChange={setAvatar} />
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          className="w-full flex flex-col gap-3"
        >
          <Button size="lg" variant="primary" onClick={() => go('/create')}>
            🎮 Créer une partie
          </Button>
          <Button size="lg" variant="secondary" onClick={() => go('/join')}>
            🔗 Rejoindre avec un code
          </Button>
        </motion.div>

        <p className="text-xs text-[var(--text-muted)] font-body text-center">
          Photos supprimées automatiquement après la partie
        </p>
      </div>
    </main>
  );
}
